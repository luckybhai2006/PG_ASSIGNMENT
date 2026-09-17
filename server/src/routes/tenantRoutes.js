const express = require('express');
const router = express.Router();
const {
  addTenant,
  getTenants,
  approveTenant,
  rejectTenant,
  changeTenantRoom,
  transferTenantBranch,
} = require('../controllers/tenantController');
const {
  protect,
  authorizeRole,
  requireAcceptedInvite,
} = require('../middleware/auth');

router.use(protect);
router.use(requireAcceptedInvite);

// Owner & Accepted Editor can add, list, approve, reject, and change rooms for tenants
router.post('/', authorizeRole('owner', 'editor'), addTenant);
router.get('/', authorizeRole('owner', 'editor'), getTenants);
router.put('/:id/approve', authorizeRole('owner', 'editor'), approveTenant);
router.put('/:id/reject', authorizeRole('owner', 'editor'), rejectTenant);
router.put('/:id/room', authorizeRole('owner', 'editor'), changeTenantRoom);

// Only Owner can transfer students between branches they own
router.put('/:id/transfer', authorizeRole('owner'), transferTenantBranch);

module.exports = router;
