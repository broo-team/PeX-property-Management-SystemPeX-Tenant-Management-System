// routes/paymentRoutes.js - Updated
const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');
const utilityPaymentController = require("../controller/utilityPaymentController")
// Remove body-parser - using express.json() from app.js
router.post('/initialize', paymentController.initializeTransaction);

// Webhook handler with proper content type
router.post('/webhook', (req, res) => {
  // Content type verification
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(400).send('Invalid content type');
  }
  paymentController.handleWebhook(req, res);
});
router.get('/success', paymentController.handleSuccessCallback);

// Add bulk verification endpoint
router.post('/bulk-verify', 
  // requireAuthMiddleware, // Add your auth middleware
  paymentController.bulkVerifyPayments
);


// route for utility payments
router.post('/utility/initialize', utilityPaymentController.initializeUtilityPayment);
router.get('/utility/success', utilityPaymentController.handleUtilitySuccessCallback);

module.exports = router;