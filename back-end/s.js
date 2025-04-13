var request = require('request');
  var options = {
    'method': 'POST',
    'url': 'https://api.chapa.co/v1/transaction/initialize',
    'headers': {
  'Authorization': 'Bearer CHASECK-xxxxxxxxxxxxxxxx',
  'Content-Type': 'application/json'
    },
    body: JSON.stringify({
  "amount": "10",
  "currency": "ETB",
  "email": "abebech_bekele@gmail.com",
  "first_name": "Bilen",
  "last_name": "Gizachew",
  "phone_number": "0912345678",
  "tx_ref": "chewatatest-6669",
  "callback_url": "https://webhook.site/077164d6-29cb-40df-ba29-8a00e59a7e60",
  "return_url": "https://www.google.com/",
  "customization[title]": "Payment for my favourite merchant",
  "customization[description]": "I love online payments",
  "meta[hide_receipt]": "true"
    })
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
  });
  s 
Contact photo
To Side on 2025-04-04 15:00
Details Headers
// Verify the payment with Chapa
    const verificationResponse = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`
        }
      }
    );

    if (verificationResponse.data.status === 'success') {
      // Update transaction status
      transaction.status = 'COMPLETED';
      transaction.paymentDetails.paymentDate = new Date();
      transaction.paymentDetails.verificationData = verificationResponse.data;
      await transaction.save();

      // Update the corresponding bill
      const BillModel = transaction.paymentType === 'LEASE' ? LeasePayment : ElectricityBill;
      await BillModel.findByIdAndUpdate(transaction.billReference, {
        paymentStatus: 'Paid'
      });

      res.status(200).json({ success: true });
    } else {
      transaction.status = 'FAILED';
      await transaction.save();

      res.status(200).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Callback handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process callback'
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;

    console.group('Payment Verification Process');
    console.log('1. Starting verification for tx_ref:', tx_ref);
    console.log('2. Request params:', req.params);

    // Call Chapa's verification endpoint
    console.log('3. Calling Chapa API with URL:', `https://api.chapa.co/v1/transaction/verify/${tx_ref}`);
    const verificationResponse = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('4. Chapa API Response:', JSON.stringify(verificationResponse.data, null, 2));

    // Detailed logging of the response structure
    console.log('5. Response Status:', verificationResponse.data.status);
    console.log('6. Response Data:', verificationResponse.data.data);

    // Check if the verification was successful
    const isSuccess =
      verificationResponse.data.status === 'success' ||
      verificationResponse.data.data?.status === 'success';

    console.log('7. Verification Success Status:', isSuccess);

    // Find transaction
    const transaction = await Transaction.findOne({ chapaReference: tx_ref });
    console.log('8. Found Transaction:', transaction);

    if (!transaction) {
      console.log('9. ERROR: Transaction not found in database');
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update transaction
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { chapaReference: tx_ref },
      {
        status: isSuccess ? 'COMPLETED' : 'FAILED',
        verificationResponse: verificationResponse.data,
        verifiedAt: new Date()
      },
      { new: true }
    );

    console.log('9. Updated Transaction:', updatedTransaction);

    // If payment is successful, update the bill status
    if (isSuccess) {
      console.log('10. Updating bill status for successful payment');
      const billModel = transaction.paymentType === 'LEASE' ? LeasePayment : ElectricityBill;

      console.log('11. Bill Model:', transaction.paymentType);
      console.log('12. Bill Reference:', transaction.billReference);

      const updatedBill = await billModel.findByIdAndUpdate(
        transaction.billReference,
        {
          paymentStatus: 'Paid',
          paidAt: new Date(),
          transactionReference: transaction._id
        },
        { new: true }
      );

      console.log('13. Updated Bill:', updatedBill);
    }

    console.log('14. Sending response to client');
    console.groupEnd();

    res.status(200).json({
      success: true,
      data: {
        verified: isSuccess,
        transaction: {
          id: transaction._id,
          status: transaction.status,
          amount: transaction.amount,
          type: transaction.paymentType
        },
        chapaResponse: verificationResponse.data
      }
    });

  } catch (error) {
    console.group('Payment Verification Error');
    console.error('Error Details:', {
      message: error.message,
      stack: error.stack
    });

    if (error.response) {
      console.error('Chapa API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }

    console.groupEnd();

    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.response?.data || error.message,
      errorDetails: {
        status: error.response?.status,
        message: error.message
      }
    });
  }
};

