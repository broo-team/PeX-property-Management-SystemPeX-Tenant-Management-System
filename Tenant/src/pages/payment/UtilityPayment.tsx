import React from "react";

interface BillDetails {
  fullName: string;
  email: string;
  roomNo: string;
  tenantId: number;
  phone: string;
}

interface PaymentButtonProps {
  type: string; // e.g., "electricity", "water"
  billId: string;
  amount: number;
  disabled?: boolean;
  billDetails: BillDetails;
  phone?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const UtilityPayment: React.FC<PaymentButtonProps> = ({
  type,
  billId,
  amount,
  disabled = false,
  billDetails,
  phone = "",
  onSuccess = () => {},
  onError = (error) => console.error(error),
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePayment = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/utility/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          billId,
          amount,
          tenantDetails: billDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initialize payment");
      }

      // Extract the checkout URL from the response
      const checkoutUrl = data.data?.checkout_url;

      if (!checkoutUrl) {
        throw new Error("Invalid response: Missing checkout URL");
      }

      // Open the payment page in a new tab
      window.open(checkoutUrl, "_blank");

      // Trigger success callback
      onSuccess();
    } catch (error) {
      console.error("Payment initialization error:", error);
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-label={`Pay ${formatCurrency(amount)}`}
      className={`bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
        disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {isLoading
        ? "Processing..."
        : disabled
        ? "Paid"
        : `Pay ${formatCurrency(amount)}`}
    </button>
  );
};

export default UtilityPayment;