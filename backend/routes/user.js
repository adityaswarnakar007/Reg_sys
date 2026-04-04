const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { changePasswordValidation } = require('../middleware/validate');
const { getProfile, changePassword, getDashboard } = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.put('/change-password', protect, changePasswordValidation, changePassword);
router.get('/dashboard', protect, getDashboard);

module.exports = router;
