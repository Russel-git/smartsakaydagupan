const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required',
  }),
  firstName: Joi.string().trim().min(2).max(16).pattern(/^[A-Za-z]+(\s[A-Za-z]+)*$/).required().messages({
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name cannot exceed 16 characters',
    'string.pattern.base': 'First name can only contain letters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().trim().min(2).max(16).pattern(/^[A-Za-z]+(\s[A-Za-z]+)*$/).required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name cannot exceed 16 characters',
    'string.pattern.base': 'Last name can only contain letters',
    'any.required': 'Last name is required',
  }),
  suffix: Joi.string().trim().max(10).allow('', null).optional().messages({
    'string.max': 'Name extender cannot exceed 10 characters',
  }),
});



const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
  }),
});

const resendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  type: Joi.string().valid('registration', 'password_reset').default('registration'),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter (A-Z), one lowercase letter (a-z), and one number (0-9)',
      'string.empty': 'New password is required',
      'any.required': 'New password is required',
    }),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(16).pattern(/^[A-Za-z]+(\s[A-Za-z]+)*$/),
  lastName: Joi.string().trim().min(2).max(16).pattern(/^[A-Za-z]+(\s[A-Za-z]+)*$/),
  suffix: Joi.string().trim().max(10).allow('', null),
  profilePhoto: Joi.string().allow('', null),
}).min(1);

module.exports = {

  registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema,
  forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, updateProfileSchema,
};
