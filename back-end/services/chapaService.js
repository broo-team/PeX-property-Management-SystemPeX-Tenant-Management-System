const axios = require('axios');
const crypto = require('crypto');

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';
const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

/**
 * Helper function to sanitize the customization.description.
 *
 * @param {string} description - The description to sanitize.
 * @returns {string} - The sanitized description.
 */
const sanitizeDescription = (description) => {
  // Remove any character that is not a letter, number, hyphen, underscore, space, or dot.
  return description.replace(/[^A-Za-z0-9\-_. ]/g, '');
};

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
    const txRef = transactionData.tx_ref || customTxRef;

    // Auto-detect payment type from tx_ref prefix
    const isUtilityPayment = txRef.startsWith('UTIL-');
    
    // Determine return URL based on payment type
    const returnUrlBase = isUtilityPayment 
      ? process.env.CHAPA_RETURN_UTILITY_URL 
      : process.env.CHAPA_RETURN_URL;

    const payload = {
      amount: transactionData.amount,
      currency: transactionData.currency || 'ETB',
      email: transactionData.email || '',
      first_name: transactionData.first_name,
      last_name: transactionData.last_name || '',
      phone_number: transactionData.phone_number,
      tx_ref: txRef,
      callback_url: transactionData.callback_url || process.env.CHAPA_CALLBACK_URL,
      return_url: `${returnUrlBase}?trx_ref=${txRef}`,
      customization: {
        // Preserve existing customization or set defaults
        title: (transactionData.customization?.title || (isUtilityPayment ? "Utility Payment" : "Rent Payment"))
          .slice(0, 16),
        description: sanitizeDescription(
          transactionData.customization?.description || 
          (isUtilityPayment ? "Utility payment" : "Rent payment")
        )
      },
      meta: {
        // Preserve all existing meta data
        ...transactionData.meta,
        hide_receipt: transactionData.meta?.hide_receipt || "true",
        tenantId: transactionData.meta?.tenantId || "43",
        internal_tx_ref: txRef // Use the same reference as tx_ref
      }
    };

    console.log("Final payload:", JSON.stringify(payload, null, 2));

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
    // Validate the trx_ref
    if (!trx_ref || typeof trx_ref !== 'string') {
      throw new Error('Invalid transaction reference');
    }

    console.log('[VERIFY_TRANSACTION] Verifying tx_ref:', trx_ref);

    // Request verification of the specific transaction
    const response = await axios.get(`${CHAPA_BASE_URL}/transaction/verify/${trx_ref}`, {
      headers: {
        'Authorization': `Bearer ${chapaSecretKey}`,
      },
    });

    console.log('[VERIFY_TRANSACTION] Response:', JSON.stringify(response.data, null, 2));

    // Check the status field in the response
    if (response.data.status === 'success') {
      return response.data;
    } else {
      throw new Error(`Transaction verification failed: ${response.data.message}`);
    }
  } catch (error) {
    console.error('[VERIFY_TRANSACTION] Error:', {
      message: error.response?.data?.message || error.message,
      details: error.response?.data,
    });
    throw error; // Re-throw the error for the caller to handle
  }
};

// exports.verifyTransaction = async (trx_ref) => {
//   try {
//     // Request verification of the specific transaction
//     const response = await axios.get(
//       `${CHAPA_BASE_URL}/transaction/verify/${trx_ref}`,
//       {
//         headers: {
//           'Authorization': `Bearer ${chapaSecretKey}`,
//         },
//       }
//     );

//     console.log("Chapa verification response:", JSON.stringify(response.data, null, 2));
//     return response.data;
//   } catch (error) {
//     console.error('Verification Error:', {
//       message: error.response?.data?.message || error.message,
//       details: error.response?.data
//     });
//     throw error;
//   }
// };

