import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Zap, UploadCloud, CheckCircle, XCircle } from "lucide-react"; // Added icons
import { motion } from "framer-motion";
import UtilityPayment from "../../pages/payment/UtilityPayment"; // Assuming this is the online payment component
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button"; // Assuming you have a button component
import { Input } from "@/components/ui/input"; // Assuming you have an input component
import { Label } from "@/components/ui/label"; // Assuming you have a label component
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // Assuming you have AlertDialog

// Assuming the AuthContext user structure aligns with this
interface AuthUserTenant {
  tenant_id: string; // Changed from number to string
  room?: string;
  email?: string;
  phone?: string;
}

interface AuthUser {
  tenant?: AuthUserTenant;
  // other user properties
}

interface UtilityRecord {
  id: string; // Usage ID
  bill_date: string;
  due_date: string;
  cost: number;
  penalty: number;
  utility_status: string;
  payment_proof_link?: string; // Now stores file path
  current_reading: number;
  previous_reading?: number;
  tenant_id: string; // Changed from number to string
  utility_type: string;
  createdAt: string;
  updatedAt: string;
  usage: string; // Consider renaming 'usage' as it's confusing with UtilityRecord name
}

interface TenantData {
  id: number; // This ID might still be a number for the tenant record itself
  tenant_id: string; // Changed from number to string - This is the unique string identifier
  full_name: string;
  roomName: string;
  phone: string;
  utility_usage?: {
    electricity?: UtilityRecord;
    water?: UtilityRecord;
    generator?: UtilityRecord;
    [key: string]: UtilityRecord | undefined;
  };
}

