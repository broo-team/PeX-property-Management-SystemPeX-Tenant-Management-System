
const chapaService = require('../services/chapaService');
const db = require("../db/connection");
const crypto = require('crypto');
const axios = require("axios");
const moment = require("moment")
const { logPaymentEvent } = require('../utils/paymentLogger');
const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";  
const executeQuery = async (query, params) => {
  try {
    const [rows] = await db.query(query, params);
    return rows;
  } catch (error) {
    logPaymentEvent('DB_ERROR', error.message);
    throw new Error('Database operation failed');
  }
};

exports.initializeTransaction = async (req, res) => {
  logPaymentEvent('INIT_START', req.body);
  try {
    const { amount, currency = 'ETB', email = 'seya@gmail.com', first_name, last_name, phone_number, meta } = req.body;
    const tenantId = meta?.tenantId || 43;

    if (!amount || !tenantId) {
      throw new Error('Missing required fields');
    }

    const customTxRef = `tx-${crypto.randomBytes(6).toString('hex')}-${Date.now()}`;

    // Include penalty in transaction amount
    const [bill] = await executeQuery(
      `SELECT id, amount, penalty FROM monthly_rent_bills 
       WHERE tenant_id = ? AND payment_status = 'pending' 
       LIMIT 1 FOR UPDATE`,
      [tenantId]
    );
    
    if (!bill) throw new Error('No pending bill found');

    const totalAmount = parseFloat(bill.amount) + parseFloat(bill.penalty || 0);

    await executeQuery(
      `UPDATE monthly_rent_bills SET tx_ref = ? WHERE id = ?`,
      [customTxRef, bill.id]
    );

    const transactionData = {
      amount: String(totalAmount), // Use total amount including penalty
      currency,
      email: email.trim().toLowerCase(),
      first_name,
      last_name,
      phone_number,
      tx_ref: customTxRef,
      meta: {
        tenantId,
        internalTxRef: customTxRef
      }
    };

    const chapaResponse = await chapaService.initializeTransaction(transactionData);
    logPaymentEvent('INIT_SUCCESS', { tx_ref: customTxRef });

    res.json({
      checkout_url: chapaResponse.data?.data?.checkout_url,
      tx_ref: customTxRef,
      verification_url: `${process.env.API_BASE_URL}/transaction/verify/${customTxRef}`
    });
  } catch (error) {
    logPaymentEvent('INIT_FAILED', error.message);
    res.status(400).json({
      error: 'Payment initialization failed',
      details: error.message
    });
  }
};
exports.verifyPayment = async (tx_ref) => {
  logPaymentEvent('VERIFY_START', { tx_ref });
  try {
    const [bill] = await executeQuery(
      `SELECT
        id,
        tenant_id,
        payment_term,
        amount,
        due_date,
        payment_status,
        penalty,
        original_due_date
      FROM monthly_rent_bills
      WHERE tx_ref = ?
      LIMIT 1 FOR UPDATE`,
      [tx_ref]
    );

    if (!bill) return { verified: false, code: 'BILL_NOT_FOUND' };
    if (bill.payment_status === 'paid') return { verified: true, code: 'ALREADY_PAID' };

    const verification = await chapaService.verifyTransaction(tx_ref);
    const isSuccess = verification?.data?.status === 'success';

    if (isSuccess) {
      // Get payment history count
      let paidCount = 0;
      try {
        const [paidCountRows] = await db.query(
          `SELECT COUNT(*) AS paid_count 
           FROM monthly_rent_bills 
           WHERE tenant_id = ? 
             AND payment_status = 'paid' 
             AND id != ?`,
          [bill.tenant_id, bill.id]
        );
        paidCount = paidCountRows?.[0]?.paid_count || 0;
      } catch (dbError) {
        console.error("Paid count query failed:", dbError);
        paidCount = 0;
      }

      // Calculate due date
      const paymentTerm = bill.payment_term || 30;
      const newDueDate = paidCount === 0 
        ? moment(bill.original_due_date, DATE_FORMAT).format(DATE_FORMAT)
        : moment(bill.original_due_date, DATE_FORMAT)
            .add(paymentTerm, "days")
            .format(DATE_FORMAT);

      // Update bill without resetting penalty
      await executeQuery(
        `UPDATE monthly_rent_bills SET
          payment_status = 'paid',
          payment_date = NOW(),
          payment_proof_url = ?,
          bill_generated = 1,
          due_date = ?
        WHERE id = ?`,
        [
          verification?.data?.data?.payment_proof_url || 'chapa',
          newDueDate,
          bill.id
        ]
      );

      logPaymentEvent('VERIFY_SUCCESS', { 
        billId: bill.id,
        amountPaid: bill.amount,
        penaltyPaid: bill.penalty  // Now tracking penalty separately
      });
      
      return { 
        verified: true, 
        code: 'PAYMENT_CONFIRMED',
        details: {
          base_amount: bill.amount,
          penalty_amount: bill.penalty,
          total_paid: bill.amount + bill.penalty
        }
      };
    }

    return { verified: false, code: 'CHAPA_VERIFICATION_FAILED' };
  } catch (error) {
    logPaymentEvent('VERIFY_ERROR', error.message);
    return { verified: false, code: 'VERIFICATION_ERROR' };
  }
};

