// src/Pages/Properties.tsx
import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../Pages/Navbar";
import Sidebar from "../Pages/Sidebar";
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
  building_image: string;
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
}

// Helper to display the derived status
const getDisplayStatus = (building: Building): "Active" | "Suspended" | "Pending" | "Expired" => {
  if (building.suspended === 1) return "Suspended";
  switch (building.status) {
    case 'active':
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Properties = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const itemsPerPage = 5;

  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);

  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  // State for Activation Modal
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [buildingToActivate, setBuildingToActivate] = useState<Building | null>(null);
  const [activationStartDate, setActivationStartDate] = useState<Date | undefined>(undefined);
  const [activationEndDate, setActivationEndDate] = useState<Date | undefined>(undefined);
  const [isActivating, setIsActivating] = useState(false);

  // --- New State for Suspension Modal ---
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [buildingToSuspend, setBuildingToSuspend] = useState<Building | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);
  // --- End New State ---


  const fetchProperties = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading("Fetching properties...");
    try {
      // Ensure your backend returns status, start_date, end_date, suspended, AND suspension_reason
      const response = await axiosInstance.get("/api/buildings");

      console.log("API Response:", response.data);

      if (response.data?.buildings && Array.isArray(response.data.buildings)) {
        const fetchedBuildings: Building[] = response.data.buildings.map((b: any) => ({
          id: b.id,
          building_name: b.building_name,
          building_image: b.building_image,
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
          id: loadingToast,
        });
      } else {
        console.error("Invalid response format:", response.data);
        toast.error("Failed to load properties", {
          id: loadingToast,
          description: "Invalid data format received from the API.",
        });
      }
    } catch (error) {
      console.error("Error fetching buildings:", error);
      toast.error("Failed to fetch properties", {
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
      const matchesSearch =
        building.building_name?.toLowerCase().includes(search.toLowerCase()) ||
        building.id?.toString().includes(search.toLowerCase()) ||
        building.location?.toLowerCase().includes(search.toLowerCase()) ||
        building.owner_email?.toLowerCase().includes(search.toLowerCase());

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

  const handleResetPassword = async (buildingId: number) => {
    console.warn("Reset Password: Backend endpoint /api/buildings/:id/reset-password is required for this feature.");
    const loadingToast = toast.loading("Attempting to reset password...");
    try {
      const response = await axiosInstance.post(
        `/api/buildings/${buildingId}/reset-password`
      );

      if (response.status === 200) {
        toast.success("Password reset requested", {
          id: loadingToast,
          description: response.data?.message || "Password reset process initiated.",
        });
        setResetPasswordId(null);
      } else {
        toast.error("Failed to request password reset", {
          id: loadingToast,
          description: response.data?.message || "An unexpected error occurred.",
        });
      }

    } catch (error: any) {
      console.error("Error requesting password reset:", error.response?.data || error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "An unexpected error occurred", {
        id: loadingToast,
      });
    }
  };

  // --- Modified Suspend Logic ---

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
    const loadingToast = toast.loading(`Suspending building ${buildingToSuspend.building_name}...`);

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
        toast.success("Property suspended successfully", { id: loadingToast });
        setIsSuspensionModalOpen(false); // Close modal
        setBuildingToSuspend(null); // Clear selected building
      } else {
        toast.error(response.data?.message || "Failed to suspend property", { id: loadingToast });
      }
    } catch (error: any) {
      console.error("Error suspending building:", error.response?.data || error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "An unexpected error occurred", {
        id: loadingToast,
      });
    } finally {
      setIsSuspending(false);
      setUpdatingStatus(null); // Clear updating status
    }
  };

  // --- Modified Activate Logic (Keep this) ---

  const handleOpenActivationModal = (building: Building) => {
      setBuildingToActivate(building);
      setActivationStartDate(undefined);
      setActivationEndDate(undefined);
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
    const loadingToast = toast.loading(`Activating building ${buildingToActivate.building_name}...`);

    try {
      const response = await axiosInstance.patch(
        `/api/buildings/${buildingToActivate.id}/activate`,
        {
          start_date: format(activationStartDate, 'yyyy-MM-dd'),
          end_date: format(activationEndDate, 'yyyy-MM-dd'),
        }
      );

      console.log("Activate response:", response.data);

      if (response.status === 200) {
        setBuildings((prevBuildings) =>
          prevBuildings.map((building) =>
            building.id === buildingToActivate.id
              ? {
                  ...building,
                  status: 'active',
                  suspended: 0 as 0 | 1,
                  suspension_reason: null, // <-- Clear reason on activation
                  start_date: format(activationStartDate, 'yyyy-MM-dd'),
                  end_date: format(activationEndDate, 'yyyy-MM-dd'),
                }
              : building
          )
        );
        toast.success("Property activated successfully", { id: loadingToast });
        setIsActivationModalOpen(false);
        setBuildingToActivate(null);
      } else {
        toast.error(response.data?.message || "Failed to activate property", { id: loadingToast });
      }
    } catch (error: any) {
      console.error("Error activating building:", error.response?.data || error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "An unexpected error occurred", {
        id: loadingToast,
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

    if (displayStatus === "Active") {
        // Change the action to open the suspension modal
        actions.push({ label: "Suspend Property", action: () => handleOpenSuspensionModal(currentBuilding) });
    } else { // Pending, Suspended, Expired
         // Offer Activate if not Active (and not currently being activated/suspended)
         if (currentBuilding.status === 'pending' || currentBuilding.status === 'expired' || currentBuilding.suspended === 1) {
              actions.push({ label: "Activate Property", action: () => handleOpenActivationModal(currentBuilding) });
         }
         // If Suspended, you might also want an "Unsuspend" option that doesn't require dates
         // For simplicity, we are assuming Activate handles setting suspended=0.
    }


    return (
      <div className="flex items-center justify-between">
        <StatusBadge status={displayStatus} />
        {(actions.length > 0 && updatingStatus !== currentBuilding.id) && ( // Only show dropdown if actions exist and not currently updating
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 ml-2"
                disabled={updatingStatus === currentBuilding.id}
              >
                 <MoreHorizontal className="h-4 w-4" />
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
          {building.building_image && (
             <div className="col-span-full mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Building Image
              </h4>
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
               <img
                  src={building.building_image.startsWith('http')
                    ? building.building_image
                    : `${API_URL}${building.building_image}`
                   }
                  alt={`${building.building_name} image`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', building.building_image, 'Attempted URL:', building.building_image.startsWith('http')
                     ? building.building_image
                     : `${API_URL}${building.building_image}`);
                    e.currentTarget.src = '/placeholder-image.png';
                  }}
                 />
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
                {building.building_address}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-white">Location:</span> {building.location}
              </p>
               <p>
                <span className="font-medium text-gray-900 dark:text-white">Property Type:</span> {building.property_type}
               </p>
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
                    <p>
                       <span className="font-medium text-gray-900 dark:text-white">Start Date:</span> {building.start_date ? format(new Date(building.start_date), 'PPP') : 'N/A'}
                    </p>
                     <p>
                       <span className="font-medium text-gray-900 dark:text-white">End Date:</span> {building.end_date ? format(new Date(building.end_date), 'PPP') : 'N/A'}
                     </p>
                  </>
               )}
              <p>
               <span className="font-medium text-gray-900 dark:text-white">Created At:</span> {new Date(building.created_at).toLocaleDateString()}
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
                {building.owner_email}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-white">Phone:</span>
                {building.owner_phone}
              </p>
               <p>
                <span className="font-medium text-gray-900 dark:text-white">Address:</span>
                {building.owner_address}
               </p>
            </div>
           </div>

          {/* Action Buttons in Expanded View (Only Reset Password remains) */}
          <div className="space-y-2 col-span-full flex gap-2 mt-4">
             <Button
               variant="outline"
               size="sm"
               onClick={(e) => {
                 e.stopPropagation();
                 setResetPasswordId(building.id);
               }}
             >
               Reset Password
             </Button>
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
    fetchProperties();
  };

  const handleRegistrationCancel = () => {
    setIsRegistrationOpen(false);
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
                            <StatusCell building={building} />
                          </TableCell>
                          <TableCell>
                            {expandedRows.has(building.id) ? (
                              <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(building.id) && (
                          <TableRow className="bg-gray-100 dark:bg-gray-800/50">
                            <TableCell colSpan={6} className="p-0">
                              {renderExpandedDetails(building)}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                      ))}
                      {paginatedData.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center text-gray-500 dark:text-gray-400">
                                  No properties found.
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
                            Math.ceil(filteredBuildings.length / itemsPerPage) -
                              1,
                            prev + 1
                          )
                        )
                      }
                      disabled={
                        currentPage >=
                        (Math.ceil(filteredBuildings.length / itemsPerPage) - 1) || filteredBuildings.length === 0
                      }
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
      <AlertDialog
        open={!!resetPasswordId}
        onOpenChange={() => setResetPasswordId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Property Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for this property?
              This action will reset the password associated with the property's owner/admin.
              Please ensure the backend endpoint for this action is implemented.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (resetPasswordId !== null) {
                  handleResetPassword(resetPasswordId);
                }
              }}
            >
              Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for adding a new property */}
      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
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
                                   disabled={(date) => activationStartDate ? date < activationStartDate : false}
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

      {/* --- New Dialog for Suspending with Reason --- */}
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
      {/* --- End New Dialog --- */}


      <Toaster position="bottom-right" />
    </div>
  );
};

export default Properties;