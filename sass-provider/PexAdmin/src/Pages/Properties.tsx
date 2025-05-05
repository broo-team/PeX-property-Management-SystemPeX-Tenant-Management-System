// src/Pages/Properties.tsx
import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../Pages/Navbar"; // Adjust path as needed
import Sidebar from "../Pages/Sidebar"; // Adjust path as needed
import axiosInstance from "../services/authService";
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
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // <-- Import Textarea for the reason
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Check,
  CalendarIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "sonner";
import BuildingRegistrationForm from "../Modal/BuildingRegistrationForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Updated Building Interface
interface Building {
  id: number;
  building_name: string;
  building_image: string; // This is the path from the backend (e.g., 'uploads/buildings/...')
  building_address: string;
  location: string;
  property_type: string;
  owner_email: string;
  owner_phone: string;
  owner_address: string;
  suspended: 0 | 1;
  suspension_reason: string | null; // <-- Added suspension_reason
  created_at: string;
  status: 'pending' | 'active' | 'expired';
  start_date: string | null;
  end_date: string | null;
  // owner_password: string; // You might fetch this if needed, but usually not
}

// Helper to display the derived status
const getDisplayStatus = (building: Building): "Active" | "Suspended" | "Pending" | "Expired" => {
  if (building.suspended === 1) return "Suspended";
  switch (building.status) {
    case 'active':
      // Add date check here if 'active' should become 'expired' automatically client-side
      // based on current date vs end_date.
      // For example: if (building.end_date && new Date(building.end_date) < new Date()) return "Expired";
      return "Active";
    case 'expired':
      return "Expired";
    case 'pending':
    default:
      return "Pending";
  }
};

