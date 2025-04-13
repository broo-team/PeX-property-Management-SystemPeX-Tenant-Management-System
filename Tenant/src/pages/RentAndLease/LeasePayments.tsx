import React, { useState, useEffect } from "react";
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
import { DollarSign } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import PaymentButton from "../payment/PaymentButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/ui/CustomModal";
import axios from "axios";
import moment from "moment";

export interface LeasePayment {
    _id: string;
    roomNo: string[];
    paymentStatus: string;
    paymentDueDate: string;
    price: number;
    penalty: number;
    totalDue: number;
    fullName: string;
    paymentProof?: string;
    billId?: string;
}

const LeasePayments: React.FC = () => {
    const { user } = useAuth();
    const [leasePayments, setLeasePayments] = useState<LeasePayment[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [proofModalVisible, setProofModalVisible] = useState<boolean>(false);
    const [selectedPayment, setSelectedPayment] = useState<LeasePayment | null>(null);
    const [proofLink, setProofLink] = useState("");

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
                (tenant) => Number(tenant.terminated) === 0 && tenant.tenant_id === user.tenant?.tenant_id
            );

            if (activeTenant) {
                const termRaw = Number(activeTenant.payment_term) || 30;
                let termDays, termMonths;
                if (termRaw > 12) {
                    termDays = termRaw;
                    termMonths = termRaw / 30;
                } else {
                    termMonths = termRaw;
                    termDays = termRaw * 30;
                }
                const monthlyRent = parseFloat(activeTenant.monthlyRent) || 0;
                const rentStart = activeTenant.rent_start_date;
                const rentEnd = activeTenant.rent_end_date;

                // Find the existing bill for this tenant using tenant_id
                const tenantBill = bills.find((b) => b.tenant_id === user.tenant?.tenant_id);

                const tenantIdForPayment = user.tenant?.tenant_id;
                const billDetails = {
                    fullName: activeTenant.full_name,
                    roomNo: [activeTenant.roomName],
                    phone: user?.tenant?.phone,
                    tenantId: tenantIdForPayment,
                };

                if (tenantBill) {
                    setLeasePayments([
                        {
                            _id: tenantBill.id.toString(),
                            billId: tenantBill.id ? tenantBill.id.toString() : undefined,
                            fullName: activeTenant.full_name,
                            roomNo: [activeTenant.roomName],
                            paymentStatus: tenantBill.payment_status,
                            paymentDueDate: moment(tenantBill.due_date).format("YYYY-MM-DD"),
                            price: monthlyRent,
                            penalty: parseFloat(tenantBill.penalty) || 0,
                            totalDue: parseFloat(tenantBill.amount) + (parseFloat(tenantBill.penalty) || 0),
                            paymentProof: tenantBill.payment_proof_url || "",
                            billDetails: billDetails,
                        },
                    ]);
                } else {
                    const futureDueDate = rentEnd && moment(rentEnd).isAfter(moment())
                        ? moment(rentEnd).format("YYYY-MM-DD")
                        : moment().add(termDays, "days").format("YYYY-MM-DD");
                    setLeasePayments([
                        {
                            _id: activeTenant.id.toString(),
                            fullName: activeTenant.full_name,
                            roomNo: [activeTenant.roomName],
                            paymentStatus: "pending",
                            paymentDueDate: futureDueDate,
                            price: monthlyRent,
                            penalty: 0,
                            totalDue: monthlyRent * termMonths,
                            paymentProof: "",
                            billDetails: billDetails,
                            billId: undefined,
                        },
                    ]);
                }
            } else {
                setLeasePayments([]); // No active tenant found for the logged-in user
            }
        } catch (error) {
            console.error("Error fetching lease payments:", error);
            toast({
                title: "Error",
                description: "Unable to fetch payments",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeasePayments();
    }, [user]);

    const getStatusColor = (status: string | undefined) => {
        if (!status) return "bg-gray-100 text-gray-800";
        switch (status.toLowerCase()) {
            case "paid":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "overdue":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const submitProof = async () => {
        if (!proofLink.trim() || !selectedPayment) {
            toast({
                title: "Error",
                description: "Please provide a valid image link",
                variant: "destructive",
            });
            return;
        }

        try {
            if (selectedPayment.billId) {
                await axios.patch(
                    `http://localhost:5000/api/rent/${selectedPayment.billId}/proof`,
                    { proof_url: proofLink }
                );
            }
            toast({
                title: "Success",
                description: "Payment proof submitted successfully",
            });
            setProofModalVisible(false);
            setProofLink("");
            fetchLeasePayments();
        } catch (error) {
            console.error("Error submitting payment proof:", error);
            toast({
                title: "Error",
                description: "Failed to upload payment proof. Please try again.",
                variant: "destructive",
            });
        }
    };

    const renderSkeleton = () => <div>Loading...</div>;

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
                                                    <p className="text-sm text-gray-500">Room Number</p>
                                                    <p className="text-lg font-semibold">
                                                        {payment.roomNo.join(", ")}
                                                    </p>
                                                </div>
                                                <Badge className={getStatusColor(payment.paymentStatus)}>
                                                    {payment.paymentStatus}
                                                    {payment.penalty > 0 && (
                                                        <span className="ml-2 text-xs">
                                                            Penalty: {payment.penalty}
                                                        </span>
                                                    )}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-gray-500">Due Date</p>
                                                    <p className="text-base font-medium">
                                                        {payment.paymentDueDate}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">Rent Amount</p>
                                                    <p className="text-xl font-bold text-emerald-600">
                                                        {payment.price}
                                                    </p>
                                                    {payment.penalty > 0 && (
                                                        <p className="text-sm text-orange-500">
                                                            Penalty: {payment.penalty}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-gray-500">Total Due</p>
                                                    <p className="text-2xl font-bold text-emerald-600">
                                                        {payment.totalDue}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-4">
                                                <PaymentButton
                                                    type="lease"
                                                    billId={payment.billId}
                                                    amount={payment.totalDue}
                                                    disabled={payment.paymentStatus.toLowerCase() === "paid"}
                                                    billDetails={{
                                                        fullName: payment.fullName,
                                                        roomNo: payment.roomNo,
                                                        phone: user?.tenant?.phone,
                                                        tenantId: user.tenant?.tenant_id,
                                                    }}
                                                    tenantId={user.tenant?.tenant_id}
                                                    onSuccess={() => {
                                                        fetchLeasePayments();
                                                        toast({
                                                            title: "Success",
                                                            description: "Payment initiated successfully",
                                                        });
                                                    }}
                                                    onError={(error: any) => {
                                                        console.error("Payment error:", error);
                                                        toast({
                                                            title: "Error",
                                                            description: "Failed to process payment. Please try again.",
                                                            variant: "destructive",
                                                        });
                                                    }}
                                                />
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedPayment(payment);
                                                        setProofModalVisible(true);
                                                    }}
                                                    disabled={payment.paymentStatus.toLowerCase() === "paid"}
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
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                open={proofModalVisible}
                onClose={() => setProofModalVisible(false)}
                title="Submit Payment Proof"
            >
                <div className="p-6">
                    <Input
                        placeholder="Enter proof image link"
                        value={proofLink}
                        onChange={(e) => setProofLink(e.target.value)}
                    />
                    <div className="flex justify-end mt-4 gap-2">
                        <Button variant="ghost" onClick={() => setProofModalVisible(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitProof}>Submit</Button>
                    </div>
                </div>
            </Modal>
        </TabsContent>
    );
};

export default LeasePayments;