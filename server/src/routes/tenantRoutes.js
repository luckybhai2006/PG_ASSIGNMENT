const express = require('express');
const router = express.Router();
const {
  addTenant,
  getTenants,
  approveTenant,
  rejectTenant,
  changeTenantRoom,
  vacateTenant,
  transferTenantBranch,
} = require('../controllers/tenantController');
const {
  protect,
  authorizeRole,
  requireAcceptedInvite,
  checkPermission,
} = require('../middleware/auth');

router.use(protect);
router.use(requireAcceptedInvite);

// Owner & Accepted Editor can list tenants
router.get('/', authorizeRole('owner', 'editor'), getTenants);

// Tenant mutation actions guarded by manageTenants permission for editors
router.post('/', authorizeRole('owner', 'editor'), checkPermission('manageTenants'), addTenant);
router.put('/:id/approve', authorizeRole('owner', 'editor'), checkPermission('manageTenants'), approveTenant);
router.put('/:id/reject', authorizeRole('owner', 'editor'), checkPermission('manageTenants'), rejectTenant);
router.put('/:id/room', authorizeRole('owner', 'editor'), checkPermission('manageTenants'), changeTenantRoom);
router.put('/:id/vacate', authorizeRole('owner', 'editor'), checkPermission('manageTenants'), vacateTenant);

// Only Owner can transfer students between branches they own
router.put('/:id/transfer', authorizeRole('owner'), transferTenantBranch);

module.exports = router;
