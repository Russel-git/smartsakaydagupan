const User = require('../models/User');
const Otp = require('../models/Otp');
const apiResponse = require('../utils/apiResponse');
const generateOtp = require('../utils/generateOtp');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const emailService = require('../services/emailService');
const config = require('../config/env');
const { logAuditEvent } = require('../utils/auditLogger');


const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, suffix = '' } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return apiResponse.error(res, 'Email already registered', 409);

    // Delete any prior unverified registration OTPs for this email
    await Otp.deleteMany({ email: email.toLowerCase(), type: 'registration' });

    // Generate 6-digit OTP code
    const otpCode = generateOtp();

    // Dispatch code to user's email via emailService FIRST
    // If sending fails (e.g. invalid email, unconfigured SMTP), we reject immediately
    await emailService.sendOtp(email, otpCode, 'registration');

    // Store pending registration data inside the Otp record ONLY upon successful email dispatch:
    await Otp.create({
      email: email.toLowerCase(),
      code: otpCode,
      type: 'registration',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      registrationData: {
        firstName,
        lastName,
        suffix: suffix?.trim() || '',
        password,
      },
    });

    return apiResponse.success(
      res,
      {
        email: email.toLowerCase(),
        requiresVerification: true,
      },
      'Verification code sent to your email. Please check your inbox and enter the 6-digit code to complete account creation.',
      201
    );
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      type: { $in: ['registration', 'login'] },
    }).sort({ createdAt: -1 });

    if (!otpRecord) return apiResponse.error(res, 'No OTP found. Please request a new one.', 400);
    if (otpRecord.expiresAt < new Date()) return apiResponse.error(res, 'OTP has expired. Please request a new one.', 400);
    if (otpRecord.attempts >= 5) return apiResponse.error(res, 'Maximum OTP attempts exceeded. Please request a new one.', 429);

    const isValid = await otpRecord.compareCode(code);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return apiResponse.error(res, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`, 400);
    }

    let user;
    // ACCOUNT IS CREATED ONLY HERE, ONCE THE CODE IS PROVEN CORRECT!
    if (otpRecord.type === 'registration' && otpRecord.registrationData) {
      const { firstName, lastName, suffix, password } = otpRecord.registrationData;
      // Double check in case of race condition
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        user = existing;
      } else {
        user = await User.create({
          email: email.toLowerCase(),
          passwordHash: password,
          firstName,
          lastName,
          suffix: suffix || '',
          role: 'commuter',
          isVerified: true,
        });
      }
    } else {
      user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { isVerified: true },
        { new: true }
      );
    }

    if (!user) return apiResponse.error(res, 'User could not be created or found.', 404);

    // Clean up used OTP records
    await Otp.deleteMany({ email: email.toLowerCase() });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return apiResponse.success(
      res,
      { user: user.toJSON(), accessToken, refreshToken },
      'Account created and email verified successfully!',
      200
    );
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email, type = 'registration' } = req.body;

    let registrationData = null;
    if (type === 'registration') {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) return apiResponse.error(res, 'Email is already registered.', 400);

      const prevOtp = await Otp.findOne({ email: email.toLowerCase(), type: 'registration' }).sort({ createdAt: -1 });
      if (!prevOtp || !prevOtp.registrationData) {
        return apiResponse.error(res, 'Registration session expired. Please sign up again.', 400);
      }
      registrationData = prevOtp.registrationData;
    } else {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return apiResponse.error(res, 'User not found.', 404);
    }

    await Otp.deleteMany({ email: email.toLowerCase(), type });
    // Send email before creating new record
    await emailService.sendOtp(email, otpCode, type);

    await Otp.create({
      email: email.toLowerCase(),
      code: otpCode,
      type,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      registrationData,
    });

    return apiResponse.success(res, { email: email.toLowerCase() }, 'OTP sent successfully to your email.');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Check if registration is still pending verification
      const pending = await Otp.findOne({ email: email.toLowerCase(), type: 'registration' });
      if (pending) {
        return apiResponse.error(res, 'Account not verified. Please verify the code sent to your email.', 403);
      }
      return apiResponse.error(res, 'Invalid email or password.', 401);
    }
    if (!user.isVerified) {
      return apiResponse.error(res, 'Account not verified. Please verify the code sent to your email.', 403);
    }
    if (!user.isActive) return apiResponse.error(res, 'Account has been deactivated. Contact support.', 403);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return apiResponse.error(res, 'Invalid email or password.', 401);

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return apiResponse.success(res, { user: user.toJSON(), accessToken, refreshToken }, 'Login successful');
  } catch (error) { next(error); }
};

const refreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return apiResponse.error(res, 'Refresh token is required.', 400);
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) return apiResponse.error(res, 'Invalid refresh token.', 401);

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    return apiResponse.success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Token refreshed successfully');
  } catch (error) { return apiResponse.error(res, 'Invalid or expired refresh token.', 401); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return apiResponse.success(res, null, 'If an account exists with this email, a reset code has been sent.');

    await Otp.deleteMany({ email: email.toLowerCase(), type: 'password_reset' });
    const otpCode = generateOtp();
    await Otp.create({
      email: email.toLowerCase(), code: otpCode, type: 'password_reset',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    await emailService.sendOtp(email, otpCode, 'password_reset');
    return apiResponse.success(res, null, 'If an account exists with this email, a reset code has been sent.');
  } catch (error) { next(error); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const otpRecord = await Otp.findOne({ email: email.toLowerCase(), type: 'password_reset' }).sort({ createdAt: -1 });
    if (!otpRecord || otpRecord.expiresAt < new Date()) return apiResponse.error(res, 'Invalid or expired reset code.', 400);
    if (otpRecord.attempts >= 5) return apiResponse.error(res, 'Maximum attempts exceeded.', 429);

    const isValid = await otpRecord.compareCode(code);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return apiResponse.error(res, 'Invalid reset code.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return apiResponse.error(res, 'User not found.', 404);

    user.passwordHash = newPassword;
    await user.save();
    await Otp.deleteMany({ email: email.toLowerCase() });
    return apiResponse.success(res, null, 'Password reset successful. Please login with your new password.');
  } catch (error) { next(error); }
};

const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    return apiResponse.success(res, null, 'Logged out successfully');
  } catch (error) { next(error); }
};

module.exports = { register, verifyOtp, resendOtp, login, refreshTokenHandler, forgotPassword, resetPassword, logout };
