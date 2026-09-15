const express = require('express');
const router = express.Router();
const {
  registerOwner,
  registerTenant,
  getPublicPGs,
  login,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.get('/pgs', getPublicPGs);
router.post('/register-owner', registerOwner);
router.post('/register-tenant', registerTenant);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;

