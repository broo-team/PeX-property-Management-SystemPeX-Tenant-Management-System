const axios = require('axios');
const crypto = require('crypto');

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';
const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

/**
 * Initialize a transaction with Chapa.
 *
 * @param {Object} transactionData - Object containing transaction properties.
 * @returns {Object} - The complete response from Chapa API.
 */
exports.initializeTransaction = async (transactionData) => {
  try {
    // Generate a unique reference if not provided
    const customTxRef = crypto.randomBytes(8).toString('hex');

    // Build payload as required by Chapa API
    const payload = {
      amount: transactionData.amount,
      currency: transactionData.currency || 'ETB',
      email: transactionData.email || '',
      first_name: transactionData.first_name,
      last_name: transactionData.last_name || '',
      phone_number: transactionData.phone_number,
      tx_ref: transactionData.tx_ref || customTxRef,
      callback_url: transactionData.callback_url || process.env.CHAPA_CALLBACK_URL,
      return_url: `${process.env.CHAPA_RETURN_URL}?trx_ref=${transactionData.tx_ref || customTxRef}`,
      customization: {
        title: transactionData.customizationTitle?.slice(0, 16) || "Rent Payment",
        description: transactionData.customizationDescription || "Rent payment"
      },
      meta: {
        hide_receipt: transactionData.meta?.hide_receipt || "true",
        tenantId: transactionData.meta?.tenantId || "43",
        internal_tx_ref: customTxRef
      }
    };

    console.log("Final payload sent to Chapa API:", JSON.stringify(payload, null, 2));

    // Send request to initialize the transaction
    const response = await axios.post(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chapaSecretKey}`,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Chapa API Error:', {
      message: error.response?.data?.message || error.message,
      details: error.response?.data
    });
    throw error;
  }
};

/**
 * Verify a transaction using the Chapa verification endpoint.
 *
 * @param {string} trx_ref - The transaction reference to verify.
 * @returns {Object} - The response data from Chapa, which should include
 *                     a status field (expected to be "success")
 */
exports.verifyTransaction = async (trx_ref) => {
  try {
    // Request verification of the specific transaction
    const response = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${trx_ref}`,
      {
        headers: {
          'Authorization': `Bearer ${chapaSecretKey}`,
        },
      }
    );

    console.log("Chapa verification response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Verification Error:', {
      message: error.response?.data?.message || error.message,
      details: error.response?.data
    });
    throw error;
  }
};