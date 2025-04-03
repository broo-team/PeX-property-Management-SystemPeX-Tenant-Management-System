// src/services/chapaService.js
const axios = require('axios');

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';
const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

// Optional debug: verify the API key is loaded correctly.
console.log("CHAPA_SECRET_KEY:", chapaSecretKey);

/*
  transactionData should contain:
  {
    amount: Number,
    currency: String,
    customer: { name: String, email: String, phone: String },
    redirect_url: String,
    cancel_url: String,
    meta: { tenantId: String } // optional
  }
*/
exports.initializeTransaction = async (transactionData) => {
  try {
    const response = await axios.post(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      {
        amount: transactionData.amount,
        currency: transactionData.currency,
        customer: transactionData.customer,
        redirect_url: transactionData.redirect_url,
        cancel_url: transactionData.cancel_url,
        meta: transactionData.meta,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chapaSecretKey}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error('Chapa API error:', error.response?.data || error.message);
    throw error;
  }
};