const Utility: React.FC = () => {
  const { user } = useAuth() as { user: AuthUser | null };
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // State to track loading for specific utility uploads
  const [uploadingBillId, setUploadingBillId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentBillToUpload, setCurrentBillToUpload] = useState<UtilityRecord | null>(null);


  const fetchTenantData = async (): Promise<void> => {
    if (!user?.tenant?.tenant_id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch tenant data by the string tenant_id
      // Assuming your backend API /api/tenants can filter by tenant_id string
      // NOTE: Your backend route `/api/tenants` currently does not filter by tenant_id.
      // You might need to modify that backend controller (`getTenants`)
      // to accept a tenant_id query parameter and filter the results.
      // For now, this frontend assumes it *can* filter.
      const tenantsRes = await axios.get<TenantData[]>(
        `${import.meta.env.VITE_API_BASE_URL}/api/tenants`,
        {
          params: { tenant_id: user.tenant.tenant_id }, // Pass tenant_id as query param
        }
      );

      // Fetch utility data for the specific tenant
      // Modify your backend /api/utilities/tenant_utility_usage to accept tenant_id query param
      // and filter usage records by that tenant_id.
      const usageRes = await axios.get<UtilityRecord[]>(
        `${import.meta.env.VITE_API_BASE_URL}/api/utilities/tenant_utility_usage`,
        {
          params: { tenant_id: user.tenant.tenant_id }, // Pass tenant_id as query param
        }
      );

      if (tenantsRes.data && tenantsRes.data.length > 0) {
        const tenant = tenantsRes.data[0];
        const usages = usageRes.data; // Assuming usageRes.data is already filtered by tenant_id
        const utilityRecords: { [key: string]: UtilityRecord } = {};
        usages.forEach((u) => {
          utilityRecords[u.utility_type] = u;
        });

        setTenantData({ ...tenant, utility_usage: utilityRecords });
      } else {
        setTenantData(null);
      }
    } catch (error) {
      console.error("Error fetching tenant data:", error);
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Approved":
        return "bg-green-200 text-green-800";
      case "Bill Generated":
        return "bg-yellow-200 text-yellow-800";
      case "Submitted":
        return "bg-blue-200 text-blue-800";
      case "Overdue":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Basic file type validation (optional)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (JPEG, PNG, GIF).",
          variant: "destructive",
        });
        setSelectedFile(null);
        // Clear the file input if needed
        event.target.value = '';
        return;
      }
      setSelectedFile(file);
      setDialogOpen(true); // Open confirmation dialog
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !currentBillToUpload || !user?.tenant?.tenant_id) {
      toast({
        title: "Error",
        description: "No file selected or tenant data missing.",
        variant: "destructive",
      });
      return;
    }

    setUploadingBillId(currentBillToUpload.id);

    const formData = new FormData();
    formData.append('tenant_id', user.tenant.tenant_id);
    formData.append('payment_proof', selectedFile); // 'payment_proof' must match the name in backend Multer config

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/utilities/confirm`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "Upload Successful",
          description: "Payment proof submitted successfully. Status is now 'Submitted'.",
        });
        // Refresh data to show updated status
        fetchTenantData();
      } else {
        toast({
          title: "Upload Failed",
          description: response.data?.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload payment proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingBillId(null);
      setSelectedFile(null); // Clear selected file after upload attempt
      setDialogOpen(false); // Close dialog
      setCurrentBillToUpload(null); // Clear current bill context
    }
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
              {Object.entries(tenantData.utility_usage).map(([utilityType, usage]) => usage && (
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
                      <Badge className={getStatusColor(usage.utility_status)}>
                        {usage.utility_status || "N/A"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">Billing Date</p>
                        <p className="text-lg font-semibold">
                          {dayjs(usage.bill_date).isValid()
                            ? dayjs(usage.bill_date).format("YYYY-MM-DD")
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Due Date</p>
                        <p className="text-lg font-semibold">
                          {dayjs(usage.due_date).isValid()
                            ? dayjs(usage.due_date).format("YYYY-MM-DD")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Previous Reading</p>
                        <p className="text-base font-medium">
                          {usage.previous_reading !== undefined ? usage.previous_reading : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Reading</p>
                        <p className="text-base font-medium">
                          {usage.current_reading}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount Due</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {usage.cost !== undefined ? formatCurrency(usage.cost) : "N/A"}
                      </p>
                    </div>

                    {/* --- Payment and Upload Section --- */}
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-2 mt-4">
                      {/* Online Payment Button (UtilityPayment component) */}
                      {usage.cost !== undefined && ( // Only show if cost is defined
                        <UtilityPayment
                          type={utilityType.toLowerCase()}
                          billId={usage.id}
                          amount={usage.cost}
                          // Disable online payment if already submitted or approved
                          disabled={usage.utility_status === "Approved" || usage.utility_status === "Submitted"}
                          billDetails={{
                            fullName: tenantData.full_name || "",
                            email: user?.tenant?.email || "",
                            roomNo: tenantData.roomName || "",
                            tenantId: tenantData.tenant_id,
                            phone: user?.tenant?.phone || "",
                          }}
                          onSuccess={() => {
                            // Assuming UtilityPayment component handles its own status updates or calls an API
                            // If it *doesn't* update status to 'Submitted'/'Approved' itself, you might need to do it here
                            // or rely on a polling mechanism.
                            // For manual upload, we definitely refetch data on success.
                            fetchTenantData(); // Refresh data just in case or if online payment updates status
                            toast({
                              title: "Success",
                              description: "Online payment process initiated.",
                            });
                          }}
                          onError={(error) => {
                            console.error("Online Payment error:", error);
                            toast({
                              title: "Error",
                              description: "Failed to process online payment. Please try again.",
                              variant: "destructive",
                            });
                          }}
                        />
                      )}

                      {/* Upload Receipt Button/Input */}
                      {usage.utility_status === "Bill Generated" && (
                        <>
                          {/* Use a Label linked to the hidden file input */}
                          <Label htmlFor={`upload-receipt-${usage.id}`} className="cursor-pointer">
                            <Button
                              asChild // Render as child of Label
                              variant="outline"
                              disabled={uploadingBillId === usage.id} // Disable if currently uploading for this bill
                            >
                              <span className="flex items-center gap-1">
                                {uploadingBillId === usage.id ? 'Uploading...' : (
                                  <>
                                    <UploadCloud className="h-4 w-4" /> Upload Receipt
                                  </>
                                )}
                              </span>
                            </Button>
                          </Label>
                          {/* Hidden file input */}
                          <Input
                            id={`upload-receipt-${usage.id}`}
                            type="file"
                            className="hidden"
                            accept="image/*" // Restrict to image files
                            onChange={(e) => {
                              setCurrentBillToUpload(usage); // Set context for the dialog
                              handleFileChange(e);
                            }}
                          />
                        </>
                      )}

                      {/* Display payment proof link if available */}
                      {usage.payment_proof_link && (
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL}/${usage.payment_proof_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" /> View Receipt
                        </a>
                      )}

                      {/* Display info if payment proof is submitted/approved */}
                      {usage.utility_status !== "Bill Generated" && !usage.payment_proof_link && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          {usage.utility_status === "Submitted" && <UploadCloud className="h-4 w-4" />}
                          {usage.utility_status === "Approved" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          Payment {usage.utility_status}
                        </span>
                      )}

                    </div>
                    {/* --- End Payment and Upload Section --- */}

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

      {/* Confirmation Dialog for Upload */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Upload</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to upload this file as payment proof for the {currentBillToUpload?.utility_type.toUpperCase()} bill?
              <br />
              File: <strong>{selectedFile?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedFile(null); // Clear selected file on cancel
                setCurrentBillToUpload(null); // Clear bill context
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFileUpload} disabled={!selectedFile || uploadingBillId !== null}>
              {uploadingBillId !== null ? 'Uploading...' : 'Upload'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default Utility;