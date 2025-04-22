// src/Pages/Properties.tsx
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
  Building2, // This icon might not be used now
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2, // Re-added for Delete button
} from "lucide-react"; // Assuming lucide-react is installed
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Assuming shadcn/ui paths
import { Check, MoreHorizontal } from "lucide-react";
import { Toaster } from "sonner";
import BuildingRegistrationForm from "../Modal/BuildingRegistrationForm"; // Import the new component
import { Dialog, DialogContent } from "@/components/ui/dialog"; // Assuming shadcn/ui paths

// Update the interface to match the provided JSON structure from your backend
interface Building {
  id: number; // Changed from string to number based on JSON
  building_name: string;
  building_image: string;
  building_address: string;
  location: string; // Corresponds to city/location in JSON
  property_type: string; // Added from JSON
  owner_email: string;
  owner_phone: string;
  owner_address: string;
  suspended: 0 | 1; // 0 for active, 1 for suspended/inactive
  created_at: string; // Assuming this is the column name
  // password?: string; // Removed - not typically returned in list view
}

// Helper function to map 'suspended' status to display string
const getStatusFromSuspended = (suspended: 0 | 1): "Active" | "Inactive" => {
  return suspended === 0 ? "Active" : "Inactive";
};

// Use the API_URL environment variable - ensure it's correctly set,
// and matches the port your backend Express app is running on (e.g., 8000)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Properties = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set()); // Changed to number
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState("");
  // Status filter options adjusted to match derived statuses
  const [statusFilter, setStatusFilter] = useState<string>("all"); // Can be 'all', 'Active', 'Inactive'
  const itemsPerPage = 5;

  // Re-added state for resetPasswordId and deletePropertyId
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
  const [deletePropertyId, setDeletePropertyId] = useState<number | null>(null);

  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null); // Keep for status update feedback
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false); // Keep for modal

  // Renamed to match usage in the Dialog onSuccess prop
  const fetchProperties = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading("Fetching properties...");
    try {
      // Updated endpoint to match the backend GET / route
      // Assumes the router is mounted under /api/buildings in your main app
      const response = await axiosInstance.get("/api/buildings");

      console.log("API Response:", response.data); // Debug log

      // Adjusted to access the 'buildings' array directly from response.data
      if (response.data?.buildings && Array.isArray(response.data.buildings)) {
        setBuildings(response.data.buildings);
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
  }, []); // Empty dependency array means this runs once on mount

  const toggleRow = (buildingId: number) => { // Changed to number
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
        building.id?.toString().includes(search.toLowerCase()) || // Search by ID (converted to string)
        building.location?.toLowerCase().includes(search.toLowerCase()) || // Search by location
        building.owner_email?.toLowerCase().includes(search.toLowerCase()); // Search by owner email

      // Filter by derived status
      const buildingStatus = getStatusFromSuspended(building.suspended);
      const matchesStatus =
        statusFilter === "all" || buildingStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [buildings, search, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredBuildings.slice(start, end);
  }, [filteredBuildings, currentPage, itemsPerPage]); // Added itemsPerPage dependency

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCurrentPage(0);
    toast.success("Filters reset", {
      description: "All filters have been cleared",
    });
  };

  // Re-added handleResetPassword - NOTE: Requires backend endpoint
  const handleResetPassword = async (buildingId: number) => {
     console.warn("Reset Password: Backend endpoint is required for this feature.");
     const loadingToast = toast.loading("Attempting to reset password...");
     try {
        // TODO: Implement the backend endpoint PUT/POST /api/buildings/:id/reset-password
        // The endpoint should handle the password reset logic.
      const response = await axiosInstance.post( // Or PUT, depending on your backend design
        `/api/buildings/${buildingId}/reset-password` // Example endpoint URL
        // You might need to send data in the body, e.g., { adminUser: '...' }
      );

      // Assuming backend returns a success message or status
      if (response.status === 200) { // Adjust status code based on backend
        toast.success("Password reset requested", { // Updated message
          id: loadingToast,
          description: response.data?.message || "Password reset process initiated.",
        });
        setResetPasswordId(null); // Close the dialog on success
      } else {
        toast.error("Failed to request password reset", {
          id: loadingToast,
          description: response.data?.message || "An unexpected error occurred.",
        });
      }

    } catch (error: any) {
      console.error("Error requesting password reset:", error.response?.data || error);
      toast.error("Failed to request password reset", {
        id: loadingToast,
        description:
          error.response?.data?.error || error.response?.data?.message || "An unexpected error occurred",
      });
    }
  };


  // Modified handleStatusChange to use the backend's suspend endpoint
  const handleStatusChange = async (buildingId: number, newStatus: "Active" | "Inactive") => {
    // Based on provided backend, we can only SUSPEND (set suspended = 1)
    if (newStatus === "Active") {
        // No backend endpoint provided to set suspended = 0 (activate)
        console.warn("Cannot set status to Active - backend activate endpoint is missing.");
        toast.info("Activate feature not available", {
            description: "The backend does not currently support reactivating properties."
        });
        return; // Exit if trying to set to Active
    }

    // If newStatus is 'Inactive', call the suspend endpoint
    setUpdatingStatus(buildingId);
    const loadingToast = toast.loading(`Marking building ${buildingId} as inactive...`);

    try {
      // Call the backend's suspend endpoint (PUT /api/buildings/suspend/:id)
      // Note: This endpoint expects no body, based on your backend code
      const response = await axiosInstance.put(
        `/api/buildings/suspend/${buildingId}`
      );

      console.log("Suspend response:", response.data); // Debug log

      // Assuming success if the request completes without error and status is 200
      // Your backend returns { message: 'Building suspended successfully' } on success
      if (response.status === 200) { // Adjust status code based on backend
        // Update the local state to reflect the 'suspended' status
        setBuildings((prevBuildings) =>
          prevBuildings.map((building) =>
            building.id === buildingId
              ? { ...building, suspended: 1 as 0 | 1 } // Set suspended to 1
              : building
          )
        );
        toast.success("Property marked as Inactive successfully", { id: loadingToast });
      } else {
          // Handle potential non-200 status if backend returns something else on 'non-error' cases
          // Your backend returns 404 if not found, 500 on error - these are caught by the catch block
          toast.error(response.data?.message || "Failed to update status", { id: loadingToast });
      }
    } catch (error: any) {
      console.error("Error suspending building:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Failed to update status", { id: loadingToast });
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Re-added handleDeleteProperty - NOTE: Requires backend endpoint
  const handleDeleteProperty = async (buildingId: number) => {
    console.warn("Delete Property: Backend endpoint is required for this feature.");
    const loadingToast = toast.loading("Attempting to delete property...");
    try {
        // TODO: Implement the backend endpoint DELETE /api/buildings/:id
      const response = await axiosInstance.delete(
        `/api/buildings/${buildingId}` // Example endpoint URL
      );

      // Assuming backend returns a success message or status
      if (response.status === 200) { // Adjust status code based on backend
        // Filter out the deleted building using its id
        setBuildings((prevBuildings) =>
          prevBuildings.filter((building) => building.id !== buildingId) // Use building.id
        );

        toast.success("Property deleted successfully", {
          id: loadingToast,
        });
        setDeletePropertyId(null); // Close dialog on success
      } else {
        toast.error("Failed to delete property", {
          id: loadingToast,
          description: response.data?.message || "An unexpected error occurred.",
        });
      }
    } catch (error: any) {
      console.error("Error deleting property:", error.response?.data || error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "An unexpected error occurred", {
        id: loadingToast,
      });
    }
  };


  // Adjusted StatusBadge to work with derived status
  const StatusBadge = ({
    status,
  }: {
    status: "Active" | "Inactive"; // Only Active and Inactive based on suspended field
  }) => {
    const statusConfig = {
      Active: {
        bg: "bg-green-100 dark:bg-green-900",
        text: "text-green-800 dark:text-green-300",
        dot: "bg-green-400 dark:bg-green-600",
      },
      Inactive: { bg: "bg-red-100 dark:bg-red-900", text: "text-red-800 dark:text-red-300", dot: "bg-red-400 dark:bg-red-600" },
    };

    const config = statusConfig[status];

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

  // Adjusted StatusCell to work with derived status and updated options
   const StatusCell = ({ building }: { building: Building }) => {
    const currentStatus = getStatusFromSuspended(building.suspended);

    // Options based on current status and backend capability (only suspend is directly supported by provided backend)
    // Only offer 'Mark as Inactive' if the building is currently Active
    const statusOptions: ("Inactive")[] = currentStatus === "Active" ? ["Inactive"] : [];

    return (
      <div className="flex items-center justify-between">
        <StatusBadge status={currentStatus} />
        {statusOptions.length > 0 && ( // Only show dropdown if there are options
            <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button
                 variant="ghost"
                 className="h-8 w-8 p-0 ml-2" // Added ml-2 for spacing
                 disabled={updatingStatus === building.id} // Use building.id
               >
                 {updatingStatus === building.id ? ( // Use building.id
                   <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                 ) : (
                   <MoreHorizontal className="h-4 w-4" />
                 )}
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               {statusOptions.map((status) => (
                 <DropdownMenuItem
                   key={status}
                   onClick={() => handleStatusChange(building.id, status)} // Use building.id
                   // Disabled if trying to set to the current status (which is handled by statusOptions filtering)
                   disabled={currentStatus === status}
                 >
                   {status === "Inactive" ? "Mark as Inactive" : status} {/* More descriptive text */}
                   {currentStatus === status && (
                     <Check className="h-4 w-4 ml-2" />
                   )}
                 </DropdownMenuItem>
               ))}
             </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };


  // Effect for filter feedback - kept
  useEffect(() => {
    // Removed toast info as it can be annoying on every character type
    // if (search || statusFilter !== "all") {
    //   const filteredCount = filteredBuildings.length;
    //   toast.info("Filter applied", {
    //     description: `Showing ${filteredCount} ${
    //       filteredCount === 1 ? "property" : "properties"
    //   }`,
    //   });
    // }
  }, [search, statusFilter]); // Removed filteredBuildings.length dependency to avoid toast spam

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600 dark:text-gray-300">Loading properties...</span> {/* Added loading text */}
      </div>
    );
  }

  // Adjusted to render details available in the provided JSON
  const renderExpandedDetails = (building: Building) => {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Display Building Image if available */}
          {building.building_image && (
             <div className="col-span-full mb-4">
               <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                 Building Image
               </h4>
               <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                 {/* Assuming building_image is a relative path, prepend API_URL */}
                 {/* Adjust this logic if your image paths are absolute URLs */}
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
                     // Fallback to a placeholder image - ensure you have one at /placeholder-image.png
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
                <span className="font-medium text-gray-900 dark:text-white">Address:</span>{" "}
                {building.building_address}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-white">Location:</span> {building.location}
              </p>
               <p>
                <span className="font-medium text-gray-900 dark:text-white">Property Type:</span> {building.property_type}
              </p>
              <p>
                 {/* Display derived status */}
                <span className="font-medium text-gray-900 dark:text-white">Status:</span> {getStatusFromSuspended(building.suspended)}
              </p>
               <p>
                <span className="font-medium text-gray-900 dark:text-white">Created At:</span> {new Date(building.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

           {/* Owner Details available in the JSON */}
           <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Owner Details
            </h4>
            <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <p>
                <span className="font-medium text-gray-900 dark:text-white">Email:</span>{" "}
                {building.owner_email}
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-white">Phone:</span>{" "}
                {building.owner_phone}
              </p>
               <p>
                <span className="font-medium text-gray-900 dark:text-white">Address:</span>{" "}
                {building.owner_address}
              </p>
            </div>
            {/* Removed Admin Details, Agreement Details, and Owners Table placeholders */}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 col-span-full flex gap-2 mt-4">
              {/* Reset Password Button - Re-added */}
             {/* NOTE: This requires a backend endpoint to be implemented */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setResetPasswordId(building.id); // Use building.id
                }}
              >
                Reset Password
              </Button>
              {/* Delete Button - Re-added */}
             {/* NOTE: This requires a backend endpoint to be implemented */}
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletePropertyId(building.id); // Use building.id
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Property
              </Button>
                {/* Add other action buttons here if backend supports them (e.g., Edit) */}
                {/* Example Edit Button (requires backend PUT /api/buildings/:id and a corresponding modal/form) */}
                {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        // Handle edit logic - maybe open an Edit modal
                    }}
                >
                    Edit Property
                </Button> */}
            </div>

        </div>
      </div>
    );
  };

   const handleRegistrationModal = () => {
     setIsRegistrationOpen(!isRegistrationOpen);
   };

    // Handlers for the BuildingRegistrationForm component
    const handleRegistrationSuccess = () => {
        setIsRegistrationOpen(false); // Close the modal
        fetchProperties(); // Refresh the list of properties
    };

    const handleRegistrationCancel = () => {
        setIsRegistrationOpen(false); // Just close the modal
    };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar and Sidebar are assumed to be correctly imported and functional */}
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8"> {/* Adjusted ml based on sidebar width */}
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
                   {/* Button to open registration modal */}
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
                {/* Status filter adjusted for Active/Inactive */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"> {/* Added shadow */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Building ID</TableHead> {/* Display JSON 'id' */}
                      <TableHead>Building Name</TableHead> {/* Display JSON 'building_name' */}
                      <TableHead>Location</TableHead> {/* Display JSON 'location' */}
                       <TableHead>Owner Contact</TableHead> {/* Combine email and phone */}
                      <TableHead>Status</TableHead> {/* Display derived status */}
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((building) => (
                      <React.Fragment key={building.id}> {/* Use building.id */}
                        <TableRow
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/70"
                          onClick={() => toggleRow(building.id)} // Use building.id
                        >
                          <TableCell className="font-medium">{building.id}</TableCell> {/* Display building.id */}
                          <TableCell>{building.building_name}</TableCell> {/* Display building.building_name */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{building.location}</span> {/* Display building.location */}
                            </div>
                          </TableCell>
                           <TableCell>
                             <div className="flex flex-col">
                               <span>{building.owner_email}</span> {/* Display building.owner_email */}
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                   {building.owner_phone} {/* Display building.owner_phone */}
                                </span>
                             </div>
                           </TableCell>
                          <TableCell>
                            {/* Pass derived status to StatusCell */}
                            <StatusCell building={building} />
                          </TableCell>
                          <TableCell>
                            {expandedRows.has(building.id) ? ( // Use building.id
                              <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(building.id) && ( // Use building.id
                          <TableRow className="bg-gray-100 dark:bg-gray-800/50"> {/* Distinct background for expanded row */}
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
                      )}
                      disabled={
                        currentPage >=
                        (Math.ceil(filteredBuildings.length / itemsPerPage) - 1) || filteredBuildings.length === 0
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
                {/* Corrected closing tag for the table container div */}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Reset Password Confirmation Dialog - Re-added */}
     {/* NOTE: This dialog's action button calls handleResetPassword, which requires a backend endpoint */}
      <AlertDialog
        open={!!resetPasswordId}
        onOpenChange={() => setResetPasswordId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle> {/* Simplified Title */}
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
                if (resetPasswordId !== null) { // Check for null explicitly
                  handleResetPassword(resetPasswordId);
                }
              }}
            >
              Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Property Confirmation Dialog - Re-added */}
     {/* NOTE: This dialog's action button calls handleDeleteProperty, which requires a backend endpoint */}
      <AlertDialog
        open={!!deletePropertyId}
        onOpenChange={() => setDeletePropertyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot
              be undone. Please ensure the backend endpoint for this action is implemented.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deletePropertyId !== null) { // Check for null explicitly
                  handleDeleteProperty(deletePropertyId);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {/* Dialog for adding a new property */}
       <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
         <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]"> {/* Added overflow-y-auto and max-h for scrollability */}
           {/* Render the actual BuildingRegistrationForm component */}
           <BuildingRegistrationForm
                onSuccess={handleRegistrationSuccess}
                onCancel={handleRegistrationCancel}
            />
         </DialogContent>
       </Dialog>

      <Toaster position="bottom-right" />
    </div>
  );
};

export default Properties;