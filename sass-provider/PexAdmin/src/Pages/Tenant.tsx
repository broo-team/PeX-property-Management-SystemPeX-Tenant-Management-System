import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../Pages/Navbar"; // Assuming these paths are correct
import Sidebar from "../Pages/Sidebar"; // Assuming these paths are correct
import axiosInstance from "../services/authService"; // Assuming this is correctly configured
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Assuming shadcn/ui paths
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Assuming shadcn/ui paths
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui paths
import { Input } from "@/components/ui/input"; // Assuming shadcn/ui paths
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming shadcn/ui paths
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react"; // Assuming lucide-react is installed
import { Toaster } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog"; // Assuming shadcn/ui paths

// Define the interface to match the provided tenant JSON structure
interface Tenant {
  id: number;
  tenant_id: string;
  full_name: string;
  sex: string | null;
  phone: string | null;
  city: string | null;
  subcity: string | null;
  woreda: string | null;
  house_no: string | null;
  price: string | null; // Rent price
  payment_term: string | null;
  deposit: string | null;
  lease_start: string | null;
  lease_end: string | null;
  registered_by_agent: 0 | 1;
  authentication_no: string | null; // Assuming related to agent
  agent_first_name: string | null;
  agent_sex: string | null;
  agent_phone: string | null;
  agent_city: string | null;
  agent_subcity: string | null;
  agent_woreda: string | null;
  agent_house_no: string | null;
  eeu_payment: 0 | 1; // 1 if included in rent, 0 if separate
  generator_payment: 0 | 1; // 1 if included in rent, 0 if separate
  water_payment: 0 | 1; // 1 if included in rent, 0 if separate
  terminated: 0 | 1; // 0 for active, 1 for terminated
  building_id: number;
  created_at: string;
  rent_start_date: string | null; // Assuming actual rent start
  rent_end_date: string | null; // Assuming actual rent end (might differ from lease end)
  password?: string; // Included in JSON, but might not be used or displayed in UI
  roomName: string | null; // The name/number of the room
  monthlyRent: string | null; // Monthly rent amount
}

// Helper function to map 'terminated' status to display string
const getTenantStatus = (terminated: 0 | 1): "Active" | "Terminated" => {
  return terminated === 0 ? "Active" : "Terminated";
};

// Helper function for date formatting
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    console.error("Invalid date string:", dateString, error);
    return "Invalid Date";
  }
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'; // Adjust if your API runs on 5000

const Tenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState("");
  // Filter by termination status
  const [statusFilter, setStatusFilter] = useState<string>("all"); // 'all', 'Active', 'Terminated'
  const itemsPerPage = 10; // More items per page for tenants? Adjust as needed

  const [deleteTenantId, setDeleteTenantId] = useState<number | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const loadingToast = toast.loading("Fetching tenants...");
      const response = await axiosInstance.get(
        "/api/tenants" // Assuming this is the correct endpoint
      );

      console.log("Tenants API Response:", response.data); // Debug log

      // Assuming the response is an array of tenant objects directly
      if (Array.isArray(response.data)) {
        setTenants(response.data);
        toast.success("Tenants loaded successfully", {
          id: loadingToast,
        });
      } else {
        console.error("Invalid response format:", response.data);
        toast.error("Failed to load tenants", {
          id: loadingToast,
          description: "Invalid data format received from the API.",
        });
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to fetch tenants", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const toggleRow = (tenantId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tenantId)) {
        newSet.delete(tenantId);
      } else {
        newSet.add(tenantId);
      }
      return newSet;
    });
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        tenant.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        tenant.tenant_id?.toLowerCase().includes(search.toLowerCase()) ||
        tenant.phone?.toLowerCase().includes(search.toLowerCase()) ||
        tenant.city?.toLowerCase().includes(search.toLowerCase()) ||
        tenant.roomName?.toLowerCase().includes(search.toLowerCase()) ||
        tenant.id?.toString().includes(search.toLowerCase()); // Search by ID

      const tenantStatus = getTenantStatus(tenant.terminated);
      const matchesStatus =
        statusFilter === "all" || tenantStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tenants, search, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTenants.slice(start, end);
  }, [filteredTenants, currentPage]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCurrentPage(0);
    toast.success("Filters reset", {
      description: "All filters have been cleared",
    });
  };

  // Note: This function assumes the backend endpoint is /api/tenants/{id} for DELETE
  const handleDeleteTenant = async (tenantId: number) => {
    const loadingToast = toast.loading("Deleting tenant...");
    try {
      const response = await axiosInstance.delete(
        `/api/tenants/${tenantId}` // Assuming DELETE endpoint is /api/tenants/{id}
      );

      if (response.data.error === false) { // Assuming a similar error structure as property deletion
        setTenants((prevTenants) =>
          prevTenants.filter((tenant) => tenant.id !== tenantId)
        );

        toast.success("Tenant deleted successfully", {
          id: loadingToast,
        });
        setDeleteTenantId(null);
      } else {
        toast.error("Failed to delete tenant", {
          id: loadingToast,
          description: response.data.message || "An error occurred.",
        });
      }
    } catch (error: any) {
      console.error("Error deleting tenant:", error);
      toast.error("Failed to delete tenant", {
        id: loadingToast,
        description:
          error.response?.data?.message || "An unexpected error occurred",
      });
    }
  };

  // Adjusted StatusBadge for tenant status
  const StatusBadge = ({
    status,
  }: {
    status: "Active" | "Terminated";
  }) => {
    const statusConfig = {
      Active: {
        bg: "bg-green-100",
        text: "text-green-800",
        dot: "bg-green-400",
      },
      Terminated: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-400" },
    };

    const config = statusConfig[status];

    return (
      <span
        className={`
          px-3 py-1 rounded-full text-sm inline-flex items-center
          ${config.bg} ${config.text}
        `}
      >
        <span
          className={`
            w-2 h-2 rounded-full mr-2
            ${config.dot}
          `}
        ></span>
        {status}
      </span>
    );
  };


  // Render expanded details for a tenant
  const renderExpandedDetails = (tenant: Tenant) => {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="space-y-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Personal Details</h4>
            <p><span className="font-medium">Tenant ID:</span> {tenant.tenant_id}</p>
            <p><span className="font-medium">Sex:</span> {tenant.sex || 'N/A'}</p>
            <p><span className="font-medium">Phone:</span> {tenant.phone || 'N/A'}</p>
             <p><span className="font-medium">Registered At:</span> {formatDate(tenant.created_at)}</p>
             {tenant.password && (
                <p><span className="font-medium text-orange-500">Password:</span> {tenant.password} <span className="text-xs text-gray-500">(Use with caution)</span></p>
             )}
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Location Details</h4>
            <p><span className="font-medium">City:</span> {tenant.city || 'N/A'}</p>
            <p><span className="font-medium">Subcity:</span> {tenant.subcity || 'N/A'}</p>
            <p><span className="font-medium">Woreda:</span> {tenant.woreda || 'N/A'}</p>
            <p><span className="font-medium">House No:</span> {tenant.house_no || 'N/A'}</p>
             <p><span className="font-medium">Building ID:</span> {tenant.building_id}</p>
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Lease & Rent Details</h4>
            <p><span className="font-medium">Monthly Rent:</span> {tenant.monthlyRent || tenant.price || 'N/A'}</p> {/* Use monthlyRent first, fallback to price */}
            <p><span className="font-medium">Payment Term (Days):</span> {tenant.payment_term || 'N/A'}</p>
            <p><span className="font-medium">Deposit:</span> {tenant.deposit || 'N/A'}</p>
            <p><span className="font-medium">Lease Start:</span> {formatDate(tenant.lease_start)}</p>
            <p><span className="font-medium">Lease End:</span> {formatDate(tenant.lease_end)}</p>
             <p><span className="font-medium">Rent Start Date:</span> {formatDate(tenant.rent_start_date)}</p>
             <p><span className="font-medium">Rent End Date:</span> {formatDate(tenant.rent_end_date)}</p>
          </div>

          <div className="space-y-1">
             <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Utility Payments Included</h4>
             <p>
               <span className="font-medium">EEU Payment:</span>{" "}
               {tenant.eeu_payment === 1 ? <span className="text-green-600">Included</span> : <span className="text-red-600">Separate</span>}
             </p>
              <p>
               <span className="font-medium">Generator Payment:</span>{" "}
               {tenant.generator_payment === 1 ? <span className="text-green-600">Included</span> : <span className="text-red-600">Separate</span>}
             </p>
              <p>
               <span className="font-medium">Water Payment:</span>{" "}
               {tenant.water_payment === 1 ? <span className="text-green-600">Included</span> : <span className="text-red-600">Separate</span>}
             </p>
          </div>


          {tenant.registered_by_agent === 1 && (
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Agent Details</h4>
              <p><span className="font-medium">Registered by Agent:</span> Yes</p>
              <p><span className="font-medium">Agent Name:</span> {tenant.agent_first_name || 'N/A'}</p>
              <p><span className="font-medium">Agent Sex:</span> {tenant.agent_sex || 'N/A'}</p>
              <p><span className="font-medium">Agent Phone:</span> {tenant.agent_phone || 'N/A'}</p>
              <p><span className="font-medium">Agent City:</span> {tenant.agent_city || 'N/A'}</p>
               <p><span className="font-medium">Agent Location:</span> {tenant.agent_subcity || 'N/A'}, {tenant.agent_woreda || 'N/A'}, {tenant.agent_house_no || 'N/A'}</p>
               <p><span className="font-medium">Authentication No:</span> {tenant.authentication_no || 'N/A'}</p>
            </div>
          )}

           <div className="space-y-1 col-span-full flex gap-2 mt-4">
              {/* Delete Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row collapsing
                  setDeleteTenantId(tenant.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Tenant
              </Button>
              {/* Add other actions like Edit Tenant if needed */}
            </div>

        </div>
      </div>
    );
  };


  const handleRegistrationModal = () => {
    setIsRegistrationOpen(!isRegistrationOpen);
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Tenants
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    {tenants.length} Total Tenants
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                   {/* Button to open registration modal */}
                   <Button onClick={handleRegistrationModal}>
                     <Plus className="h-4 w-4 mr-2" />
                     Add Tenant
                   </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search tenants by name, ID, room, phone, city..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* Status filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
                 {/* Add other filters here if needed (e.g., by building_id) */}
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"> {/* Added overflow-hidden */}
                {paginatedData.length === 0 && !isLoading ? (
                   <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                     No tenants found matching the criteria.
                   </div>
                 ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Phone</TableHead>
                         <TableHead>Location</TableHead>
                         <TableHead>Lease Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead> {/* For expand icon */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((tenant) => (
                        <React.Fragment key={tenant.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => toggleRow(tenant.id)}
                          >
                            <TableCell>{tenant.tenant_id}</TableCell>
                            <TableCell>{tenant.full_name}</TableCell>
                            <TableCell>{tenant.roomName || 'N/A'}</TableCell>
                            <TableCell>{tenant.phone || 'N/A'}</TableCell>
                             <TableCell>{tenant.city || 'N/A'}</TableCell>
                             <TableCell>
                               <div className="flex flex-col">
                                 <span className="font-medium">Start: {formatDate(tenant.lease_start)}</span>
                                  <span className="text-sm text-gray-500">End: {formatDate(tenant.lease_end)}</span>
                               </div>
                             </TableCell>
                            <TableCell>
                              <StatusBadge status={getTenantStatus(tenant.terminated)} />
                            </TableCell>
                            <TableCell>
                              {expandedRows.has(tenant.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedRows.has(tenant.id) && (
                            <TableRow>
                              <TableCell colSpan={8} className="p-0"> {/* Adjusted colspan */}
                                {renderExpandedDetails(tenant)}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                 )}


                {/* Pagination */}
                 {filteredTenants.length > itemsPerPage && ( // Only show pagination if needed
                   <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                     <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                       Showing {currentPage * itemsPerPage + 1} to{" "}
                       {Math.min(
                         (currentPage + 1) * itemsPerPage,
                         filteredTenants.length
                       )}{" "}
                       of {filteredTenants.length} results
                     </div>
                     <div className="flex gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() =>
                           setCurrentPage((prev) => Math.max(0, prev - 1))
                         }
                         disabled={currentPage === 0}
                       >
                         Previous
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() =>
                           setCurrentPage((prev) =>
                             Math.min(
                               Math.ceil(filteredTenants.length / itemsPerPage) -
                                 1,
                               prev + 1
                             )
                           )
                         }
                         disabled={
                           currentPage >=
                           Math.ceil(filteredTenants.length / itemsPerPage) - 1
                         }
                       >
                         Next
                       </Button>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Tenant Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTenantId}
        onOpenChange={() => setDeleteTenantId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tenant? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTenantId !== null) {
                  handleDeleteTenant(deleteTenantId);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {/* Add Tenant Modal (Placeholder) */}
       <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
         <DialogContent className="max-w-2xl">
            <div className="p-4 text-center">
              <h3 className="text-lg font-semibold mb-4">Tenant Registration Form (Placeholder)</h3>
              <p className="text-gray-600 mb-4">
                Implement your Tenant registration form component here.
                It should handle input fields for relevant tenant details
                and make an API call to create a new tenant.
              </p>
               <Button onClick={() => setIsRegistrationOpen(false)}>Close</Button>
               {/* You would typically put your TenantRegistrationForm component here */}
               {/* <TenantRegistrationForm onSuccess={fetchTenants} onCancel={() => setIsRegistrationOpen(false)} /> */}
            </div>
         </DialogContent>
       </Dialog>

      <Toaster position="bottom-right" />
    </div>
  );
};

export default Tenants;