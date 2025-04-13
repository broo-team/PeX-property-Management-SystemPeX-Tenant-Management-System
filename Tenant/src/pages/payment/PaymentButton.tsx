// import { useState } from 'react';
// import { Button } from "@/components/ui/button";
// import { toast } from "@/components/ui/use-toast";
// import axiosInstance from "@/services/authService";
// import { Loader2 } from "lucide-react";

// interface PaymentButtonProps {
//   type: 'lease' | 'electricity';
//   billId: string;
//   amount: number;
//   disabled?: boolean;
//   billDetails?: {
//     fullName: string;
//     email?: string;
//     roomNo: string | string[];
//   };
//   onSuccess?: () => void;
//   onError?: (error: any) => void;
// }

// export default function PaymentButton({ 
//   type, 
//   billId, 
//   amount, 
//   disabled,
//   billDetails,
//   onSuccess,
//   onError 
// }: PaymentButtonProps) {
//   const [isLoading, setIsLoading] = useState(false);

//   const handlePayment = async () => {
//     console.group('Payment Initialization');
//     console.log('Original Amount:', amount);
  
//     try {
//       setIsLoading(true);
  
//       // Ensure amount is a valid number and format it
//       const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
//       if (isNaN(numericAmount)) {
//         throw new Error('Invalid amount format');
//       }
  
//       const formattedAmount = numericAmount.toFixed(2);
//       console.log('Formatted Amount:', formattedAmount);
  
//       const paymentData = {
//         amount: formattedAmount,
//         paymentType: type,
//         billId,
//         email: billDetails?.email,
//         fullName: billDetails?.fullName,
//         roomNo: billDetails?.roomNo
//       };
  
//       console.log('Sending payment request with data:', paymentData);
//       // ... rest of the code
//       const response = await axiosInstance.post(
//         '/api/transactions/create', 
//         paymentData
//       );

//       console.log('Payment response received:', response.data);

//       if (response.data.success && response.data.data?.checkout_url) {
//         console.log('Redirecting to checkout URL:', response.data.data.checkout_url);
//         window.location.href = response.data.data.checkout_url;
//         onSuccess?.();
//       } else {
//         throw new Error('No checkout URL received');
//       }

//     } catch (error: any) {
//       console.error('Payment error details:', {
//         error,
//         requestData: {
//           type,
//           billId,
//           amount,
//           billDetails
//         },
//         errorResponse: error.response?.data
//       });

//       const errorMessage = error.response?.data?.message || 
//                           error.response?.data?.error ||
//                           "Failed to initialize payment";
      
//       toast({
//         title: "Payment Error",
//         description: errorMessage,
//         variant: "destructive"
//       });
//       onError?.(error);
//     } finally {
//       setIsLoading(false);
//       console.groupEnd();
//     }
//   };

//   return (
//     <Button
//       onClick={handlePayment}
//       disabled={disabled || isLoading}
//       className="bg-emerald-600 hover:bg-emerald-700 text-white"
//     >
//       {isLoading ? (
//         <>
//           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//           Processing...
//         </>
//       ) : disabled ? (
//         'Paid'
//       ) : (
//         'Pay Now'
//       )}
//     </Button>
//   );
// }
import React, { useState } from "react";

export interface BillDetails {
  fullName: string;
  email?: string;
  roomNo: string[];
}

export interface PaymentButtonProps {
  type: string;
  billId: string;
  amount: number;
  disabled?: boolean;
  billDetails: BillDetails;
  onSuccess: () => void;
  onError: (error: any) => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  type,
  billId,
  amount,
  disabled = false,
  billDetails,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);

  const initiatePayment = async () => {
    setLoading(true);
    try {
      // Prepare the payload for your backend.
      const payload = {
        amount,
        currency: "ETB",
        customer: {
          name: billDetails.fullName,
          email: billDetails.email,
          phone: "", // Optionally include phone if available.
        },
        tenantId: billId, // Using billId as identifier; adjust as needed.
      };

      console.log("Sending payload to /api/payments/initialize:", payload);

      const response = await fetch("http://localhost:5000/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Payment initialization failed, please try again."
        );
      }

      const data = await response.json();
      console.log("Response from backend:", data);

      // Look for the payment URL using both possible keys.
      const paymentUrl = data.payment_url || data.url;
      if (paymentUrl) {
        onSuccess();
        window.location.href = paymentUrl;
      } else {
        throw new Error("Invalid payment response from server: " + JSON.stringify(data));
      }
    } catch (error: any) {
      console.error("Payment error:", error.message || error);
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={initiatePayment}
      disabled={disabled || loading}
      className="btn btn-primary"
    >
      {loading ? "Processing..." : "Pay Now"}
    </button>
  );
};

export default PaymentButton;
