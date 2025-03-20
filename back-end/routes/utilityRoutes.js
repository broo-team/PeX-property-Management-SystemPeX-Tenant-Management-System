const express = require('express');
const router = express.Router();
const utilityController = require('../controller/utilityController');
const tenantController = require("../controller/tenantController")
// Utility Rates Endpoints
router.get('/utility_rates', utilityController.getUtilityRates);
router.post('/utility_rates', utilityController.createUtilityRates);
router.post('/approve', utilityController.approveUtilityPayment)
// Tenant Utility Usage Endpoints
router.get('/tenant_utility_usage', utilityController.getTenantUtilityUsage);
router.post('/usage', utilityController.recordTenantUtilityUsage);

router.get('/tenants', tenantController.getTenants)

router.post('/confirm', utilityController.confirmUtilityPayment);

router.put('/updatePenalties', utilityController.updateOverduePenalties);

module.exports = router;
