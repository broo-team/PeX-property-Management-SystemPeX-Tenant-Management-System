const express = require('express');
const router = express.Router();
const utilityController = require('../controller/utilityController');
const tenantController = require("../controller/tenantController")

// Import Multer
const multer = require('multer');
const path = require('path'); // Node.js built-in module

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // The 'uploads' folder is already created as per your description
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Create a unique filename: fieldname-timestamp.ext
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Create the Multer upload middleware instance
// 'payment_proof' is the expected name of the file input field in your form
const upload = multer({ storage: storage });


// Utility Rates Endpoints
router.get('/utility_rates', utilityController.getUtilityRates);
router.post('/utility_rates', utilityController.createUtilityRates);
router.post('/approve', utilityController.approveUtilityPayment)

// Tenant Utility Usage Endpoints
router.get('/tenant_utility_usage', utilityController.getTenantUtilityUsage);
router.post('/usage', utilityController.recordTenantUtilityUsage);

router.get('/tenants', tenantController.getTenants)

// MODIFIED ROUTE: Add Multer middleware here
// 'payment_proof' is the name of the file input field
router.post('/confirm', upload.single('payment_proof'), utilityController.confirmUtilityPayment);

router.put('/updatePenalties', utilityController.updateOverduePenalties);

module.exports = router;