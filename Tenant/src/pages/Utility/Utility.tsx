import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import UtilityPayment from "../../pages/payment/UtilityPayment";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import dayjs from "dayjs";

interface UtilityRecord {
  id: string;
  bill_date: string;
  due_date: string;
  cost: number;
  penalty: number;
  utility_status: string;
  payment_proof_link?: string;
  current_reading: number;
  previous_reading?: number;
  tenant_id: number;
  utility_type: string;
  createdAt: string;
  updatedAt: string;
  usage:string;
}

interface TenantData {
  id: number;
  tenant_id: number;
  full_name: string;
  roomName: string;
  utility_usage?: {
    electricity?: UtilityRecord;
    water?: UtilityRecord;
    generator?: UtilityRecord;
    [key: string]: UtilityRecord | undefined;
  };
}

const Utility: React.FC = () => {
  const { user } = useAuth();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTenantData = async () => {
    if (!user?.tenant?.tenant_id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch tenant data
      const tenantsRes = await axios.get<TenantData[]>(
        `${import.meta.env.VITE_API_BASE_URL}/api/tenants`,
        {
          params: {
            tenant_id: user.tenant.tenant_id,
          },
        }
      );

      // Fetch utility usage data
      const usageRes = await axios.get<UtilityRecord[]>(
        `${import.meta.env.VITE_API_BASE_URL}/api/utilities/tenant_utility_usage`
      );

      if (tenantsRes.data && tenantsRes.data.length > 0) {
        const tenant = tenantsRes.data[0];

        // Merge utility usage data
        const usages = usageRes.data.filter(
          (u) => Number(u.tenant_id) === Number(tenant.tenant_id)
        );
        const utilityRecords = {};
        usages.forEach((u) => {
          utilityRecords[u.utility_type] = u;
        });

        setTenantData({
          ...tenant,
          utility_usage: utilityRecords,
        });
      } else {
        setTenantData(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tenant data",
        variant: "destructive",
      });
      setTenantData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.tenant?.tenant_id) {
      fetchTenantData();
    }
  }, [user?.tenant?.tenant_id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-200 text-green-800";
      case "Bill Generated":
        return "bg-yellow-200 text-yellow-800";
      case "Submitted":
        return "bg-blue-200 text-blue-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD", // Adjust to your currency
    }).format(amount);
  };

  const renderSkeleton = () => (
    <div className="text-center py-10 text-gray-500">Loading...</div>
  );

  return (
    <Card className="bg-white shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-emerald-600">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Utility Bills
          </CardTitle>
        </div>
        <CardDescription className="text-emerald-50">
          {user?.tenant?.room ? `Room: ${user.tenant.room}` : "Manage your utility payments"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          renderSkeleton()
        ) : tenantData?.utility_usage && Object.keys(tenantData.utility_usage).length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {Object.entries(tenantData.utility_usage).map(([utilityType, usage]) => (
                <motion.div
                  key={utilityType}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-emerald-100 p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">Utility Type</p>
                        <p className="text-lg font-semibold">{utilityType.toUpperCase()}</p>
                      </div>
                      <Badge className={getStatusColor(usage?.utility_status || "")}>
                        {usage?.utility_status || "N/A"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">Billing Date</p>
                        <p className="text-lg font-semibold">
      {dayjs(usage?.bill_date).isValid() ? dayjs(usage.bill_date).format("YYYY-MM-DD") : 'N/A'}
    </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Due Date</p>
                        <p className="text-lg font-semibold">
      {dayjs(usage?.due_date).isValid() ? dayjs(usage.due_date).format("YYYY-MM-DD") : 'N/A'}
    </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Previous Reading</p>
                        <p className="text-base font-medium">
                          {usage?.previous_reading !== undefined ? usage.previous_reading : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Reading</p>
                        <p className="text-base font-medium">
                          {usage?.current_reading}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount Due</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {usage?.cost !== undefined ? formatCurrency(usage.cost) : 'N/A'}
                      </p>
                    </div>
                    <div className="flex justify-end mt-4">
                      {usage?.cost !== undefined && (
                        <UtilityPayment
                          type={utilityType.toLowerCase()}
                          billId={usage.id}
                          amount={usage.cost}
                          disabled={usage.utility_status === "Approved" || usage.utility_status === "Submitted"}
                          billDetails={{
                            fullName: tenantData?.full_name || "",
                            email: user?.tenant?.email || "",
                            roomNo: tenantData?.roomName || "",
                            tenantId: tenantData?.tenant_id
                          }}
                          onSuccess={() => {
                            fetchTenantData(); // Refresh data after payment
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
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-10">
            <Zap className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No utility bills found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Utility;