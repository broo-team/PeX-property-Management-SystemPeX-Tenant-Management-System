import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,

  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  Settings,
  User,
  Menu,
  Bell,
  Home,
  FileText,
  PenToolIcon as Tool,
  Book,
  DollarSign,
  Zap,
  LogOut,
  Plus,
  MessageCircle,
  LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import axiosInstance from "@/services/authService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import Profile from "../account/profile";
import { motion, AnimatePresence } from "framer-motion";
import { DayPicker } from "react-day-picker";
import { addDays } from "date-fns";
import "react-day-picker/dist/style.css";
import PaymentButton from "../payment/PaymentButton";
import { Maintenance } from "../maintenance/Maintenance";
import LeasePayments from "../RentAndLease/LeasePayments";

type LeasePayment = {
  _id: string;
  roomNo: string[];
  fullName: string;
  price: number;
  paymentDueDate: string;
  paymentStatus: "Paid" | "Pending" | "Overdue";
  buildingId: string;
  tenant: string;
  createdAt: string;
  updatedAt: string;
};

type ElectricityBill = {
  _id: string;
  roomNo: string;
  fullName: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  billAmount: number;
  readingDate: string;
  paymentStatus?: "Paid" | "Pending" | "Overdue";
};

type MaintenanceRequest = {
  _id: string;
  description: string;
  category: "Electrical" | "Water" | "Infrastructure" | "HVAC" | "Other";
  status: "Pending" | "In Progress" | "Resolved";
  createdAt: string;
};

interface TenantProfile {
  _id: string;
  fullName: string;
  sex: string;
  phoneNumber: string;
  city: string;
  email: string;
  roomNo: string[];
  // Add other fields as needed
}

type Notification = {
  _id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

type PaymentHistory = {
  month: string;
  lease: number;
  electricity: number;
};

type QuickAction = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action: () => void;
  color: string;
};

type PaymentData = {
  amount: number;
  date: string;
  type: "lease" | "electricity";
};

