// src/controllers/paymentController.js
const chapaService = require('../services/chapaService');

// Initialize transaction: expected body contains { amount, currency, customer, tenantId (optional) }
exports.initializeTransaction = async (req, res) => {
    try {
      const { amount, currency = 'ETB', customer, tenantId } = req.body;
      
      const transactionData = {
        amount,
        currency,
        customer,
        redirect_url: process.env.CHAPA_REDIRECT_URL,
        cancel_url: process.env.CHAPA_CANCEL_URL,
        meta: { tenantId }
      };
      
      // Call the service to initialize a transaction with Chapa
      const response = await chapaService.initializeTransaction(transactionData);
      console.log("Chapa response data:", response.data);
      
      // Note: The checkout URL is nested inside response.data.data.checkout_url
      res.json({ payment_url: response.data.data.checkout_url });
    } catch (error) {
      console.error('Error initializing transaction:', error.response?.data || error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
// Process webhook events from Chapa
exports.handleWebhook = async (req, res) => {
    let event;
    const rawPayload = req.body; // req.body is a Buffer from the raw parser
  
    try {
      // Convert the raw Buffer into JSON
      event = JSON.parse(rawPayload.toString());
    } catch (error) {
      console.error('Error parsing webhook payload:', error);
      return res.status(400).send('Invalid payload');
    }
    
    console.warn('Webhook verification is disabled as per Chapa documentation.');
  
    if (event.event === 'successful') {
      console.log('Payment successful:', event.data);
      // Optionally perform additional actions, e.g., update database
    } else {
      console.log('Received webhook event:', event);
    }
    
    res.json({ received: true });
  };
  
// Handle callback for successful payments
// Handle callback for successful payments
exports.handleSuccessCallback = (req, res) => {
    // Extract callback parameters from query string
    const { trx_ref, ref_id, status } = req.query;
  
    console.log('Payment callback received:', { trx_ref, ref_id, status });
  
    // Check if the payment was successful
    if (status === 'success') {
      // For example, update your database record for the payment here
      // updatePaymentRecord(trx_ref, { status: 'paid', ref_id });
  
      // Return a JSON response to confirm the successful payment
      return res.json({
        message: 'Payment successful',
        data: { trx_ref, ref_id, status }
      });
    } else {
      // You can handle cases when the payment wasn't successful
      // For instance, you might want to log the failure and notify the user
      return res.status(400).json({
        message: 'Payment not successful',
        data: { trx_ref, ref_id, status }
      });
    }
  };
  
// Handle callback for canceled payments
exports.handleCancelCallback = (req, res) => {
  console.log('Payment cancellation received:', req.query);
  res.json({
    message: 'Payment canceled',
    data: req.query
  });
};
