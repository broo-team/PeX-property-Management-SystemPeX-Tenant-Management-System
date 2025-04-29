import React, { useState, useEffect, useRef } from "react"; // Import useRef
import { motion } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, Upload } from "lucide-react"; // Import Upload icon
import { toast } from "@/components/ui/use-toast";
import PaymentButton from "../payment/PaymentButton"; // Assuming the path is correct
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Import Label for file input
import { useAuth } from "@/contexts/AuthContext"; // Assuming this provides user info
import Modal from "@/components/ui/CustomModal"; // Assuming your modal component path
import axios from "axios";
import moment from "moment";
// Import router hooks
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';


export interface LeasePayment {
    _id: string;
    roomNo: string[];
    paymentStatus: string;
    paymentDueDate: string;
    price: number;
    penalty: number;
    totalDue: number;
    fullName: string;
    paymentProof?: string; // This might store the file path/URL from the backend
    billId?: string;
    billDetails?: { // Added billDetails to interface based on usage
      fullName: string;
      roomNo: string[]; // Changed from string to string[]
      phone: string | undefined;
      tenantId: number | undefined;
    }
}

const LeasePayments: React.FC = () => {
    const { user } = useAuth();
    const [leasePayments, setLeasePayments] = useState<LeasePayment[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [proofModalVisible, setProofModalVisible] = useState<boolean>(false);
    const [selectedPayment, setSelectedPayment] = useState<LeasePayment | null>(null);
    // Changed state to hold a File object or null
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

    // Get router hooks
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    const fetchLeasePayments = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [tenantRes, billRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/tenants`),
                axios.get(`http://localhost:5000/api/rent`),
            ]);
            const tenants = tenantRes.data;
            const bills = billRes.data;

            // Exclude terminated tenants and filter for the logged-in tenant
            const activeTenant = tenants.find(
                (tenant: any) => Number(tenant.terminated) === 0 && tenant.tenant_id === user.tenant?.tenant_id
            );

            if (activeTenant) {
                const termRaw = Number(activeTenant.payment_term) || 30;
                let termDays;
                if (termRaw > 12) { // Assuming term > 12 means days, otherwise months
                    termDays = termRaw;
                } else {
                    termDays = termRaw * 30;
                }
                const monthlyRent = parseFloat(activeTenant.monthlyRent) || 0;
                const rentEnd = activeTenant.rent_end_date;

                // Find the existing bill for this tenant using tenant_id
                const tenantBill = bills.find((b: any) => b.tenant_id === user.tenant?.tenant_id);


                const tenantIdForPayment = user.tenant?.tenant_id;
                const billDetailsForPayment = {
                    fullName: activeTenant.full_name,
                    roomNo: [activeTenant.roomName], // Assuming roomName is a single string
                    phone: user?.tenant?.phone,
                    tenantId: tenantIdForPayment,
                };

                if (tenantBill) {
                     // Calculate totalDue including penalty from the actual bill object
                     const totalAmountDue = parseFloat(tenantBill.amount) + (parseFloat(tenantBill.penalty) || 0);

                    setLeasePayments([
                        {
                            _id: tenantBill.id.toString(), // Use bill id as the unique key
                            billId: tenantBill.id ? tenantBill.id.toString() : undefined,
                            fullName: activeTenant.full_name,
                            roomNo: [activeTenant.roomName],
                            paymentStatus: tenantBill.payment_status,
                             // Format due date from the bill
                            paymentDueDate: moment(tenantBill.due_date).format("YYYY-MM-DD"),
                            // Use bill amount and penalty directly from the fetched bill
                            price: parseFloat(tenantBill.amount) || 0,
                            penalty: parseFloat(tenantBill.penalty) || 0,
                            totalDue: totalAmountDue,
                            paymentProof: tenantBill.payment_proof_url || "",
                            // Pass billDetails separately for the payment button
                            billDetails: billDetailsForPayment,
                        },
                    ]);
                } else {
                     // Fallback or initial state if no bill found.
                     // Consider if you should show anything here if there's no generated bill yet.
                     // Your backend initializes a bill on payment attempt, so this case might mean no payment has been initiated yet or the bill is paid and a new one hasn't been generated by cron/logic.
                     // For simplicity, creating a placeholder based on tenant info:
                     const futureDueDate = rentEnd && moment(rentEnd).isAfter(moment())
                         ? moment(rentEnd).format("YYYY-MM-DD")
                         : moment().add(termDays, "days").format("YYYY-MM-DD");

                     // Assuming the totalDue here should be the monthly rent if no bill exists
                     const placeholderTotalDue = monthlyRent;


                    setLeasePayments([
                        {
                            _id: activeTenant.tenant_id.toString(), // Use tenant_id as fallback unique key
                            fullName: activeTenant.full_name,
                            roomNo: [activeTenant.roomName],
                            paymentStatus: "pending", // Assuming pending if no bill exists (might need refinement)
                            paymentDueDate: futureDueDate,
                            price: monthlyRent,
                            penalty: 0,
                            totalDue: placeholderTotalDue,
                            paymentProof: "",
                            billDetails: billDetailsForPayment,
                            billId: undefined, // No billId if no bill found
                        },
                    ]);
                    console.warn("No pending bill found for tenant, showing placeholder.");
                }
            } else {
                setLeasePayments([]); // No active tenant found for the logged-in user
                console.warn("No active tenant found for logged-in user.");
            }
        } catch (error) {
            console.error("Error fetching lease payments:", error);
            toast({
                title: "Error",
                description: "Unable to fetch payments. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to fetch lease payments on component mount or user change
    useEffect(() => {
        fetchLeasePayments();
    }, [user]);

    // NEW useEffect to handle payment callback parameters
    useEffect(() => {
        const paymentStatus = searchParams.get('payment_status');
        const txRef = searchParams.get('tx_ref');
        const message = searchParams.get('message');
        const code = searchParams.get('code');
        const errorMessage = searchParams.get('error_message');
        const trxRefChapa = searchParams.get('trx_ref'); // Chapa's specific param

        // Check if any payment-related search params exist
        const hasPaymentParams = paymentStatus || txRef || message || code || errorMessage || trxRefChapa;

        if (hasPaymentParams) {
            if (paymentStatus === 'success') {
                toast({
                    title: "Payment Confirmed!",
                    description: `Your payment has been successfully verified. Transaction Reference: ${txRef || trxRefChapa}`,
                    // Assuming you have a success variant style for toasts
                    // variant: "success",
                });
                 // Optionally refetch data immediately after successful verification
                 fetchLeasePayments();

            } else if (paymentStatus === 'failed' || paymentStatus === 'error') {
                let errorDescription = "Payment verification failed.";
                if (code && code !== 'unknown_error') {
                    errorDescription = `Payment failed. Reason Code: ${code}.`;
                } else if (errorMessage) {
                     errorDescription = `Payment failed. Details: ${decodeURIComponent(errorMessage)}.`;
                } else if (message) {
                    errorDescription = message; // Fallback to generic message
                }


                toast({
                    title: "Payment Failed",
                    description: `Your payment attempt for reference ${txRef || trxRefChapa || 'N/A'} failed. ${errorDescription}`,
                    variant: "destructive",
                });
            } else if (paymentStatus === 'canceled') {
                toast({
                    title: "Payment Canceled",
                    description: `Your payment attempt for reference ${txRef || trxRefChapa || 'N/A'} was canceled.`,
                    // Consider a warning or info variant if available
                    // variant: "warning",
                });
            }

            // Clean up the URL parameters after showing the message
            const currentPath = location.pathname;
            const cleanSearchParams = new URLSearchParams(searchParams);

            // List of parameters to remove
            const paramsToRemove = ['payment_status', 'tx_ref', 'message', 'code', 'error_message', 'trx_ref'];

            paramsToRemove.forEach(param => cleanSearchParams.delete(param));

            // Replace the current history entry, keeping other potential params
            navigate(`${currentPath}${cleanSearchParams.toString() ? '?' + cleanSearchParams.toString() : ''}`, { replace: true });
        }
         // Add dependencies if you want this effect to re-run based on these values
         // In this case, it primarily reacts to URL changes handled by searchParams,
         // location changes, and navigate is stable. Toast is also stable.
         // Added fetchLeasePayments as dep to refetch after successful payment via redirect
     }, [searchParams, location, navigate, toast, fetchLeasePayments]);


    const getStatusColor = (status: string | undefined) => {
        if (!status) return "bg-gray-100 text-gray-800";
        switch (status.toLowerCase()) {
            case "paid":
                return "bg-green-100 text-green-800";
            case "pending":
                 // Check for overdue based on due date
                 // Find the specific payment object in the state to get its due date
                const payment = leasePayments.find(p => p.paymentStatus.toLowerCase() === status.toLowerCase());
                const paymentDue = payment?.paymentDueDate;

                if (paymentDue && moment(paymentDue).isBefore(moment(), 'day')) {
                     return "bg-red-100 text-red-800"; // Overdue
                }
                return "bg-yellow-100 text-yellow-800"; // Still pending but not overdue
            case "submitted": // Added handling for 'submitted' status
                return "bg-blue-100 text-blue-800";
            case "overdue": // Explicitly handled if status can be 'overdue'
                 return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const submitProof = async () => {
        // Check if a file is selected
        if (!selectedFile || !selectedPayment) {
            toast({
                title: "Error",
                description: "Please select an image file for submission.",
                variant: "destructive",
            });
            return;
        }

        if (!selectedPayment.billId) {
             toast({
                 title: "Error",
                 description: "Cannot upload proof without a pending bill. Please try paying online first.",
                 variant: "destructive",
             });
             return;
        }

        try {
            const formData = new FormData();
            // 'paymentProof' should match the field name expected by your Multer middleware on the backend
            formData.append("paymentProof", selectedFile);

            await axios.patch(
                `http://localhost:5000/api/rent/${selectedPayment.billId}/proof`,
                formData, // Send the FormData object
                {
                    headers: {
                        // Axios usually sets Content-Type to multipart/form-data automatically with FormData
                        // 'Content-Type': 'multipart/form-data',
                    },
                }
            );

            toast({
                title: "Success",
                description: "Payment proof submitted successfully. It will be reviewed.",
            });
            setProofModalVisible(false);
            setSelectedFile(null); // Clear the selected file
            if (fileInputRef.current) {
              fileInputRef.current.value = ""; // Clear the file input visually
            }
            fetchLeasePayments(); // Refresh list after submission
        } catch (error) {
            console.error("Error submitting payment proof:", error);
            const errorMessage = axios.isAxiosError(error) && error.response?.data?.message
                                 ? error.response.data.message
                                 : "Failed to upload payment proof. Please try again.";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const renderSkeleton = () => (
         // Simple loading placeholder
        <div className="space-y-4">
            {[1, 2].map(i => ( // Render a couple of placeholder cards
                <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/6"></div>
                    </div>
                     <div className="flex justify-between items-center">
                        <div>
                            <div className="h-3 bg-gray-300 rounded w-1/5 mb-1"></div>
                            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                        </div>
                        <div className="text-right">
                             <div className="h-3 bg-gray-300 rounded w-1/5 mb-1 ml-auto"></div>
                             <div className="h-5 bg-gray-300 rounded w-1/4 ml-auto"></div>
                        </div>
                     </div>
                     <div className="flex justify-end gap-2 mt-4">
                         <div className="h-8 bg-gray-300 rounded w-20"></div>
                         <div className="h-8 bg-gray-300 rounded w-24"></div>
                     </div>
                </div>
            ))}
        </div>
    );

    // Function to handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        setSelectedFile(event.target.files[0]);
      } else {
        setSelectedFile(null);
      }
    };


    return (
        <TabsContent value="lease">
            <Card className="bg-white shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-emerald-600">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                            <DollarSign className="h-5 w-5" /> Lease Payments
                        </CardTitle>
                    </div>
                    <CardDescription className="text-emerald-50">
                        Manage your monthly lease payments
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {isLoading ? (
                        renderSkeleton()
                    ) : leasePayments.length > 0 ? (
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-4">
                                {leasePayments.map((payment) => (
                                    <motion.div
                                        key={payment._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-lg border border-emerald-100 p-6 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex flex-col space-y-4">
                                             <div className="flex justify-between items-start">
                                                 <div>
                                                     <p className="text-sm text-gray-500">Tenant Name</p>
                                                     <p className="text-lg font-semibold">{payment.fullName}</p>
                                                 </div>
                                                 <div>
                                                     <p className="text-sm text-gray-500 text-right">Room Number(s)</p>
                                                     <p className="text-lg font-semibold text-right">
                                                         {payment.roomNo.join(", ")} {/* Assuming roomNo is an array */}
                                                     </p>
                                                 </div>
                                             </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-gray-500">Due Date</p>
                                                    <p className="text-base font-medium">
                                                        {payment.paymentDueDate}
                                                    </p>
                                                </div>
                                                <Badge className={getStatusColor(payment.paymentStatus)}>
                                                     {payment.paymentStatus}
                                                </Badge>
                                            </div>
                                            {payment.penalty > 0 && (
                                                 <p className="text-sm text-orange-500 text-right">
                                                     Penalty: {payment.penalty} ETB
                                                 </p>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-gray-500">Rent Amount</p>
                                                    <p className="text-xl font-bold text-emerald-600">
                                                         {payment.price} ETB
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">Total Due</p>
                                                    <p className="text-2xl font-bold text-emerald-600">
                                                         {payment.totalDue} ETB
                                                    </p>
                                                </div>
                                            </div>
                                            {payment.paymentProof && (
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-500">Payment Proof:</p>
                                                    {/* You might want to display the image or a link to it */}
                                                    <a
                                                        href={payment.paymentProof}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline text-sm break-all"
                                                    >
                                                        View Proof
                                                    </a>
                                                </div>
                                            )}
                                            <div className="flex justify-end gap-2 mt-4">
                                                 {/* Check paymentStatus for disabling Pay button */}
                                                 <PaymentButton
                                                     type="lease"
                                                     billId={payment.billId} // Pass the billId found during fetch
                                                     amount={payment.totalDue} // Use totalDue for the payment amount
                                                     disabled={payment.paymentStatus.toLowerCase() === "paid" || payment.paymentStatus.toLowerCase() === "submitted" || !payment.billId} // Disable if paid, submitted, or no billId exists
                                                     billDetails={payment.billDetails} // Use the pre-structured billDetails
                                                     tenantId={user.tenant?.tenant_id} // Ensure tenantId is passed correctly

                                                     // Remove onSuccess toast here. It will be handled by the useEffect on redirect.
                                                     onSuccess={() => {
                                                          console.log("Payment initialization successful, redirecting...");
                                                     }}
                                                     onError={(error: any) => {
                                                          console.error("Payment initialization error:", error);
                                                          const errorMessage = error.response?.data?.details
                                                               || error.message
                                                               || "Failed to process payment initialization.";
                                                          toast({
                                                              title: "Payment Initialization Failed",
                                                              description: errorMessage,
                                                              variant: "destructive",
                                                          });
                                                     }}
                                                 />
                                                 <Button
                                                     variant="outline"
                                                     onClick={() => {
                                                          // Only allow submitting proof if there is a billId and it's not paid or submitted
                                                          if (payment.billId && payment.paymentStatus.toLowerCase() !== "paid" && payment.paymentStatus.toLowerCase() !== "submitted") {
                                                               setSelectedPayment(payment);
                                                               setProofModalVisible(true);
                                                          } else if (!payment.billId) {
                                                               toast({
                                                                    title: "Action Not Allowed",
                                                                    description: "Upload proof is only available for existing pending bills.",
                                                                    variant: "destructive"
                                                               });
                                                          } else if (payment.paymentStatus.toLowerCase() === "submitted") {
                                                                toast({
                                                                    title: "Proof Already Submitted",
                                                                    description: "Payment proof has already been submitted for this bill. It is awaiting admin approval.",
                                                                    variant: "default" // or info variant
                                                                });
                                                          }
                                                           else {
                                                                toast({
                                                                    title: "Action Not Allowed",
                                                                    description: "Payment is already marked as paid.",
                                                                    variant: "default" // or info variant
                                                               });
                                                          }
                                                     }}
                                                      // Disable if paid or no billId exists
                                                     disabled={payment.paymentStatus.toLowerCase() === "paid" || payment.paymentStatus.toLowerCase() === "submitted" || !payment.billId}
                                                 >
                                                     Upload Proof
                                                 </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="text-center py-10">
                            <DollarSign className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No lease payments found.</p>
                             {/* Optionally provide a button to manually trigger fetch again */}
                             <Button onClick={fetchLeasePayments} className="mt-4" disabled={isLoading}>
                                 {isLoading ? "Refreshing..." : "Refresh Payments"}
                             </Button>
                        </div>
                    )}
                     {/* Optional: Add a button here to manually trigger fetchLeasePayments if needed outside useEffect */}
                     {/* <Button onClick={fetchLeasePayments} disabled={isLoading}>Refresh</Button> */}
                </CardContent>
            </Card>

            <Modal
                open={proofModalVisible}
                onClose={() => {
                  setProofModalVisible(false);
                  setSelectedFile(null); // Clear selected file on close
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""; // Clear input visually
                  }
                }}
                title="Submit Payment Proof"
            >
                <div className="p-6">
                    <div className="grid w-full max-w-sm items-center gap-1.5"> {/* Use grid for better alignment */}
                        <Label htmlFor="payment-proof-file">Upload Image Proof</Label> {/* Label for accessibility */}
                        <Input
                            id="payment-proof-file"
                            type="file"
                            accept="image/*" // Accept only image files
                            onChange={handleFileChange}
                            ref={fileInputRef} // Attach ref
                        />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Please upload a screenshot or image of your payment receipt.</p>
                    {selectedFile && (
                        <p className="text-sm text-green-600 mt-2">Selected file: {selectedFile.name}</p>
                    )}
                    <div className="flex justify-end mt-6 gap-2">
                        <Button variant="ghost" onClick={() => {
                            setProofModalVisible(false);
                            setSelectedFile(null); // Clear selected file
                             if (fileInputRef.current) {
                                fileInputRef.current.value = ""; // Clear input visually
                             }
                        }}>
                            Cancel
                        </Button>
                         {/* Disable if no file is selected */}
                        <Button onClick={submitProof} disabled={!selectedFile}>
                             Submit Proof
                        </Button>
                    </div>
                </div>
            </Modal>
        </TabsContent>
    );
};

export default LeasePayments;