exports.handleWebhook = async (req, res) => {
  logPaymentEvent('WEBHOOK_RECEIVED', req.rawBody);
  try {
    // Verify signature
    const signature = crypto
      .createHmac('sha256', process.env.CHAPA_SECRET_KEY)
      .update(req.rawBody)
      .digest('hex');
    if (signature !== req.headers['chapa-signature']) {
      logPaymentEvent('WEBHOOK_INVALID_SIG', { received: req.headers['chapa-signature'], computed: signature });
      return res.status(403).send('Invalid signature');
    }
    const event = req.body;
    if (event.event === 'successful' && event.data?.status === 'success') {
      const result = await this.verifyPayment(event.data.tx_ref);
      if (result.verified) {
        logPaymentEvent('WEBHOOK_SUCCESS', event.data.tx_ref);
      } else {
        logPaymentEvent('WEBHOOK_VERIFY_FAIL', event.data.tx_ref);
      }
    }
    res.sendStatus(200);
  } catch (error) {
    logPaymentEvent('WEBHOOK_ERROR', error.message);
    res.status(500).send('Webhook processing failed');
  }
};

/**
 * Handle success callback after payment.
 */
exports.handleSuccessCallback = async (req, res) => {
  console.log("Success callback query:", req.query); // Log incoming query parameters
  const { trx_ref } = req.query;

  if (!trx_ref) {
    console.error('Missing trx_ref in success callback');
    return res.status(400).json({ success: false, message: 'Missing transaction reference' });
  }

  try {
    const verification = await this.verifyPayment(trx_ref);

    if (verification.verified) {
      res.json({
        success: true,
        message: "Payment verified successfully",
        tx_ref: trx_ref
      });
    } else {
      res.status(400).json({
        success: false,
        message: verification.message || "Payment verification failed",
        tx_ref: trx_ref
      });
    }
  } catch (error) {
    console.error('Callback error:', error.message);
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message
    });
  }
};

/**
 * Handle cancel callback after payment.
 */
exports.handleCancelCallback = (req, res) => {
  console.log('Payment cancellation received:', req.query);
  res.json({ success: false, message: 'Payment canceled by user', data: req.query });
};

/**
 * Bulk verify pending payments.
 */
exports.bulkVerifyPayments = async (req, res) => {
  try {
    const bills = await executeQuery(
      `SELECT id, tx_ref, amount, payment_status 
       FROM monthly_rent_bills 
       WHERE payment_status = 'pending' 
       AND tx_ref IS NOT NULL`
    );
    if (!Array.isArray(bills)) {
      throw new Error('Invalid database response format');
    }

    const results = await Promise.all(
      bills.map(async bill => {
        try {
          const verification = await this.verifyPayment(bill.tx_ref);
          return {
            tx_ref: bill.tx_ref,
            status: verification.verified ? 'verified' : 'failed',
            details: verification
          };
        } catch (error) {
          return {
            tx_ref: bill.tx_ref,
            status: 'failed',
            error: error.message
          };
        }
      })
    );

    res.json({
      processed: results.length,
      success: results.filter(r => r.status === 'verified').length,
      failures: results.filter(r => r.status === 'failed').length,
      results
    });
  } catch (error) {
    logPaymentEvent('BULK_VERIFY_ERROR', error.message);
    res.status(500).json({
      error: 'Bulk verification failed',
      details: error.message
    });
  }
};