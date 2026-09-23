const User = require('../models/User');
const Otp = require('../models/Otp');
const apiResponse = require('../utils/apiResponse');
const { logAuditEvent } = require('../utils/auditLogger');


const getProfile = async (req, res, next) => {
  try { return apiResponse.success(res, req.user, 'Profile retrieved successfully'); }
  catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, suffix, profilePhoto } = req.body;
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (suffix !== undefined) updates.suffix = suffix?.trim() || '';
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto;

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
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter).select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    return apiResponse.paginated(res, users, total, page, limit);
  } catch (error) { next(error); }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select('-passwordHash -refreshToken');
    if (!user) return apiResponse.error(res, 'User not found.', 404);

    await logAuditEvent(req, {
      action: 'USER_STATUS_UPDATE',
      resourceType: 'user',
      resourceId: user._id,
      details: { email: user.email, name: `${user.firstName} ${user.lastName}`, isActive },
    });

    return apiResponse.success(res, user, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
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
      return apiResponse.error(res, 'Cannot delete an administrator account.', 403);
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

module.exports = { getProfile, updateProfile, changePassword, getAllUsers, updateUserStatus, deleteUser };
