const express = require('express');
const router = express.Router();
const {
  inviteEditor,
  acceptInvite,
  getStaff,
} = require('../controllers/staffController');
const { protect, authorizeRole } = require('../middleware/auth');

router.use(protect);

// Staff management (Owner ONLY)
router.post('/invite', authorizeRole('owner'), inviteEditor);
router.get('/', authorizeRole('owner'), getStaff);

// Editor accepts invite (Editor ONLY)
router.put('/accept-invite', authorizeRole('editor'), acceptInvite);

module.exports = router;
