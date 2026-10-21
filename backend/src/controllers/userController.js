const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Otp = require('../models/Otp');
const apiResponse = require('../utils/apiResponse');
const { logAuditEvent } = require('../utils/auditLogger');
const { validateImageBuffer, generateSafeFilename } = require('../utils/fileSecurity');


const getProfile = async (req, res, next) => {
  try { return apiResponse.success(res, req.user, 'Profile retrieved successfully'); }
  catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, suffix, profilePhoto, municipality } = req.body;
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (suffix !== undefined) updates.suffix = suffix?.trim() || '';
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto;
    if (municipality && typeof municipality === 'string' && municipality.trim()) {
      updates.municipality = municipality.trim();
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })

      .select('-passwordHash -refreshToken');
    return apiResponse.success(res, user, 'Profile updated successfully');
  } catch (error) { next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return apiResponse.error(res, 'Current password is incorrect.', 400);

    user.passwordHash = newPassword;
    await user.save();
    return apiResponse.success(res, null, 'Password changed successfully');
  } catch (error) { next(error); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, search, status } = req.query;
    const filter = {};

    // Role-scoped visibility
    if (req.user.role === 'lgu') {
      filter.role = 'poso';
      const userMuni = (req.user.municipality || 'Dagupan').trim();
      if (userMuni.toLowerCase() === 'dagupan') {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { municipality: userMuni },
            { municipality: { $exists: false } },
          ],
        });
      } else {
        filter.municipality = userMuni;
      }
    } else if (req.user.role === 'admin') {
      if (role && role !== 'all') {
        filter.role = role;
      } else if (!role) {
        filter.role = 'lgu';
      }
      if (req.query.municipality && req.query.municipality !== 'all') {
        filter.municipality = req.query.municipality.trim();
      }
    } else if (role) {
      filter.role = role;
    }

    if (status === 'active') filter.isActive = true;
    if (status === 'suspended') filter.isActive = false;

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { firstName: { $regex: escaped, $options: 'i' } },
        { lastName: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { badgeNumber: { $regex: escaped, $options: 'i' } },
        { department: { $regex: escaped, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter).select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    return apiResponse.paginated(res, users, total, page, limit);
  } catch (error) { next(error); }
};

const createUser = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      suffix = '',
      role,
      department = '',
      badgeNumber = '',
      assignedZone = '',
      municipality = 'Dagupan',
    } = req.body;

    // Enforce role-scoped provisioning
    let targetRole = role;
    let targetMunicipality = (municipality || 'Dagupan').trim();
    if (req.user.role === 'admin') {
      // Admin is strictly scoped to provisioning LGU accounts across municipalities
      targetRole = 'lgu';
    } else if (req.user.role === 'lgu') {
      // LGU is strictly scoped to provisioning POSO accounts for their municipality
      targetRole = 'poso';
      targetMunicipality = req.user.municipality || 'Dagupan';
    } else {
      return apiResponse.error(res, 'You do not have permission to provision staff accounts.', 403);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return apiResponse.error(res, 'Email already registered.', 409);

    const defaultDept =
      targetRole === 'lgu'
        ? (targetMunicipality && targetMunicipality !== 'Dagupan'
            ? `Municipal Transport & Traffic Management (${targetMunicipality})`
            : 'City Transport & Public Safety Office (CTPSO)')
        : `Public Order & Safety Office (POSO - ${targetMunicipality})`;

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash: password,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      suffix: suffix?.trim() || '',
      role: targetRole,
      municipality: targetMunicipality,
      department: department?.trim() || defaultDept,
      badgeNumber: badgeNumber?.trim() || '',
      assignedZone: assignedZone?.trim() || '',
      isVerified: true,
      isActive: true,
    });

    await logAuditEvent(req, {
      action: 'USER_CREATE_STAFF',
      resourceType: 'user',
      resourceId: user._id,
      details: { email: user.email, name: `${user.firstName} ${user.lastName}`, role: user.role, municipality: user.municipality, badge: user.badgeNumber },
    });

    return apiResponse.success(res, user.toJSON(), `${targetRole.toUpperCase()} account created successfully for ${targetMunicipality}.`, 201);
  } catch (error) { next(error); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['admin', 'lgu', 'poso', 'commuter'].includes(role)) {
      return apiResponse.error(res, 'Invalid role specified.', 400);
    }
    const user = await User.findById(id);
    if (!user) return apiResponse.error(res, 'User not found.', 404);
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return apiResponse.error(res, 'Administrators cannot revoke their own administrative privileges.', 400);
    }

    user.role = role;
    await user.save();

    await logAuditEvent(req, {
      action: 'USER_ROLE_UPDATE',
      resourceType: 'user',
      resourceId: user._id,
      details: { email: user.email, newRole: role },
    });

    return apiResponse.success(res, user.toJSON(), `User role updated to ${role} successfully.`);
  } catch (error) { next(error); }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const user = await User.findById(id);
    if (!user) return apiResponse.error(res, 'User not found.', 404);

    // Permission checks
    if (req.user.role === 'lgu') {
      if (user.role !== 'poso') {
        return apiResponse.error(res, 'LGU can only activate or suspend POSO officer accounts.', 403);
      }
    } else if (req.user.role === 'admin') {
      if (user._id.toString() === req.user._id.toString()) {
        return apiResponse.error(res, 'Administrators cannot suspend their own account.', 400);
      }
    }

    user.isActive = Boolean(isActive);
    if (!user.isActive) {
      user.refreshToken = null;
    }
    await user.save();

    await logAuditEvent(req, {
      action: 'USER_STATUS_UPDATE',
      resourceType: 'user',
      resourceId: user._id,
      details: { email: user.email, name: `${user.firstName} ${user.lastName}`, isActive: user.isActive },
    });

    return apiResponse.success(res, user.toJSON(), `User ${user.isActive ? 'activated' : 'suspended'} successfully`);
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return apiResponse.error(res, 'Administrators cannot delete their own account.', 400);
    }
    const user = await User.findById(id);
    if (!user) return apiResponse.error(res, 'User not found.', 404);
    if (user.role === 'admin') {
      return apiResponse.error(res, 'Cannot delete an Admin account.', 403);
    }
    if (req.user.role === 'lgu' && user.role !== 'poso') {
      return apiResponse.error(res, 'LGU can only delete POSO officer accounts.', 403);
    }

    // Require account to be suspended before it can be deleted
    if (user.isActive) {
      return apiResponse.error(res, 'Account must be suspended before deletion. Please suspend the account first.', 400);
    }

    await User.findByIdAndDelete(id);
    await Otp.deleteMany({ email: user.email.toLowerCase() });

    await logAuditEvent(req, {
      action: 'USER_DELETE',
      resourceType: 'user',
      resourceId: user._id,
      details: { email: user.email, name: `${user.firstName} ${user.lastName}`, role: user.role },
    });

    return apiResponse.success(res, null, 'User account permanently removed.');
  } catch (error) { next(error); }
};

const adminResetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return apiResponse.error(res, 'New password must be at least 6 characters long.', 400);
    }

    const user = await User.findById(id);
    if (!user) return apiResponse.error(res, 'User not found.', 404);

    if (req.user.role === 'lgu' && user.role !== 'poso') {
      return apiResponse.error(res, 'LGU can only change passwords for POSO field officers.', 403);
    }

    if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
      return apiResponse.error(res, 'Cannot change password of another Administrator.', 403);
    }

    user.passwordHash = newPassword;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    await logAuditEvent(req, {
      action: 'USER_PASSWORD_RESET_ADMIN',
      resourceType: 'user',
      resourceId: user._id,
      details: { email: user.email, name: `${user.firstName} ${user.lastName}`, resetBy: req.user.email },
    });

    return apiResponse.success(res, null, `Password for ${user.firstName} ${user.lastName} updated successfully.`);
  } catch (error) { next(error); }
};

const deleteMyAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return apiResponse.error(res, 'User not found.', 404);

    if (user.role === 'admin') {
      return apiResponse.error(res, 'Admin accounts cannot be deleted through this interface.', 403);
    }

    const { password } = req.body || {};
    if (password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return apiResponse.error(res, 'Incorrect password. Account deletion aborted.', 401);
      }
    }

    const email = user.email.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`;

    await User.findByIdAndDelete(userId);
    await Otp.deleteMany({ email });

    await logAuditEvent(req, {
      action: 'USER_SELF_DELETE',
      resourceType: 'user',
      resourceId: userId,
      details: {
        email,
        name: fullName,
        role: user.role,
        policy: 'AppStore_GooglePlay_Policy_Compliance',
      },
    });

    return apiResponse.success(res, null, 'Your commuter account and personal data have been permanently removed.');
  } catch (error) { next(error); }
};

const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return apiResponse.error(res, 'No image file uploaded.', 400);
    }

    // Strictly validate image binary header (magic bytes) and detect polyglot scripts
    const validation = validateImageBuffer(req.file.buffer);
    if (!validation.valid) {
      return apiResponse.error(res, validation.error, 400);
    }

    const avatarDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }

    const safeFilename = generateSafeFilename(validation.ext);
    const destinationPath = path.join(avatarDir, safeFilename);

    await fs.promises.writeFile(destinationPath, req.file.buffer);

    const fileUrl = `/uploads/avatars/${safeFilename}`;

    // Get current user to delete old avatar file if present
    const currentUser = await User.findById(req.user._id);
    if (currentUser && currentUser.profilePhoto && currentUser.profilePhoto.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(__dirname, '../..', currentUser.profilePhoto);
      try {
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (err) {
        // Continue even if old avatar file cleanup fails
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: fileUrl },
      { new: true }
    ).select('-passwordHash -refreshToken');

    return apiResponse.success(
      res,
      { user, profilePhoto: fileUrl, url: fileUrl },
      'Profile photo updated securely.'
    );
  } catch (error) { next(error); }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  changePassword,
  getAllUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  adminResetPassword,
  deleteMyAccount,
};

