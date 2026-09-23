const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/authValidator');

router.use(authLimiter);
router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), authController.resendOtp);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshTokenHandler);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
