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

export interface LeasePayment {
  _id: string;
  roomNo: string[];
  paymentStatus: string;
  paymentDueDate: string;
  price: number;
  fullName: string;
}

const hardcodedLeasePayments: LeasePayment[] = [
  {
    _id: "1",
    roomNo: ["101"],
    paymentStatus: "Pending",
    paymentDueDate: "2024-04-10",
    price: 1200,
    fullName: "John Doe",
  },
  {
    _id: "2",
    roomNo: ["102", "103"],
    paymentStatus: "Paid",
    paymentDueDate: "2024-04-15",
    price: 1500,
    fullName: "Jane Smith",
  },
  {
    _id: "3",
    roomNo: ["104"],
    paymentStatus: "Overdue",
    paymentDueDate: "2024-03-25",
    price: 1000,
    fullName: "Alice Johnson",
  },
];

const LeasePayments: React.FC = () => {
  // Internal state for payments and loading indicator.
  const [leasePayments, setLeasePayments] = useState<LeasePayment[]>(hardcodedLeasePayments);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // For demonstration purposes, userData is hardcoded.
  const userData = { email: "alice@example.com" };

  // Local function to fetch lease payments.
  // In a real scenario, replace the simulated delay with an actual API call.
  const fetchLeasePayments = async () => {
    setIsLoading(true);
    try {
      // Simulate an API call with a 500ms delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Update state with the updated list; here we're reusing the hardcoded data.
      setLeasePayments(hardcodedLeasePayments);
    } catch (error) {
      console.error("Error fetching lease payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Optionally fetch lease payments when the component mounts.
  useEffect(() => {
    fetchLeasePayments();
  }, []);

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p className="text-base font-medium">
                            {formatDate(payment.paymentDueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(payment.price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <PaymentButton
                          type="lease"
                          billId={payment._id}
                          amount={payment.price}
                          disabled={payment.paymentStatus === "Paid"}
                          billDetails={{
                            fullName: payment.fullName,
                            email: userData?.email,
                            roomNo: payment.roomNo,
                          }}
                          onSuccess={() => {
                            // Call the local fetchLeasePayments function on success.
                            fetchLeasePayments();
                            toast({
                              title: "Success",
                              description: "Payment initiated successfully",
                            });
                          }}
                          onError={(error) => {
                            console.error("Payment error:", error);
                            toast({
                              title: "Error",
                              description:
                                "Failed to process payment. Please try again.",
                              variant: "destructive",
                            });
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-10">
              <DollarSign className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No lease payments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default LeasePayments;
