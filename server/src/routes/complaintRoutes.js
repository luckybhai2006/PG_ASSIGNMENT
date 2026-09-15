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

// Update status & resolution notes (Owner & Accepted Editor only)
router.patch('/:id/status', authorizeRole('owner', 'editor'), updateComplaintStatus);

module.exports = router;
