import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/authService';
import { toast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      console.group('Payment Verification Process - Frontend');
      try {
        // Get tx_ref from URL parameters
        const params = new URLSearchParams(window.location.search);
        const tx_ref = params.get('tx_ref');
        
        console.log('Full URL:', window.location.href);
        console.log('Search params:', params.toString());
        console.log('TX Reference:', tx_ref);

        if (!tx_ref) {
          console.error('No transaction reference found in URL:', window.location.search);
          throw new Error('Transaction reference not found');
        }

        console.log('2. Making verification request for tx_ref:', tx_ref);
        
        const response = await axiosInstance.get(`/api/transactions/verify/${tx_ref}`);
        console.log('3. Verification API Response:', response.data);
        
        if (response.data.success && response.data.data.verified) {
          console.log('4. Verification successful');
          setVerificationStatus('success');
          setPaymentDetails(response.data.data);
          toast({
            title: "Payment Successful",
            description: "Your payment has been verified and processed.",
          });
        } else {
          console.log('4. Verification failed:', response.data);
          setVerificationStatus('failed');
          throw new Error(response.data.message || 'Payment verification failed');
        }

      } catch (error: any) {
        console.error('5. Verification error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        setVerificationStatus('failed');
        toast({
          title: "Verification Failed",
          description: error.message || "Unable to verify your payment. Please contact support.",
          variant: "destructive"
        });
      } finally {
        console.groupEnd();
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {verificationStatus === 'loading' && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-emerald-900 mb-2">
              Verifying Payment
            </h2>
            <p className="text-emerald-600">
              Please wait while we verify your payment...
            </p>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-emerald-900 mb-2">
              Payment Successful!
            </h2>
            {paymentDetails && (
              <div className="mb-6 text-left bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-700">
                  <span className="font-semibold">Amount:</span> {paymentDetails.transaction.amount} ETB
                </p>
                <p className="text-sm text-emerald-700">
                  <span className="font-semibold">Type:</span> {paymentDetails.transaction.type}
                </p>
                <p className="text-sm text-emerald-700">
                  <span className="font-semibold">Status:</span> {paymentDetails.transaction.status}
                </p>
              </div>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {verificationStatus === 'failed' && (
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-red-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-red-600 mb-6">
              We couldn't verify your payment. Please contact support for assistance.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}