const paymentService = require('../services/chapaService');
const { format } = require('date-fns');
const crypto = require('crypto');
const db = require("../db/connection");
const axios = require("axios");
const CHAPA_BASE_URL = "https://api.chapa.co/v1";
const { logPaymentEvent } = require("../utils/paymentLogger");

// Helper function to sanitize strings
const sanitizeString = (str) => {
  return str
    .replace(/[^a-zA-Z0-9\\-_\\s\\.]/g, '') // Keep only allowed characters
    .trim(); // Remove leading/trailing whitespace
};

const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

exports.initializeUtilityPayment = async (req, res) => {
  try {
    const { type, billId, amount, tenantDetails } = req.body;

    // Validate required fields
    if (!type || !billId || !amount || !tenantDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, billId, amount, tenantDetails',
      });
    }

    // Generate a unique transaction reference
    const customTxRef = `UTIL-${billId}-${Date.now()}`;

    // Update the database with the transaction reference
    try {
      await db.execute(
        `UPDATE tenant_utility_usage
         SET tx_ref = ?, utility_status = 'Processing'
         WHERE id = ?`,
        [customTxRef, billId]
      );
    } catch (dbError) {
      console.error('Database update failed:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update database',
      });
    }

    // Prepare transaction data for Chapa API
    const transactionData = {
      amount: parseFloat(amount).toFixed(2),
      currency: req.body.currency || process.env.DEFAULT_CURRENCY || 'ETB',
      email: sanitizeString(tenantDetails.email || ''),
      first_name: sanitizeString(tenantDetails.fullName.split(' ')[0]),
      last_name: sanitizeString(tenantDetails.fullName.split(' ').slice(1).join(' ') || ''),
      phone_number: sanitizeString(tenantDetails.phone || ''),
      tx_ref: customTxRef,
      callback_url: process.env.CHAPA_RETURN_UTILITY_URL,
      return_url: `${process.env.CHAPA_RETURN_UTILITY_URL}?trx_ref=${customTxRef}`,
      customization: {
        title: `Utility Payment (${type.toUpperCase()})`,
        description: `Payment for ${type} bill ID: ${billId}`,
      },
      meta: {
        hide_receipt: 'true',
        tenantId: tenantDetails.tenantId || '',
        internal_tx_ref: customTxRef,
        utilityType: type,
      },
    };

    console.log("Payload sent to Chapa:", JSON.stringify(transactionData, null, 2));

    // Initialize the transaction with Chapa
    const chapaResponse = await paymentService.initializeTransaction(transactionData);

    console.log("Chapa API Response:", JSON.stringify(chapaResponse.data, null, 2));

    // Check if the checkout_url exists in the response
    if (!chapaResponse.data?.data?.checkout_url) {
      throw new Error('Chapa API did not return a valid checkout URL');
    }

    // Return the payment link to the frontend
    res.status(200).json({
      success: true,
      message: 'Utility payment initialized successfully',
      data: {
        checkout_url: chapaResponse.data.data.checkout_url,
        tx_ref: customTxRef,
      },
    });
  } catch (error) {
    console.error('Error initializing utility payment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize utility payment',
      error: error.message,
    });
  }
};

exports.verifyTransaction = async (trx_ref) => {
  try {
    const response = await axios.get(`${CHAPA_BASE_URL}/transaction/verify/${trx_ref}`, {
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`,
      },
    });

    console.log('[VERIFY_TRANSACTION] Full Response:', JSON.stringify(response.data, null, 2));

    if (response.data.status === 'success') {
      return response.data;
    } else {
      throw new Error(`Transaction verification failed: ${response.data.message}`);
    }
  } catch (error) {
    console.error('[VERIFY_TRANSACTION] Error:', error.response?.data || error.message);
    throw error;
  }
};

exports.verifyUtilityPayment = async (trx_ref) => {
  try {
    const response = await axios.get(`${CHAPA_BASE_URL}/transaction/verify/${trx_ref}`, {
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
      },
    });

    console.log('🔍 Chapa verification response:', response.data);

    let isVerified = false;
    if (
      response.data &&
      response.data.status === 'success' &&
      response.data.data.status === 'success'
    ) {
      isVerified = true;

      // Update the database upon successful verification
      try {
        await db.execute(
          `UPDATE tenant_utility_usage
           SET utility_status = 'Approved'
           WHERE tx_ref = ?`,
          [trx_ref]
        );
      } catch (dbError) {
        console.error('Database update failed:', dbError.message);
      }
    }

    return {
      verified: isVerified,
      message: isVerified ? 'Payment verified successfully' : 'Payment not successful',
      data: response.data.data,
    };
  } catch (error) {
    console.error('❌ Error verifying payment:', error.response?.data || error.message);
    return {
      verified: false,
      message: 'Verification failed',
    };
  }
};

exports.handleWebhook = async (req, res) => {
  logPaymentEvent('WEBHOOK_RECEIVED', req.rawBody);

  try {
    const signature = crypto
      .createHmac('sha256', process.env.CHAPA_SECRET_KEY)
      .update(req.rawBody)
      .digest('hex');

    if (signature !== req.headers['chapa-signature']) {
      logPaymentEvent('WEBHOOK_INVALID_SIG', {
        received: req.headers['chapa-signature'],
        computed: signature,
      });
      return res.status(403).send('Invalid signature');
    }

    const event = req.body;

    if (event.event === 'successful' && event.data?.status === 'success') {
      const result = await exports.verifyUtilityPayment(event.data.tx_ref);
      if (result.verified) {
        logPaymentEvent('WEBHOOK_SUCCESS', event.data.tx_ref);
      } else {
        logPaymentEvent('WEBHOOK_VERIFY_FAIL', event.data.tx_ref);
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    logPaymentEvent('WEBHOOK_ERROR', error.message);
    return res.status(500).send('Webhook processing failed');
  }
};

exports.handleUtilitySuccessCallback = async (req, res) => {
  const trx_ref = req.query.trx_ref;

  try {
    const verificationResult = await exports.verifyUtilityPayment(trx_ref);

    if (verificationResult.verified) {
      res.json({
        success: true,
        message: 'Utility payment verified successfully',
        tx_ref: trx_ref,
      });
    } else {
      res.json({
        success: false,
        message: 'Utility payment verification failed',
        tx_ref: trx_ref,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error verifying utility payment' });
  }
};