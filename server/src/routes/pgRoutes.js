const express = require('express');
const router = express.Router();
const {
  getPGDetails,
  updatePGProfile,
  addNotice,
  deleteNotice,
} = require('../controllers/pgController');
const {
  protect,
  authorizeRole,
  requireAcceptedInvite,
} = require('../middleware/auth');

router.use(protect);

// Get PG details (Allowed for Owner, Tenant, and Accepted Editor)
router.get('/', requireAcceptedInvite, getPGDetails);

// Update PG Profile (Owner ONLY)
router.put('/profile', authorizeRole('owner'), updatePGProfile);

// Notice board (Owner & Accepted Editor)
router.post('/notices', requireAcceptedInvite, authorizeRole('owner', 'editor'), addNotice);
router.delete('/notices/:noticeId', requireAcceptedInvite, authorizeRole('owner', 'editor'), deleteNotice);

module.exports = router;
