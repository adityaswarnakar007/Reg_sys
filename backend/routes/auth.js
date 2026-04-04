const express = require('express');
const router = express.Router();
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} = require('../middleware/validate');
const { verifyRecaptchaV3 } = require('../middleware/recaptcha');
const {
  register,
  login,
  verifyOTP,
  resendOTP,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

router.post('/register', verifyRecaptchaV3('register', 0.5), registerValidation, register);
router.post('/login', verifyRecaptchaV3('login', 0.5), loginValidation, login);
router.post('/forgot-password', verifyRecaptchaV3('forgot_password', 0.5), forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

module.exports = router;
