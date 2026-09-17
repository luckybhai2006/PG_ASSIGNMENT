const express = require('express');
const router = express.Router();
const { addTenant, getTenants, approveTenant, rejectTenant } = require('../controllers/tenantController');
const {
  protect,
  authorizeRole,
  requireAcceptedInvite,
} = require('../middleware/auth');

router.use(protect);
router.use(requireAcceptedInvite);

// Only Owner & Accepted Editor can add, list, approve, and reject tenants
router.post('/', authorizeRole('owner', 'editor'), addTenant);
router.get('/', authorizeRole('owner', 'editor'), getTenants);
router.put('/:id/approve', authorizeRole('owner', 'editor'), approveTenant);
router.put('/:id/reject', authorizeRole('owner', 'editor'), rejectTenant);

module.exports = router;
