const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  getStats,
} = require('../controllers/complaintController');
const {
  protect,
  authorizeRole,
  requireAcceptedInvite,
  checkPermission,
} = require('../middleware/auth');

router.use(protect);
router.use(requireAcceptedInvite);

// Complaint metrics / stats
router.get('/stats', getStats);

// List & Create
router.get('/', getComplaints);
router.post('/', createComplaint);

// Single complaint
router.get('/:id', getComplaintById);

// Update status & resolution notes (Owner & Accepted Editor only, guarded by manageComplaints)
router.patch('/:id/status', authorizeRole('owner', 'editor'), checkPermission('manageComplaints'), updateComplaintStatus);

module.exports = router;
