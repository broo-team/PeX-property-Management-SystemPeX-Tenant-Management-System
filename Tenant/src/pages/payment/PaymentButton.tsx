import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

export interface BillDetails {
    fullName: string;
    email?: string;
    roomNo: string[];
    phone?: string;
    tenantId?: string;
}

export interface PaymentButtonProps {
    type: string;
    billId: string;
    amount: number;
    disabled?: boolean;
    billDetails: BillDetails;
    onSuccess: () => void;
    onError: (error: any) => void;
    tenantId?: string;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
    type,
    billId,
    amount,
    disabled = false,
    billDetails,
    onSuccess,
    onError,
    tenantId: tenantIdProp,
}) => {
    const [loading, setLoading] = useState(false);
    const { tenantPhone, tenantName } = useAuth();

    const initiatePayment = async () => {
        setLoading(true);
        try {
            // Format name and contact details
            const fullName = billDetails.fullName || tenantName;
            const [first_name, ...lastNameParts] = fullName.trim().split(" ");
            const last_name = lastNameParts.join(" ") || " ";

            const phone_number = billDetails.phone || tenantPhone || "";
            if (!phone_number) {
                throw new Error("Phone number is required for payment");
            }

            // Determine tenantId, prioritizing props
            const finalTenantId = tenantIdProp || billDetails.tenantId || billId;

            console.log("DEBUG: tenantId prop:", tenantIdProp);
            console.log("DEBUG: billDetails.tenantId:", billDetails.tenantId);
            console.log("DEBUG: billId prop:", billId);
            console.log("DEBUG: finalTenantId:", finalTenantId);

            if (!finalTenantId) {
                console.error("ERROR: tenantId is missing!");
                toast({
                    title: "Payment Error",
                    description: "Missing tenant information. Please contact support.",
                    variant: "destructive",
                });
                onError(new Error("Missing tenantId"));
                return; // Stop the payment initiation
            }

            // Build payload with proper metadata structure
            const payload = {
                amount: amount.toFixed(2), // Ensure 2 decimal places
                currency: "ETB",
                email: billDetails.email || "",
                first_name,
                last_name,
                phone_number,
                meta: {
                    tenantId: finalTenantId,
                    hide_receipt: "true",
                },
            };

            console.log("Payment payload:", payload);

            // Send request to your backend
            const response = await axios.post(
                `http://localhost:5000/api/payments/initialize`,
                payload
            );

            console.log("Payment initialization response:", response); // Debugging

            if (response.data?.checkout_url) {
                console.log("Redirecting to:", response.data.checkout_url); // Debugging
                onSuccess();
                window.location.href = response.data.checkout_url;
            } else {
                console.error("No payment URL received:", response.data); // Debugging
                toast({
                    title: "Payment Error",
                    description: "Failed to retrieve checkout URL.",
                    variant: "destructive",
                });
                onError(new Error("No payment URL received"));
            }

        } catch (error: any) {
            console.error("Payment failed:", error);

            const errorMessage = error.response?.data?.message
                || "Payment initialization failed. Please try again.";

            toast({
                title: "Payment Error",
                description: errorMessage,
                variant: "destructive",
            });

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