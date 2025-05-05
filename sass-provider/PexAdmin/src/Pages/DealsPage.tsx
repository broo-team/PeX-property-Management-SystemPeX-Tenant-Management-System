// src/Pages/DealsPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../Pages/Navbar"; // Adjust path as needed
import Sidebar from "../Pages/Sidebar"; // Adjust path as needed
import axiosInstance from "../services/authService"; // Assuming this is correctly configured
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Assuming shadcn/ui card components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CalendarIcon } from "lucide-react";
import { Toaster } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Reusing the Building interface as deals are tied to active/expired properties
interface Building {
  id: number;
  building_name: string;
  building_image: string; // This is the path from the backend
  building_address: string;
  location: string;
  property_type: string;
  owner_email: string;
  owner_phone: string;
  owner_address: string;
  suspended: 0 | 1;
  suspension_reason: string | null;
  created_at: string;
  status: 'pending' | 'active' | 'expired';
  start_date: string | null; // Deal start date
  end_date: string | null;   // Deal end date
}

// Helper to display the derived status (similar to Properties.tsx)
const getDisplayStatus = (building: Building): "Active" | "Suspended" | "Pending" | "Expired" => {
  if (building.suspended === 1) return "Suspended";
  switch (building.status) {
    case 'active':
      // Optionally add date check here if 'active' should become 'expired' automatically
      // based on current date vs end_date. Or handle this server-side.
      // For now, relying on backend status.
      return "Active";
    case 'expired':
      return "Expired";
    case 'pending':
    default:
      return "Pending";
  }
};

// Helper to determine Status Badge appearance (similar to Properties.tsx)
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
// IMPORTANT: Replace with your actual backend URL in production
const API_URL = 'http://localhost:5000'; // Make sure this matches your backend URL

