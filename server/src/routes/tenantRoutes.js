const express = require('express');
const router = express.Router();
const { addTenant, getTenants } = require('../controllers/tenantController');
const {
  protect,
  authorizeRole,
  requireAcceptedInvite,
} = require('../middleware/auth');

router.use(protect);
router.use(requireAcceptedInvite);

// Only Owner & Accepted Editor can add and list tenants
router.post('/', authorizeRole('owner', 'editor'), addTenant);
router.get('/', authorizeRole('owner', 'editor'), getTenants);

module.exports = router;
