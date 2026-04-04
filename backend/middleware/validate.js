const { body, validationResult } = require('express-validator');
const disposableDomains = require('../config/disposableEmails');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  }
  next();
};

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, underscores'),
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .custom((value) => {
      const domain = value.split('@')[1];
      if (disposableDomains.includes(domain)) {
        throw new Error('Disposable email addresses are not allowed');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain a special character')
    .custom((value, { req }) => {
      if (req.body.username && value.toLowerCase().includes(req.body.username.toLowerCase())) {
        throw new Error('Password must not contain your username');
      }
      return true;
    }),
  handleValidationErrors
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain a special character'),
  handleValidationErrors
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Invalid email format').normalizeEmail(),
  handleValidationErrors
];

const resetPasswordValidation = [
  body('email').trim().isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .matches(/^\d{6}$/).withMessage('OTP must be 6 digits'),
  body('newPassword')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain a special character'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation
};
