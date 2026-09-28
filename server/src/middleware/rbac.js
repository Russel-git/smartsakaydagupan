const apiResponse = require('../utils/apiResponse');

const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return apiResponse.error(res, 'Authentication required.', 401);
    }
    if (req.user.role === 'superadmin' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return apiResponse.error(res, 'You do not have permission to access this resource.', 403);
  };
};

module.exports = rbac;