// Helper to determine Status Badge appearance
const getStatusBadgeConfig = (status: ReturnType<typeof getDisplayStatus>) => {
  switch (status) {
    case "Active":
      return { bg: "bg-green-100 dark:bg-green-900", text: "text-green-800 dark:text-green-300", dot: "bg-green-400 dark:bg-green-600" };
    case "Suspended":
      return { bg: "bg-red-100 dark:bg-red-900", text: "text-red-800 dark:text-red-300", dot: "bg-red-400 dark:bg-red-600" };
    case "Pending":
      return { bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-800 dark:text-yellow-300", dot: "bg-yellow-400 dark:bg-yellow-600" };
    case "Expired":
      return { bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-800 dark:text-orange-300", dot: "bg-orange-400 dark:bg-orange-600" };
    default:
      return { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-800 dark:text-gray-300", dot: "bg-gray-400 dark:bg-gray-600" };
  }
};

// Define your backend API URL
// IMPORTANT: Ensure this matches the port your backend is running on (was 5000 in app.js)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Properties = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const itemsPerPage = 5;
  // State to control the Reset Password AlertDialog
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
  // State to indicate which building is currently undergoing a status update (for loading spinners)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  // State for Activation Modal
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [buildingToActivate, setBuildingToActivate] = useState<Building | null>(null);
  const [activationStartDate, setActivationStartDate] = useState<Date | undefined>(undefined);
  const [activationEndDate, setActivationEndDate] = useState<Date | undefined>(undefined);
  const [isActivating, setIsActivating] = useState(false);
  // State for Suspension Modal
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [buildingToSuspend, setBuildingToSuspend] = useState<Building | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);

  const fetchProperties = async () => {
    setIsLoading(true);
     // Use a persistent toast ID for updating
    const loadingToastId = toast.loading("Fetching properties...");
    try {
      // Ensure your backend returns status, start_date, end_date, suspended, AND suspension_reason
      const response = await axiosInstance.get("/api/buildings");
      console.log("API Response:", response.data);

      if (response.data?.buildings && Array.isArray(response.data.buildings)) {
        const fetchedBuildings: Building[] = response.data.buildings.map((b: any) => ({
          id: b.id,
          building_name: b.building_name,
          building_image: b.building_image, // This path comes from the DB (e.g., 'uploads/buildings/...')
          building_address: b.building_address,
          location: b.location,
          property_type: b.property_type,
          owner_email: b.owner_email,
          owner_phone: b.owner_phone,
          owner_address: b.owner_address,
          suspended: b.suspended === 1 ? 1 : 0,
          suspension_reason: b.suspension_reason, // <-- Include the new field
          created_at: b.created_at,
          status: b.status as 'pending' | 'active' | 'expired',
          start_date: b.start_date,
          end_date: b.end_date,
        }));
        setBuildings(fetchedBuildings);
        toast.success("Properties loaded successfully", {
          id: loadingToastId,
          duration: 3000 // Keep success toast visible for a bit
        });
      } else {
        console.error("Invalid response format:", response.data);
        toast.error("Failed to load properties", {
          id: loadingToastId,
          description: "Invalid data format received from the API.",
        });
      }
    } catch (error) {
      console.error("Error fetching buildings:", error);
      toast.error("Failed to fetch properties", {
        id: loadingToastId,
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const toggleRow = (buildingId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(buildingId)) {
        newSet.delete(buildingId);
      } else {
        newSet.add(buildingId);
      }
      return newSet;
    });
  };

  const filteredBuildings = useMemo(() => {
    return buildings.filter((building) => {
       // Convert potentially null fields to empty string for includes() check
      const buildingName = building.building_name || '';
      const location = building.location || '';
      const ownerEmail = building.owner_email || '';
      const ownerPhone = building.owner_phone || '';

      const lowerSearch = search.toLowerCase();

      const matchesSearch =
        buildingName.toLowerCase().includes(lowerSearch) ||
        building.id?.toString().includes(lowerSearch) || // Ensure ID is treated as string for search
        location.toLowerCase().includes(lowerSearch) ||
        ownerEmail.toLowerCase().includes(lowerSearch) ||
        ownerPhone.toLowerCase().includes(lowerSearch);


      const displayStatus = getDisplayStatus(building);
      const matchesStatus =
        statusFilter === "all" || displayStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [buildings, search, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredBuildings.slice(start, end);
  }, [filteredBuildings, currentPage, itemsPerPage]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCurrentPage(0);
    toast.success("Filters reset", {
      description: "All filters have been cleared",
    });
  };

  // --- Updated handleResetPassword Function ---
  const handleResetPassword = async (buildingId: number) => {
    console.log(`Attempting to reset password for building ID: ${buildingId}`);
    setUpdatingStatus(buildingId); // Indicate update for this building
    const loadingToastId = toast.loading("Attempting to reset password...");
    try {
      // Call the backend endpoint for password reset
      // We are using POST here to match the route defined in routes/buildings.js
      const response = await axiosInstance.post(
        `/api/buildings/${buildingId}/reset-password`
        // No request body is needed for this specific reset action as default is hardcoded
      );
      if (response.status === 200) {
        toast.success("Password reset successful", {
          id: loadingToastId,
          description: response.data?.message || "Owner password has been reset to the default.",
        });
        // No need to update local state as password isn't displayed or stored here
        setResetPasswordId(null); // Close the AlertDialog
      } else {
         // This block might be hit if the backend returns a non-200 status but not an error
         // Based on the backend code, errors will likely throw, but adding this for robustness
        toast.error("Failed to reset password", {
          id: loadingToastId,
          description: response.data?.message || "An unexpected issue occurred.",
        });
      }

    } catch (error: any) {
      console.error("Error resetting password:", error.response?.data || error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "An unexpected error occurred", {
        id: loadingToastId,
      });
    } finally {
       setUpdatingStatus(null); // Clear updating status
    }
  };
  // --- End Updated handleResetPassword Function ---


  // Function to open the suspension modal
  const handleOpenSuspensionModal = (building: Building) => {
      setBuildingToSuspend(building);
      setSuspensionReason(''); // Clear reason when opening
      setIsSuspensionModalOpen(true);
  };

  // Function to handle confirming suspension from the modal
  const handleConfirmSuspend = async () => {
    if (!buildingToSuspend) return;
    // Optional: Basic validation for reason length if mandatory
    // if (!suspensionReason.trim()) {
    //     toast.error("Suspension reason cannot be empty.");
    //     return;
    // }

    setIsSuspending(true);
    setUpdatingStatus(buildingToSuspend.id); // Indicate update for this building
    const loadingToastId = toast.loading(`Suspending building ${buildingToSuspend.building_name}...`);
    try {
      // Call the backend suspend endpoint with the reason
      const response = await axiosInstance.put(
        `/api/buildings/suspend/${buildingToSuspend.id}`,
        { suspension_reason: suspensionReason } // <-- Send the reason in the body
      );
      console.log("Suspend response:", response.data);

      if (response.status === 200) {
        // Update the building in the state with suspended=1 and the reason
        setBuildings((prevBuildings) =>
          prevBuildings.map((building) =>
            building.id === buildingToSuspend.id
              ? { ...building, suspended: 1 as 0 | 1, suspension_reason: suspensionReason }
              : building
          )
        );
        toast.success("Property suspended successfully", { id: loadingToastId });
        setIsSuspensionModalOpen(false); // Close modal
        setBuildingToSuspend(null); // Clear selected building
      } else {
        toast.error(response.data?.message || "Failed to suspend property", { id: loadingToastId });
      }
    } catch (error: any) {
      console.error("Error suspending building:", error.response?.data || error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "An unexpected error occurred", {
        id: loadingToastId,
      });
    } finally {
      setIsSuspending(false);
      setUpdatingStatus(null); // Clear updating status
    }
  };

  // Modified Activate Logic (Keep this)
  const handleOpenActivationModal = (building: Building) => {
      setBuildingToActivate(building);
      // Ensure dates are valid before creating Date objects
      setActivationStartDate(building.start_date && !isNaN(Date.parse(building.start_date)) ? new Date(building.start_date) : undefined);
      setActivationEndDate(building.end_date && !isNaN(Date.parse(building.end_date)) ? new Date(building.end_date) : undefined);
      setIsActivationModalOpen(true);
  };

  const handleActivateWithDates = async () => {
    if (!buildingToActivate) return;
    if (!activationStartDate || !activationEndDate) {
      toast.error("Please select both start and end dates.");
      return;
    }

    if (activationEndDate <= activationStartDate) {
      toast.error("End date must be after the start date.");
      return;
    }

    setIsActivating(true);
    setUpdatingStatus(buildingToActivate.id); // Indicate update for this building
    const loadingToastId = toast.loading(`Activating building ${buildingToActivate.building_name}...`);
    try {
      const response = await axiosInstance.patch(
        `/api/buildings/${buildingToActivate.id}/activate`,
        {
          start_date: format(activationStartDate, 'yyyy-MM-dd'),
          end_date: format(activationEndDate, 'yyyy-MM-dd'),
          // The backend activate route expects these dates to set status to 'active'
        }
      );
      console.log("Activate response:", response.data);

      if (response.status === 200) {
        setBuildings((prevBuildings) =>
          prevBuildings.map((building) =>
            building.id === buildingToActivate.id
              ? {
                  ...building,
                  status: 'active', // Backend sets status to 'active'
                  suspended: 0 as 0 | 1, // Backend sets suspended to 0
                  suspension_reason: null, // <-- Clear reason on activation
                  start_date: format(activationStartDate, 'yyyy-MM-dd'),
                  end_date: format(activationEndDate, 'yyyy-MM-dd'),
                }
              : building
          )
        );
        toast.success("Property activated successfully", { id: loadingToastId });
        setIsActivationModalOpen(false);
        setBuildingToActivate(null);
      } else {
        toast.error(response.data?.message || "Failed to activate property", { id: loadingToastId });
      }
    } catch (error: any) {
      console.error("Error activating building:", error.response?.data || error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "An unexpected error occurred", {
        id: loadingToastId,
      });
    } finally {
      setIsActivating(false);
      setUpdatingStatus(null); // Clear updating status
    }
  };

  const StatusBadge = ({
    status,
  }: {
    status: ReturnType<typeof getDisplayStatus>;
  }) => {
    const config = getStatusBadgeConfig(status);
    return (
      <span
        className={`
          px-3 py-1 rounded-full text-xs font-medium inline-flex items-center
          ${config.bg} ${config.text}
        `}
      >
        <span
          className={`
            w-2 h-2 rounded-full mr-1
            ${config.dot}
          `}
        ></span>
        {status}
      </span>
    );
  };

  const StatusCell = ({ building }: { building: Building }) => {
    const displayStatus = getDisplayStatus(building);
    const currentBuilding = building;

    const actions = [];

    // Determine available actions based on display status and suspended flag
    if (displayStatus === "Active" || displayStatus === "Expired") {
        // Offer Suspend if Active or Expired (and not currently suspended)
        if (currentBuilding.suspended !== 1) {
             actions.push({ label: "Suspend Property", action: () => handleOpenSuspensionModal(currentBuilding) });
        }

    } else { // Pending or Suspended
         // Offer Activate if Pending or Suspended
         actions.push({ label: "Activate Property", action: () => handleOpenActivationModal(currentBuilding) });
    }

    // You might add other actions here, like "View Details", "View Tenants", etc.
    // actions.push({ label: "View Details", action: () => console.log('View details', currentBuilding.id) });


    return (
      <div className="flex items-center justify-between">
        <StatusBadge status={displayStatus} />
        {/* Only show dropdown if actions exist and not currently updating */}
        {(actions.length > 0 && updatingStatus !== currentBuilding.id) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 ml-2"
                disabled={updatingStatus === currentBuilding.id} // Disable button while updating
              >
                 <MoreHorizontal className="h-4 w-4" />
                 <span className="sr-only">More actions</span>{/* Accessible label */}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map(({ label, action }) => (
                <DropdownMenuItem key={label} onClick={action}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* Show spinner if updatingStatus matches this building's ID */}
        {updatingStatus === currentBuilding.id && (
             <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
         )}
      </div>
    );
  };


  const renderExpandedDetails = (building: Building) => {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Building Image */}
          {/* Check if building_image path exists before rendering */}
          {building.building_image ? (
             <div className="col-span-full mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Building Image
              </h4>
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
               {/* FIX: Corrected the image source URL construction */}
               {/* Use API_URL followed by the path returned from the backend */}
               {/* Ensure forward slashes for URL consistency */}
               <img
                  src={`${API_URL}/${building.building_image.replace(/\\/g, '/')}`}
                  alt={`${building.building_name} image`}
                  className="w-full h-full object-cover rounded-lg" // Apply rounded-lg here
                  onError={(e: any) => {
                     console.error('Image failed to load:', building.building_image, 'Attempted URL:', `${API_URL}/${building.building_image.replace(/\\/g, '/')}`);
                    // Fallback to a placeholder image if the original fails
                    e.target.onerror = null; // Prevent infinite error loops
                    e.target.src = 'https://placehold.co/400x200/e0e0e0/333333?text=Image+Not+Available'; // Example placeholder
                  }}
                 />
              </div>
             </div>
           ) : (
             // Placeholder if no image is available
             <div className="col-span-full mb-4">
               <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                 Building Image
               </h4>
               <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No Image Available
               </div>
             </div>
           )}


          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Building Details
            </h4>
            <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <p>
                <span className="font-medium text-gray-900 dark:text-white">Address:</span>
                {building.building_address || 'N/A'} {/* Added N/A fallback */}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-white">Location:</span> {building.location || 'N/A'} {/* Added N/A fallback */}
              </p>
               <p>
                <span className="font-medium text-gray-900 dark:text-white">Property Type:</span> {building.property_type || 'N/A'} {/* Added N/A fallback */}
               </p>
               {/* Display the raw status from DB for debugging/information */}
               <p>
                 <span className="font-medium text-gray-900 dark:text-white">DB Status:</span> {building.status}
              </p>
               <p>
                 <span className="font-medium text-gray-900 dark:text-white">Suspended Flag:</span> {building.suspended === 1 ? 'Yes' : 'No'}
               </p>
               {/* Display Suspension Reason if suspended */}
               {building.suspended === 1 && building.suspension_reason && (
                   <p className="text-red-600 dark:text-red-400"> {/* Highlight the reason */}
                   <span className="font-medium text-gray-900 dark:text-white">Suspension Reason:</span> {building.suspension_reason}
                   </p>
               )}

               {(building.start_date || building.end_date) && (
                  <>
                   {/* Check for valid dates before formatting */}
                   <p>
                       <span className="font-medium text-gray-900 dark:text-white">Start Date:</span> {building.start_date && !isNaN(Date.parse(building.start_date)) ? format(new Date(building.start_date), 'PPP') : 'N/A'}
                    </p>
                     <p>
                       <span className="font-medium text-gray-900 dark:text-white">End Date:</span> {building.end_date && !isNaN(Date.parse(building.end_date)) ? format(new Date(building.end_date), 'PPP') : 'N/A'}
                     </p>
                  </>
               )}
              <p>
               <span className="font-medium text-gray-900 dark:text-white">Created At:</span> {building.created_at ? new Date(building.created_at).toLocaleDateString() : 'N/A'} {/* Added check */}
               </p>
            </div>
          </div>

           {/* Owner Details */}
           <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Owner Details
            </h4>
            <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <p>
                <span className="font-medium text-gray-900 dark:text-white">Email:</span>
                {building.owner_email || 'N/A'} {/* Added N/A fallback */}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-white">Phone:</span>
                {building.owner_phone || 'N/A'} {/* Added N/A fallback */}
              </p>
               <p>
                <span className="font-medium text-gray-900 dark:text-white">Address:</span>
                {building.owner_address || 'N/A'} {/* Added N/A fallback */}
              </p>
            </div>
           </div>

          {/* Action Buttons in Expanded View (Reset Password) */}
          <div className="space-y-2 col-span-full flex gap-2 mt-4">
             {/* Show Reset Password only if not currently updating */}
             {updatingStatus !== building.id && (
               <Button
                 variant="outline"
                 size="sm"
                 onClick={(e) => {
                   e.stopPropagation(); // Prevent row collapse
                   setResetPasswordId(building.id); // Open the AlertDialog
                 }}
               >
                  Reset Password
               </Button>
              )}
             {/* Show spinner if updatingStatus matches this building's ID */}
             {updatingStatus === building.id && (
                 <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
             )}
           </div>

        </div>
      </div>
    );
  };

  const handleRegistrationModal = () => {
    setIsRegistrationOpen(!isRegistrationOpen);
  };
  const handleRegistrationSuccess = () => {
    setIsRegistrationOpen(false);
    fetchProperties(); // Refresh the list after successful registration
  };
  const handleRegistrationCancel = () => {
    setIsRegistrationOpen(false);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredBuildings.length / itemsPerPage);
  const canGoNext = currentPage < totalPages - 1 && filteredBuildings.length > 0;
  const canGoPrev = currentPage > 0;


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Ensure Navbar and Sidebar paths are correct */}
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
                    Properties
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    {buildings.length} Total Properties
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                   <Button onClick={handleRegistrationModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                   </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search properties..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* Status filter updated */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                   <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <Table>
                   <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Building ID</TableHead>
                      <TableHead>Building Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Owner Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((building) => (
                      <React.Fragment key={building.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/70"
                          onClick={() => toggleRow(building.id)}
                        >
                          <TableCell className="font-medium">{building.id}</TableCell>
                          <TableCell>{building.building_name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{building.location}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                                <span>{building.owner_email}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {building.owner_phone}
                                </span>
                             </div>
                          </TableCell>
                          <TableCell>
                            {/* StatusCell contains the badge and dropdown */}
                            <StatusCell building={building} />
                          </TableCell>
                          <TableCell>
                            {/* Chevron icon indicating expanded state */}
                            {expandedRows.has(building.id) ? (
                              <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </TableCell>
                        </TableRow>
                        {/* Expanded details row */}
                        {expandedRows.has(building.id) && (
                          <TableRow className="bg-gray-100 dark:bg-gray-800/50">
                            <TableCell colSpan={6} className="p-0">
                              {renderExpandedDetails(building)}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                      {/* Display message if no properties found after filtering/loading */}
                      {paginatedData.length === 0 && !isLoading && (
                          <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center text-gray-500 dark:text-gray-400">
                                  No properties found matching the criteria.
                              </TableCell>
                          </TableRow>
                      )}
                       {/* Display loading message */}
                       {isLoading && (
                           <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center text-gray-500 dark:text-gray-400">
                                  Loading properties...
                              </TableCell>
                          </TableRow>
                       )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    Showing {filteredBuildings.length > 0 ? currentPage * itemsPerPage + 1 : 0} to{" "}
                    {Math.min(
                      (currentPage + 1) * itemsPerPage,
                      filteredBuildings.length
                    )}{" "}
                    of {filteredBuildings.length} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(0, prev - 1))
                      }
                      disabled={!canGoPrev || isLoading} // Disable if at first page or loading
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            totalPages - 1, // Use totalPages for accurate boundary
                            prev + 1
                          )
                        )
                      }
                      disabled={!canGoNext || isLoading} // Disable if at last page or loading
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* AlertDialog for Reset Password */}
      {/* This AlertDialog is triggered when setResetPasswordId is called with a building ID */}
      <AlertDialog
        open={!!resetPasswordId} // Open if resetPasswordId is not null or undefined
        onOpenChange={() => setResetPasswordId(null)} // Close when the dialog is dismissed by clicking outside or Cancel
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Property Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for this property's owner?
              This will set the password to the default "Pex123".
              <br />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingStatus === resetPasswordId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (resetPasswordId !== null) {
                  handleResetPassword(resetPasswordId);
                }
              }}
              disabled={updatingStatus === resetPasswordId} // Disable action button while resetting
            >
              {updatingStatus === resetPasswordId ? 'Resetting...' : 'Reset Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for adding a new property */}
      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
              <DialogTitle>Register New Property</DialogTitle>
          </DialogHeader>
          <BuildingRegistrationForm
             onSuccess={handleRegistrationSuccess}
             onCancel={handleRegistrationCancel}
           />
        </DialogContent>
      </Dialog>

      {/* Dialog for Activating with Dates */}
       <Dialog open={isActivationModalOpen} onOpenChange={setIsActivationModalOpen}>
           <DialogContent>
               <DialogHeader>
                   <DialogTitle>Activate Property: {buildingToActivate?.building_name}</DialogTitle>
               </DialogHeader>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                   {/* Start Date Picker */}
                   <div className="flex flex-col gap-2">
                       <label className="text-sm font-medium leading-none">Start Date</label>
                       <Popover>
                           <PopoverTrigger asChild>
                               <Button
                                   variant={"outline"}
                                   className={`w-full justify-start text-left font-normal ${!activationStartDate && "text-muted-foreground"}`}
                               >
                                   <CalendarIcon className="mr-2 h-4 w-4" />
                                   {activationStartDate ? format(activationStartDate, "PPP") : <span>Pick a date</span>}
                               </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0">
                               <Calendar
                                   mode="single"
                                   selected={activationStartDate}
                                   onSelect={setActivationStartDate}
                                   initialFocus
                               />
                           </PopoverContent>
                       </Popover>
                   </div>

                   {/* End Date Picker */}
                   <div className="flex flex-col gap-2">
                       <label className="text-sm font-medium leading-none">End Date</label>
                       <Popover>
                           <PopoverTrigger asChild>
                               <Button
                                   variant={"outline"}
                                   className={`w-full justify-start text-left font-normal ${!activationEndDate && "text-muted-foreground"}`}
                               >
                                   <CalendarIcon className="mr-2 h-4 w-4" />
                                   {activationEndDate ? format(activationEndDate, "PPP") : <span>Pick a date</span>}
                               </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0">
                               <Calendar
                                   mode="single"
                                   selected={activationEndDate}
                                   onSelect={setActivationEndDate}
                                   disabled={(date) => activationStartDate ? date < activationStartDate : false} // Ensure end date is not before start date
                                   initialFocus
                               />
                           </PopoverContent>
                       </Popover>
                   </div>
               </div>
               <DialogFooter>
                   <Button variant="outline" onClick={() => setIsActivationModalOpen(false)} disabled={isActivating}>Cancel</Button>
                   <Button onClick={handleActivateWithDates} disabled={isActivating || !activationStartDate || !activationEndDate}>
                       {isActivating ? "Activating..." : "Activate"}
                   </Button>
               </DialogFooter>
           </DialogContent>
       </Dialog>

      {/* Dialog for Suspending with Reason */}
       <Dialog open={isSuspensionModalOpen} onOpenChange={setIsSuspensionModalOpen}>
           <DialogContent>
               <DialogHeader>
                   <DialogTitle>Suspend Property: {buildingToSuspend?.building_name}</DialogTitle>
               </DialogHeader>
               <div className="py-4">
                   <div className="flex flex-col gap-2">
                       <label htmlFor="suspension-reason" className="text-sm font-medium leading-none">Reason for Suspension (Optional)</label> {/* Made optional as per common use case */}
                       <Textarea
                           id="suspension-reason"
                           placeholder="Enter reason for suspending this property..."
                           value={suspensionReason}
                           onChange={(e) => setSuspensionReason(e.target.value)}
                           rows={4} // Adjust rows as needed
                       />
                   </div>
               </div>
               <DialogFooter>
                   <Button variant="outline" onClick={() => setIsSuspensionModalOpen(false)} disabled={isSuspending}>Cancel</Button>
                   <Button onClick={handleConfirmSuspend} disabled={isSuspending}>
                       {isSuspending ? "Suspending..." : "Confirm Suspend"}
                   </Button>
               </DialogFooter>
           </DialogContent>
       </Dialog>


      <Toaster position="bottom-right" />
    </div>
  );
};

export default Properties;