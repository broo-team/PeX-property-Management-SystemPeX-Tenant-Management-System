// pages/payment/PaymentButton.tsx

import React from "react";

interface PaymentButtonProps {
  type: string; // e.g., "electricity", "water"
  billId: string;
  amount: number;
  disabled?: boolean;
  billDetails: Record<string, any>; // You can be more specific with this type
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

const UtilityPayment: React.FC<PaymentButtonProps> = ({
  type,
  billId,
  amount,
  disabled,
  billDetails,
  onSuccess,
  onError,
}) => {
  const handlePayment = () => {
    if (disabled) {
      return;
    }

    // --- Placeholder for your actual payment integration ---
    console.log("Initiating payment...", {
      type,
      billId,
      amount,
      billDetails,
    });

    // Simulate a successful payment after a short delay
    setTimeout(() => {
      console.log("Payment successful for bill ID:", billId);
      if (onSuccess) {
        onSuccess();
      }
    }, 1500);

    // You would replace the setTimeout with your actual payment gateway logic
    // For example, redirecting to a payment page or calling an API.

    // In a real scenario, you would also handle potential errors and call onError()
    // if the payment fails.
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled}
      className={`bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {disabled ? "Paid" : `Pay ${new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)}`}
    </button>
  );
};

export default UtilityPayment;