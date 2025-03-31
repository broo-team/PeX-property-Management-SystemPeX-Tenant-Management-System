// routes/tenantRoutes.js
const express = require('express');
const router = express.Router();

const tenantAuthController = require('../controller/tenantAuthController');

// POST route for tenant login
router.post('/tenant/login', tenantAuthController.tenantLogin);

module.exports = router;