const DealsPage = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Filter by deal status (Active, Expired, Suspended)
  const [statusFilter, setStatusFilter] = useState<string>("all"); // 'all', 'Active', 'Expired', 'Suspended'

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [buildingToUpdate, setBuildingToUpdate] = useState<Building | null>(null);
  const [updateStartDate, setUpdateStartDate] = useState<Date | undefined>(undefined);
  const [updateEndDate, setUpdateEndDate] = useState<Date | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);


  const fetchDeals = async () => {
    setIsLoading(true);
    // Use a persistent toast ID for updating
    const loadingToastId = toast.loading("Fetching deals...");
    try {
      // Fetch all buildings, we will filter on the client side for 'deals'
      const response = await axiosInstance.get("/api/buildings");
      console.log("Deals API Response:", response.data);

      if (response.data?.buildings && Array.isArray(response.data.buildings)) {
        const fetchedBuildings: Building[] = response.data.buildings.map((b: any) => ({
          id: b.id,
          building_name: b.building_name,
          building_image: b.building_image, // This path comes from the DB
          building_address: b.building_address,
          location: b.location,
          property_type: b.property_type,
          owner_email: b.owner_email,
          owner_phone: b.owner_phone,
          owner_address: b.owner_address,
          suspended: b.suspended === 1 ? 1 : 0,
          suspension_reason: b.suspension_reason,
          created_at: b.created_at,
          status: b.status as 'pending' | 'active' | 'expired',
          start_date: b.start_date,
          end_date: b.end_date,
        }));
        // Filter for buildings that represent 'deals' (Active, Expired, Suspended statuses displayed)
        const dealBuildings = fetchedBuildings.filter(b => {
             const displayStatus = getDisplayStatus(b);
             return displayStatus === 'Active' || displayStatus === 'Expired' || displayStatus === 'Suspended';
        });
        setBuildings(dealBuildings);
        toast.success("Deals loaded successfully", {
          id: loadingToastId, // Use the same ID to update
          duration: 3000 // Keep success toast visible for a bit
        });
      } else {
        console.error("Invalid response format:", response.data);
        toast.error("Failed to load deals", {
          id: loadingToastId, // Use the same ID to update
          description: "Invalid data format received from the API.",
        });
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast.error("Failed to fetch deals", {
        id: loadingToastId, // Use the same ID to update
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const filteredDeals = useMemo(() => {
    return buildings.filter((building) => {
      // Convert potentially null fields to empty string for includes() check
      const buildingName = building.building_name || '';
      const location = building.location || '';
      const ownerEmail = building.owner_email || '';
      const ownerPhone = building.owner_phone || '';
      const startDate = building.start_date || '';
      const endDate = building.end_date || '';


      const lowerSearch = search.toLowerCase();

      const matchesSearch =
        buildingName.toLowerCase().includes(lowerSearch) ||
        building.id?.toString().includes(lowerSearch) ||
        location.toLowerCase().includes(lowerSearch) ||
        ownerEmail.toLowerCase().includes(lowerSearch) ||
        ownerPhone.toLowerCase().includes(lowerSearch) ||
        startDate.includes(lowerSearch) ||
        endDate.includes(lowerSearch); // Basic search on date strings


      const displayStatus = getDisplayStatus(building);
      const matchesStatus =
        statusFilter === "all" || displayStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [buildings, search, statusFilter]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    toast.success("Filters reset", {
      description: "All filters have been cleared",
    });
  };

  // Function to open the update modal and pre-fill dates
  const handleOpenUpdateModal = (building: Building) => {
      setBuildingToUpdate(building);
      // Pre-fill with existing dates if available
      // Ensure dates are valid before creating Date objects
      setUpdateStartDate(building.start_date && !isNaN(Date.parse(building.start_date)) ? new Date(building.start_date) : undefined);
      setUpdateEndDate(building.end_date && !isNaN(Date.parse(building.end_date)) ? new Date(building.end_date) : undefined);
      setIsUpdateModalOpen(true);
  };

  // Function to handle confirming the update
  const handleConfirmUpdate = async () => {
    if (!buildingToUpdate) return;
    if (!updateStartDate || !updateEndDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
     if (updateEndDate <= updateStartDate) {
      toast.error("End date must be after the start date.");
      return;
    }

    setIsUpdating(true);
    const loadingToastId = toast.loading(`Updating deal for ${buildingToUpdate.building_name}...`);

    try {
      // FIX: Corrected the endpoint URL to match the backend's /activate route
      // Assuming activate route handles updating start/end dates for an active deal
      const response = await axiosInstance.patch(
        `/api/buildings/${buildingToUpdate.id}/activate`,
        {
          start_date: format(updateStartDate, 'yyyy-MM-dd'),
          end_date: format(updateEndDate, 'yyyy-MM-dd'),
           // You might need to explicitly send status='active' if the backend
           // activate route doesn't automatically set it based on receiving dates.
           // Check your backend logic in activateBuildingWithDates.
        }
      );

      console.log("Update Deal response:", response.data);

      if (response.status === 200) {
        // Update the building in the state with the new dates
        setBuildings((prevBuildings) =>
          prevBuildings.map((building) =>
            building.id === buildingToUpdate.id
              ? {
                  ...building,
                  start_date: format(updateStartDate, 'yyyy-MM-dd'),
                  end_date: format(updateEndDate, 'yyyy-MM-dd'),
                  // The backend activate route sets status to 'active' and suspended to 0
                  status: 'active',
                  suspended: 0,
                  suspension_reason: null,
                }
              : building
          )
        );
        toast.success("Deal updated successfully", { id: loadingToastId });
        setIsUpdateModalOpen(false);
        setBuildingToUpdate(null);
      } else {
        toast.error(response.data?.message || "Failed to update deal", { id: loadingToastId });
      }
    } catch (error: any) {
      console.error("Error updating deal:", error.response?.data || error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "An unexpected error occurred", {
        id: loadingToastId,
      });
    } finally {
      setIsUpdating(false);
    }
  };


  // Status Badge component (reused from Properties.tsx)
  const StatusBadge = ({ status }: { status: ReturnType<typeof getDisplayStatus>; }) => {
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
                    Property Deals
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    {filteredDeals.length} Active, Expired, or Suspended Deals
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                  {/* Add other actions like "Export Deals" if needed */}
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search deals..."
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
                    {/* Filter options should match the display statuses we show */}
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                     {/* 'Pending' is not filtered as a 'deal' status based on your fetch logic */}
                  </SelectContent>
                </Select>
                  {/* Add date range filter if needed */}
              </div>

              {/* Deals Grid (Card Layout) */}
              {isLoading ? (
                   <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading deals...</div>
               ) : filteredDeals.length === 0 ? (
                   <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    No deals found matching the criteria.
                   </div>
               ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDeals.map((building) => (
                    <Card key={building.id} className="flex flex-col">
                      {/* Check if building_image path exists */}
                      {building.building_image && (
                        <div className="relative w-full h-48 rounded-t-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                         {/* FIX: Corrected the image source URL construction */}
                         {/* Use API_URL followed by the path returned from the backend */}
                         {/* Ensure forward slashes for URL consistency */}
                         <img
                            src={`${API_URL}/${building.building_image.replace(/\\/g, '/')}`}
                            alt={building.building_name || 'Building image'}
                            className="w-full h-48 object-cover rounded-t-lg" // Apply rounded-t-lg here
                            onError={(e: any) => {
                                e.target.onerror = null; // Prevent infinite loop
                                e.target.src = '/placeholder-image.jpg'; // Provide a fallback image
                                console.error("Failed to load image:", `${API_URL}/${building.building_image.replace(/\\/g, '/')}`);
                            }}
                         />
                        </div>
                      )}
                       {!building.building_image && (
                         <div className="relative w-full h-48 rounded-t-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                           No Image Available
                         </div>
                       )}
                      <CardHeader className="flex-shrink-0"> {/* Prevent header from growing */}
                        <CardTitle className="text-lg">{building.building_name}</CardTitle>
                        <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {building.id} | {building.location}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-2 text-sm text-gray-700 dark:text-gray-300"> {/* Allow content to grow */}
                           <div className="flex items-center">
                              <span className="font-medium mr-2">Status:</span>
                              <StatusBadge status={getDisplayStatus(building)} />
                           </div>
                           {(building.start_date || building.end_date) && (
                                <div className="flex flex-col">
                                   {/* Check for valid dates before formatting */}
                                   <p><span className="font-medium">Start Date:</span> {building.start_date && !isNaN(Date.parse(building.start_date)) ? format(new Date(building.start_date), 'PPP') : 'N/A'}</p>
                                   <p><span className="font-medium">End Date:</span> {building.end_date && !isNaN(Date.parse(building.end_date)) ? format(new Date(building.end_date), 'PPP') : 'N/A'}</p>
                                </div>
                           )}
                           {building.suspended === 1 && building.suspension_reason && (
                                <p className="text-red-600 dark:text-red-400 text-xs">
                                   <span className="font-medium text-gray-900 dark:text-white">Reason:</span> {building.suspension_reason}
                                </p>
                           )}
                           {/* You could add more details here if needed, e.g., owner contact */}
                           {/* <p><span className="font-medium">Owner:</span> {building.owner_email}</p> */}
                      </CardContent>
                      <CardFooter className="flex justify-end flex-shrink-0"> {/* Prevent footer from growing */}
                           {/* Only show update button if not suspended */}
                           {building.suspended !== 1 && (
                             <Button variant="outline" size="sm" onClick={() => handleOpenUpdateModal(building)}>
                               Update Deal Dates
                             </Button>
                           )}
                           {/* Add other relevant actions here, e.g., View Details, View Tenants (if applicable) */}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination is not included in this card view for simplicity,
                  but you could add it here if you have many deals. */}

            </div>
          </div>
        </main>
      </div>

      {/* Dialog for Updating Deal Dates */}
       <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Update Deal Dates for: {buildingToUpdate?.building_name}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {/* Start Date Picker */}
                  <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium leading-none">New Start Date</label>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button
                                  variant={"outline"}
                                  className={`w-full justify-start text-left font-normal ${!updateStartDate && "text-muted-foreground"}`}
                              >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {updateStartDate ? format(updateStartDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                              <Calendar
                                  mode="single"
                                  selected={updateStartDate}
                                  onSelect={setUpdateStartDate}
                                  initialFocus
                              />
                          </PopoverContent>
                      </Popover>
                  </div>

                  {/* End Date Picker */}
                  <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium leading-none">New End Date</label>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button
                                  variant={"outline"}
                                  className={`w-full justify-start text-left font-normal ${!updateEndDate && "text-muted-foreground"}`}
                              >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {updateEndDate ? format(updateEndDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                              <Calendar
                                  mode="single"
                                  selected={updateEndDate}
                                  onSelect={setUpdateEndDate}
                                  disabled={(date) => updateStartDate ? date < updateStartDate : false}
                                  initialFocus
                              />
                          </PopoverContent>
                      </Popover>
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)} disabled={isUpdating}>Cancel</Button>
                  <Button onClick={handleConfirmUpdate} disabled={isUpdating || !updateStartDate || !updateEndDate}>
                      {isUpdating ? "Updating..." : "Update Deal"}
                  </Button>
              </DialogFooter>
          </DialogContent>
       </Dialog>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default DealsPage;