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
  toggleRoomMaintenance,
  createPGBranch,
  getBranches,
} = require('../controllers/pgController');
const {
  protect,
  authorizeRole,
  requireAcceptedInvite,
  checkPermission,
} = require('../middleware/auth');

router.use(protect);

// Get PG details (Allowed for Owner, Tenant, and Accepted Editor)
router.get('/', requireAcceptedInvite, getPGDetails);

// Multi-PG Branch Management (Owner ONLY)
router.post('/branch', authorizeRole('owner'), createPGBranch);
router.post('/branches', authorizeRole('owner'), createPGBranch);
router.get('/branch', authorizeRole('owner'), getBranches);
router.get('/branches', authorizeRole('owner'), getBranches);

// Edit PG Profile / Facility details (Owner ONLY)
router.put('/', authorizeRole('owner'), updatePGProfile);

// Regenerate Secret Student Join Code (Owner ONLY)
router.post('/regenerate-join-code', authorizeRole('owner'), regenerateJoinCode);

// Notice board (Owner & Accepted Editor with manageNotices permission)
router.post('/notices', requireAcceptedInvite, authorizeRole('owner', 'editor'), checkPermission('manageNotices'), addNotice);
router.delete('/notices/:noticeId', requireAcceptedInvite, authorizeRole('owner', 'editor'), checkPermission('manageNotices'), deleteNotice);

// Rooms Management (Owner & Accepted Editor)
router.get('/rooms', requireAcceptedInvite, authorizeRole('owner', 'editor'), getRooms);
router.post('/rooms/generate', requireAcceptedInvite, authorizeRole('owner', 'editor'), checkPermission('manageRooms'), generateRooms);
router.post('/rooms', requireAcceptedInvite, authorizeRole('owner', 'editor'), checkPermission('manageRooms'), addRoom);
router.delete('/rooms/:roomId', authorizeRole('owner'), deleteRoom);

// Room Editing, Block Code Renaming & Maintenance
router.put('/rooms/:roomId', requireAcceptedInvite, authorizeRole('owner'), updateRoom);
router.post('/rooms/rename-block', requireAcceptedInvite, authorizeRole('owner'), renameBlock);
router.put('/rooms/:roomId/maintenance', requireAcceptedInvite, authorizeRole('owner', 'editor'), checkPermission('manageMaintenance'), toggleRoomMaintenance);

module.exports = router;
