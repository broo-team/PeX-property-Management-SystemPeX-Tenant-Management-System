const express = require('express');
const router = express.Router();
const tenantController = require('../controller/tenantController');

router.post('/', tenantController.createTenant);
router.get('/', tenantController.getTenants);
router.put('/:id', tenantController.updateTenant);
router.put('/terminate/:id', tenantController.terminateTenant);
router.get('/terminated', tenantController.getTerminatedTenants);
router.get('/:id', tenantController.getTenantById);

module.exports = router;
