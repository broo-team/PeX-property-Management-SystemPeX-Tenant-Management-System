// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const paymentController = require('../controller/paymentController');

// Route to initialize a new Chapa transaction
router.post('/initialize', paymentController.initializeTransaction);

// Webhook endpoint – uses raw body parser to handle the raw payload
router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

// Callback endpoints after payment completion or cancellation
router.get('/success', paymentController.handleSuccessCallback);
router.get('/cancel', paymentController.handleCancelCallback);

module.exports = router;