export default function Dashboard() {
  const [leasePayments, setLeasePayments] = useState<LeasePayment[]>([]);
  const [electricityBills, setElectricityBills] = useState<ElectricityBill[]>(
    []
  );
  const [maintenanceRequests, setMaintenanceRequests] = useState<
    MaintenanceRequest[]
  >([]);
  const [rulesAndRegulations, setRulesAndRegulations] = useState<string>("");
  const navigate = useNavigate();
  const [newMaintenanceRequest, setNewMaintenanceRequest] = useState({
    description: "",
    category: "Other" as
      | "Electrical"
      | "Water"
      | "Infrastructure"
      | "HVAC"
      | "Other",
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState({
    lease: true,
    electricity: true,
    maintenance: true,
    rules: true,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<"english" | "amharic">("english");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<TenantProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await axiosInstance.get("/api/tenants/tenant/profile");
        console.log("User data response:", response.data); // Debug log

        if (response.data && response.data.tenant) {
          setUserData(response.data.tenant);
        } else {
          throw new Error("Invalid user data structure");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      }
    };

    fetchUserData();
    fetchLeasePayments();
    fetchElectricityBills();
    fetchMaintenanceRequests();
    fetchRulesAndRegulations();
    fetchNotifications();
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    // Implement theme change logic here
  };

  const changeLanguage = (lang: "english" | "amharic") => {
    setLanguage(lang);
    // Implement language change logic here
  };

  const handleLogout = () => {
    // Implement logout logic here
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const fetchLeasePayments = async () => {
    try {
      const response = await axiosInstance.get("/api/leases/getTenantLease");
      if (response.data.success && Array.isArray(response.data.leases)) {
        setLeasePayments(response.data.leases);
      } else {
        throw new Error("Unexpected data structure for lease payments");
      }
    } catch (error) {
      console.error("Error fetching lease payments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch lease payments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, lease: false }));
    }
  };

  const fetchElectricityBills = async () => {
    try {
      console.log("Fetching electricity bills...");
      const response = await axiosInstance.get("/api/elec/electricity-bills");
      console.log("Raw response data:", response.data);

      let bills: ElectricityBill[] = [];

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.bills)
      ) {
        bills = response.data.bills;
      } else if (Array.isArray(response.data)) {
        bills = response.data;
      } else if (
        response.data &&
        Array.isArray(response.data.electricityBills)
      ) {
        bills = response.data.electricityBills;
      } else {
        throw new Error("Unexpected data structure for electricity bills");
      }

      console.log("Processed electricity bills:", bills);
      setElectricityBills(bills);
    } catch (error) {
      console.error("Error fetching electricity bills:", error);
      toast({
        title: "Error",
        description: "Failed to fetch electricity bills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, electricity: false }));
    }
  };

  const fetchMaintenanceRequests = async () => {
    try {
      console.log("Fetching maintenance requests...");
      const response = await axiosInstance.get(
        "/api/maintenances/getMaintenanceByTenant"
      );
      console.log("Raw maintenance response data:", response.data);

      let maintenances: MaintenanceRequest[] = [];

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.maintenances)
      ) {
        maintenances = response.data.maintenances;
      } else if (Array.isArray(response.data)) {
        maintenances = response.data;
      } else if (response.data && Array.isArray(response.data.maintenance)) {
        maintenances = response.data.maintenance;
      } else if (response.data && typeof response.data === "object") {
        // If the response is an object, try to extract an array from it
        const possibleArray = Object.values(response.data).find((value) =>
          Array.isArray(value)
        );
        if (possibleArray) {
          maintenances = possibleArray;
        } else {
          throw new Error("Unexpected data structure for maintenance requests");
        }
      } else {
        throw new Error("Unexpected data structure for maintenance requests");
      }

      console.log("Processed maintenance requests:", maintenances);
      setMaintenanceRequests(maintenances);
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch maintenance requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, maintenance: false }));
    }
  };
  const fetchRulesAndRegulations = async () => {
    try {
      const response = await axiosInstance.get(
        "/api/tenant/rules-and-regulations"
      );
      if (typeof response.data.content === "string") {
        setRulesAndRegulations(response.data.content);
      } else {
        throw new Error("Unexpected data structure for rules and regulations");
      }
    } catch (error) {
      console.error("Error fetching rules and regulations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch rules and regulations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, rules: false }));
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get("/api/notifications");
      if (response.data.success && Array.isArray(response.data.notifications)) {
        setNotifications(response.data.notifications);
      } else {
        throw new Error("Unexpected data structure for notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const handlePayment = async (type: "lease" | "electricity", id: string) => {
    try {
      await axiosInstance.post(`/api/tenant/${type}-payment/${id}`);
      toast({
        title: "Success",
        description: `${
          type === "lease" ? "Lease" : "Electricity"
        } payment successful.`,
      });
      if (type === "lease") {
        fetchLeasePayments();
      } else {
        fetchElectricityBills();
      }
    } catch (error) {
      console.error(`Error processing ${type} payment:`, error);
      toast({
        title: "Error",
        description: `Failed to process ${type} payment. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // const handleMaintenanceSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     await axiosInstance.post(
  //       "/api/maintenances",
  //       newMaintenanceRequest
  //     );
  //     toast({
  //       title: "Success",
  //       description: "Maintenance request submitted successfully.",
  //     });
  //     setNewMaintenanceRequest({ description: "", category: "Other" });
  //     fetchMaintenanceRequests();
  //   } catch (error) {
  //     console.error("Error submitting maintenance request:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to submit maintenance request. Please try again.",
  //       variant: "destructive",
  //     });
  //   }
  // };

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

  const renderSkeleton = () => (
    <>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </>
  );

  const renderSidebar = () => (
    <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-emerald-100">
      <div className="p-4 border-b border-emerald-100">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-8 rounded-lg  flex items-center justify-center">
            <img src="/ex.png" alt="logo" className="h-full w-full" />
          </div>
          <h2 className="text-xl font-light bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent ml-0 mt-2">
            Pex Property
          </h2>
        </div>
      </div>

      <nav className="flex-1 p-4">
        {[
          { name: "Overview", icon: Home },
          { name: "Lease", icon: DollarSign },
          { name: "Electricity", icon: Zap },
          { name: "Maintenance", icon: Tool },
          { name: "Rules", icon: Book },
        ].map(({ name, icon: Icon }) => (
          <button
            key={name.toLowerCase()}
            onClick={() => setActiveTab(name.toLowerCase())}
            className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
              activeTab === name.toLowerCase()
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{name}</span>
          </button>
        ))}
      </nav>

      {/* Add user info at bottom of sidebar */}
      {userData && (
        <div className="p-4 border-t border-emerald-100">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-emerald-50">
            <Avatar className="h-10 w-10 border-2 border-emerald-200">
              <AvatarImage src="/placeholder.svg" alt={userData.fullName} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                {userData.fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-900 truncate">
                {userData.fullName}
              </p>
              <p className="text-xs text-emerald-600 truncate">
                {userData.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );

  const markNotificationAsRead = async (id: string) => {
    try {
      await axiosInstance.post(`/api/notifications/mark-as-read/${id}`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderHeader = () => (
    <header className="bg-white border-b border-emerald-100">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {userData ? (
              <div className="hidden md:flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-full">
                <User className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">
                  {userData.fullName}
                </span>
                {userData.roomNo && userData.roomNo.length > 0 && (
                  <Badge className="bg-white text-emerald-600 border-emerald-200">
                    Room {userData.roomNo.join(", ")}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="hidden md:block">
                <Skeleton className="h-8 w-[200px]" />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-emerald-600" />
                  {notifications.some((n) => !n.read) && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isNotificationsLoading ? (
                  <div className="p-4">
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification._id}
                      onClick={() => markNotificationAsRead(notification._id)}
                      className={`flex items-start space-x-2 ${
                        notification.read ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-emerald-900">
                          {notification.message}
                        </p>
                        <p className="text-xs text-emerald-500">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <p className="p-4 text-sm text-emerald-600">
                    No notifications
                  </p>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="/placeholder.svg"
                      alt={userData?.fullName || "User"}
                    />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {userData?.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {userData && (
                  <>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {userData.fullName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userData.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onSelect={() => setIsProfileOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );

  const renderFancyFeatures = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-6"
    >
      {/* Payment Visualization Section */}
      <Card className="bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600">
          <CardTitle className="text-white flex items-center justify-between">
            <span>Payment Overview</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-emerald-600"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>View Full Report</DropdownMenuItem>
                <DropdownMenuItem>Export Data</DropdownMenuItem>
                <DropdownMenuItem>Set Alerts</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Progress */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Lease Payment</span>
                  <span className="text-sm text-emerald-600">80%</span>
                </div>
                <Progress value={80} className="h-2 bg-emerald-100" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Electricity Bill</span>
                  <span className="text-sm text-emerald-600">65%</span>
                </div>
                <Progress value={65} className="h-2 bg-emerald-100" />
              </div>
            </div>

            {/* Payment Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-600">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-700">$2,450</p>
                <p className="text-xs text-emerald-500">
                  +12.5% from last month
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-600">Upcoming</p>
                <p className="text-2xl font-bold text-emerald-700">$850</p>
                <p className="text-xs text-emerald-500">Due in 7 days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="col-span-2">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription className="text-emerald-100">
                Frequently used features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    title: "Schedule Payment",
                    icon: UiCalendar,
                    description: "Set up your next payment",
                    color: "bg-emerald-400",
                  },
                  {
                    title: "Report Issue",
                    icon: AlertCircle,
                    description: "Submit maintenance request",
                    color: "bg-emerald-400",
                  },
                  {
                    title: "View Documents",
                    icon: FileText,
                    description: "Access your lease agreement",
                    color: "bg-emerald-400",
                  },
                  {
                    title: "Contact Support",
                    icon: MessageCircle,
                    description: "Get help with your queries",
                    color: "bg-emerald-400",
                  },
                ].map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 rounded-lg bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all duration-200"
                  >
                    <action.icon className="h-6 w-6 mb-2" />
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-emerald-100">
                      {action.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendar Widget - Updated */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Calendar</CardTitle>
            <CardDescription>Track your payment dates</CardDescription>
          </CardHeader>
          <CardContent>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="border rounded-md p-3"
              classNames={{
                day_selected: "bg-emerald-600 text-white",
                day_today: "bg-emerald-100",
                day: "rounded-md hover:bg-emerald-50",
              }}
              modifiers={{
                payment: [addDays(new Date(), 7), addDays(new Date(), 15)],
              }}
              modifiersStyles={{
                payment: {
                  border: "2px solid #059669",
                  borderRadius: "50%",
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors"
        onClick={() => setShowQuickActions(!showQuickActions)}
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-20 right-6 bg-white rounded-lg shadow-xl p-4 w-64"
          >
            <div className="space-y-2">
              {[
                { icon: DollarSign, label: "Make Payment" },
                { icon: FileText, label: "View Statement" },
                { icon: MessageCircle, label: "Contact Support" },
              ].map((item, index) => (
                <motion.button
                  key={index}
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-2 w-full p-2 hover:bg-emerald-50 rounded-lg"
                >
                  <item.icon className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Add this logging function
  const logPaymentDetails = (type: string, data: any) => {
    console.group(`Payment Details - ${type}`);
    console.log("Bill Data:", data);
    console.log("User Data:", userData);
    console.log("Payment Details:", {
      fullName: data.fullName,
      email: userData?.email,
      roomNo: data.roomNo,
      amount: data.billAmount,
      billId: data._id,
    });
    console.groupEnd();
  };

  return (
    <div className="min-h-screen bg-emerald-50/30">
      <div className="flex h-full">
        {renderSidebar()}
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderHeader()}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="hidden md:inline-flex bg-emerald-50/50 p-1 rounded-lg border border-emerald-100 mb-6">
                  {[
                    "Overview",
                    "Lease",
                    "Electricity",
                    "Maintenance",
                    "Rules",
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.toLowerCase()}
                      value={tab.toLowerCase()}
                      className="px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg hover:shadow-emerald-200 transition-all duration-200">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-50">
                          Total Due
                        </CardTitle>
                        <DollarSign className="h-5 w-5 text-emerald-100" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-white">
                          {isLoading.lease ? (
                            <Skeleton className="h-8 w-24 bg-emerald-400/50" />
                          ) : (
                            formatCurrency(
                              leasePayments.reduce(
                                (total, payment) => total + payment.price,
                                0
                              )
                            )
                          )}
                        </div>
                        <p className="text-xs text-emerald-100 mt-1">
                          +20.1% from last month
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg hover:shadow-emerald-200 transition-all duration-200">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-50">
                          Electricity Usage
                        </CardTitle>
                        <Zap className="h-5 w-5 text-emerald-100" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-white">
                          {isLoading.electricity ? (
                            <Skeleton className="h-8 w-24 bg-emerald-400/50" />
                          ) : (
                            `${electricityBills.reduce(
                              (total, bill) => total + bill.consumption,
                              0
                            )} kWh`
                          )}
                        </div>
                        <p className="text-xs text-emerald-100 mt-1">
                          -4% from last month
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-300 to-emerald-400 shadow-lg hover:shadow-emerald-200 transition-all duration-200">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-50">
                          Pending Maintenance
                        </CardTitle>
                        <Tool className="h-5 w-5 text-emerald-100" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-white">
                          {isLoading.maintenance ? (
                            <Skeleton className="h-8 w-24 bg-emerald-400/50" />
                          ) : (
                            maintenanceRequests.filter(
                              (request) => request.status === "Pending"
                            ).length
                          )}
                        </div>
                        <p className="text-xs text-emerald-100 mt-1">
                          {maintenanceRequests.length} total requests
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6">
                    <h2 className="text-xl font-semibold text-emerald-800 mb-4">
                      Recent Activity
                    </h2>
                    <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-0">
                        <ScrollArea className="h-[300px]">
                          {isLoading.lease ||
                          isLoading.electricity ||
                          isLoading.maintenance ? (
                            renderSkeleton()
                          ) : (
                            <ul className="divide-y divide-emerald-100">
                              {[
                                ...leasePayments,
                                ...electricityBills,
                                ...maintenanceRequests,
                              ]
                                .sort(
                                  (a, b) =>
                                    new Date(b.createdAt).getTime() -
                                    new Date(a.createdAt).getTime()
                                )
                                .slice(0, 5)
                                .map((item, index) => (
                                  <li
                                    key={index}
                                    className="px-4 py-3 hover:bg-emerald-50/50 transition-colors duration-150"
                                  >
                                    <div className="flex items-center space-x-4">
                                      <div className="flex-shrink-0">
                                        {"price" in item ? (
                                          <div className="p-2 rounded-full bg-emerald-100">
                                            <DollarSign className="h-5 w-5 text-emerald-600" />
                                          </div>
                                        ) : "billAmount" in item ? (
                                          <div className="p-2 rounded-full bg-emerald-100">
                                            <Zap className="h-5 w-5 text-emerald-600" />
                                          </div>
                                        ) : (
                                          <div className="p-2 rounded-full bg-emerald-100">
                                            <Tool className="h-5 w-5 text-emerald-600" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-emerald-900 truncate">
                                          {"price" in item
                                            ? "Lease Payment"
                                            : "billAmount" in item
                                            ? "Electricity Bill"
                                            : "Maintenance Request"}
                                        </p>
                                        <p className="text-sm text-emerald-600 truncate">
                                          {"price" in item
                                            ? formatCurrency(item.price)
                                            : "billAmount" in item
                                            ? formatCurrency(item.billAmount)
                                            : item.category}
                                        </p>
                                      </div>
                                      <div className="flex-shrink-0 text-sm text-emerald-500">
                                        {formatDate(item.createdAt)}
                                      </div>
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
{/* 
                <TabsContent value="lease">
                  <Card className="bg-white shadow-lg rounded-xl overflow-hidden">
                    <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-emerald-600">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Lease Payments
                        </CardTitle>
                      </div>
                      <CardDescription className="text-emerald-50">
                        Manage your monthly lease payments
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {isLoading.lease ? (
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
                                      <p className="text-sm text-gray-500">
                                        Room Number
                                      </p>
                                      <p className="text-lg font-semibold">
                                        {payment.roomNo.join(", ")}
                                      </p>
                                    </div>
                                    <Badge
                                      className={getStatusColor(
                                        payment.paymentStatus
                                      )}
                                    >
                                      {payment.paymentStatus}
                                    </Badge>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Due Date
                                      </p>
                                      <p className="text-base font-medium">
                                        {formatDate(payment.paymentDueDate)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-gray-500">
                                        Amount
                                      </p>
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
                                      disabled={
                                        payment.paymentStatus === "Paid"
                                      }
                                      billDetails={{
                                        fullName: payment.fullName,
                                        email: userData?.email,
                                        roomNo: payment.roomNo,
                                      }}
                                      onSuccess={() => {
                                        fetchLeasePayments();
                                        toast({
                                          title: "Success",
                                          description:
                                            "Payment initiated successfully",
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
                          <p className="text-gray-600">
                            No lease payments found
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent> */}
             <TabsContent value="lease">
              <LeasePayments />
             </TabsContent>
                  
               

                <TabsContent value="electricity">
                  <Card className="bg-white shadow-lg rounded-xl overflow-hidden">
                    <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-emerald-600">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Electricity Bills
                        </CardTitle>
                      </div>
                      <CardDescription className="text-emerald-50">
                        Manage your electricity payments
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {isLoading.electricity ? (
                        renderSkeleton()
                      ) : electricityBills.length > 0 ? (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-4">
                            {electricityBills.map((bill) => {
                              // Format the bill amount to match the expected format
                              const formattedBillAmount = parseFloat(
                                bill.billAmount.toString()
                              ).toFixed(2);

                              // Log payment details for debugging
                              console.group("Electricity Bill Payment Details");
                              console.log("Bill:", bill);
                              console.log(
                                "Formatted Amount:",
                                formattedBillAmount
                              );
                              console.log("User Data:", userData);
                              console.groupEnd();

                              return (
                                <motion.div
                                  key={bill._id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-white rounded-lg border border-emerald-100 p-6 hover:shadow-md transition-all duration-200"
                                >
                                  <div className="flex flex-col space-y-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Room Number
                                        </p>
                                        <p className="text-lg font-semibold">
                                          {bill.roomNo}
                                        </p>
                                      </div>
                                      <Badge
                                        className={getStatusColor(
                                          bill.paymentStatus
                                        )}
                                      >
                                        {bill.paymentStatus || "Pending"}
                                      </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Previous Reading
                                        </p>
                                        <p className="text-base font-medium">
                                          {bill.previousReading} kWh
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Current Reading
                                        </p>
                                        <p className="text-base font-medium">
                                          {bill.currentReading} kWh
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Consumption
                                        </p>
                                        <p className="text-base font-medium">
                                          {bill.consumption} kWh
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm text-gray-500">
                                          Amount Due
                                        </p>
                                        <p className="text-2xl font-bold text-emerald-600">
                                          {formatCurrency(bill.billAmount)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex justify-end mt-4">
                                      <PaymentButton
                                        type="electricity"
                                        billId={bill._id}
                                        amount={parseFloat(bill.billAmount)}
                                        disabled={bill.paymentStatus === "Paid"}
                                        billDetails={{
                                          fullName: userData?.fullName || "", // Use user's full name from userData
                                          email: userData?.email || "",
                                          roomNo: bill.roomNo,
                                        }}
                                        onSuccess={() => {
                                          console.log(
                                            "Electricity payment success for bill:",
                                            bill._id
                                          );
                                          fetchElectricityBills();
                                          toast({
                                            title: "Success",
                                            description:
                                              "Payment initiated successfully",
                                          });
                                        }}
                                        onError={(error) => {
                                          console.error(
                                            "Electricity payment error:",
                                            {
                                              billId: bill._id,
                                              error,
                                              billDetails: {
                                                fullName: userData?.fullName,
                                                email: userData?.email,
                                                roomNo: bill.roomNo,
                                                amount: bill.billAmount,
                                              },
                                            }
                                          );
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
                              );
                            })}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-10">
                          <Zap className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">
                            No electricity bills found
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="maintenance">
  <Maintenance />
</TabsContent>
{/* 
                <TabsContent value="maintenance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Maintenance Requests</CardTitle>
                      <CardDescription>
                        Submit and view your maintenance requests
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={handleMaintenanceSubmit}
                        className="space-y-4 mb-6 bg-white p-6 rounded-lg border border-emerald-100"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label
                              htmlFor="description"
                              className="text-emerald-700"
                            >
                              Description
                            </Label>
                            <Textarea
                              id="description"
                              value={newMaintenanceRequest.description}
                              onChange={(e) =>
                                setNewMaintenanceRequest({
                                  ...newMaintenanceRequest,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Describe the issue..."
                              className="min-h-[100px] border-emerald-200 focus:ring-emerald-500"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="category"
                              className="text-emerald-700"
                            >
                              Category
                            </Label>
                            <Select
                              value={newMaintenanceRequest.category}
                              onValueChange={(value) =>
                                setNewMaintenanceRequest({
                                  ...newMaintenanceRequest,
                                  category: value as any,
                                })
                              }
                            >
                              <SelectTrigger className="border-emerald-200 focus:ring-emerald-500">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  "Electrical",
                                  "Water",
                                  "Infrastructure",
                                  "HVAC",
                                  "Other",
                                ].map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto"
                        >
                          Submit Request
                        </Button>
                      </form>

                      {isLoading.maintenance ? (
                        renderSkeleton()
                      ) : maintenanceRequests.length > 0 ? (
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-4">
                            {maintenanceRequests.map((request) => (
                              <Card key={request._id}>
                                <CardHeader>
                                  <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">
                                      {request.category}
                                    </CardTitle>
                                    <Badge
                                      variant="outline"
                                      className={getStatusColor(request.status)}
                                    >
                                      {request.status}
                                    </Badge>
                                  </div>
                                  <CardDescription>
                                    {formatDate(request.createdAt)}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <p>{request.description}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <p>No maintenance requests found.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent> */}

                <TabsContent value="rules">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rules & Regulations</CardTitle>
                      <CardDescription>
                        Important guidelines for tenants
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading.rules ? (
                        renderSkeleton()
                      ) : rulesAndRegulations ? (
                        <ScrollArea className="h-[400px]">
                          <div
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: rulesAndRegulations,
                            }}
                          />
                        </ScrollArea>
                      ) : (
                        <p>No rules and regulations found.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[700px] lg:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>
              View and edit your profile information
            </DialogDescription>
          </DialogHeader>
          <Profile />
        </DialogContent>
      </Dialog>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 z-90 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4 mt-4">
            {["Overview", "Lease", "Electricity", "Maintenance", "Rules"].map(
              (item) => (
                <Button
                  key={item.toLowerCase()}
                  variant={
                    activeTab === item.toLowerCase() ? "secondary" : "ghost"
                  }
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab(item.toLowerCase());
                    setIsSidebarOpen(false);
                  }}
                >
                  {item === "Overview" && <Home className="mr-2 h-5 w-5" />}
                  {item === "Lease" && <DollarSign className="mr-2 h-5 w-5" />}
                  {item === "Electricity" && <Zap className="mr-2 h-5 w-5" />}
                  {item === "Maintenance" && <Tool className="mr-2 h-5 w-5" />}
                  {item === "Rules" && <Book className="mr-2 h-5 w-5" />}
                  {item}
                </Button>
              )
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
