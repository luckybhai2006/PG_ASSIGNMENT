const express = require('express');
const router = express.Router();
const {
  getPGDetails,
  updatePGProfile,
  regenerateJoinCode,
  addNotice,
  deleteNotice,
  getRooms,
  generateRooms,
  addRoom,
  deleteRoom,
  updateRoom,
  renameBlock,
  createPGBranch,
  getBranches,
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

// Branch Management (Owner ONLY)
router.get('/branches', authorizeRole('owner'), getBranches);
router.post('/branch', authorizeRole('owner'), createPGBranch);

// Regenerate Join Code (Owner ONLY)
router.post('/regenerate-join-code', authorizeRole('owner'), regenerateJoinCode);

// Notice board (Owner & Accepted Editor)
router.post('/notices', requireAcceptedInvite, authorizeRole('owner', 'editor'), addNotice);
router.delete('/notices/:noticeId', requireAcceptedInvite, authorizeRole('owner', 'editor'), deleteNotice);

// Rooms Management (Owner & Accepted Editor)
router.get('/rooms', requireAcceptedInvite, authorizeRole('owner', 'editor'), getRooms);
router.post('/rooms/generate', requireAcceptedInvite, authorizeRole('owner', 'editor'), generateRooms);
router.post('/rooms', requireAcceptedInvite, authorizeRole('owner', 'editor'), addRoom);
router.delete('/rooms/:roomId', requireAcceptedInvite, authorizeRole('owner'), deleteRoom);

// Room Editing & Block Code Renaming (Owner ONLY)
router.put('/rooms/:roomId', requireAcceptedInvite, authorizeRole('owner'), updateRoom);
router.post('/rooms/rename-block', requireAcceptedInvite, authorizeRole('owner'), renameBlock);

module.exports = router;
