import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import moment from "moment";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, User, LogOut, AlertCircle, Wallet, Zap, Hammer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

export type Notification = {
  _id: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: "general" | "billing" | "utility" | "maintenance";
  billId?: string;
  utilityId?: string;
  maintenanceId?: string;
};

interface LeasePaymentInfo {
  _id: string;
  billId?: string;
  paymentStatus: string;
  paymentDueDate: string;
  totalDue: number;
}

interface UtilityRecord {
  id: string;
  bill_date: string;
  due_date: string;
  cost: number;
  penalty: number;
  utility_status: string;
  utility_type: string;
  tenant_id: number;
}

interface MaintenanceRequest {
  id: number;
  issueDescription: string;
  category: string;
  status: string;
  createdAt: string;
  reason?: string;
}

interface HeaderProps {
  handleLogout?: () => void;
  setIsProfileOpen?: (open: boolean) => void;
  navigateToPayments?: () => void;
}

const API_BASE_URL = "http://localhost:5000/api";

const Header: React.FC<HeaderProps> = ({
  handleLogout = () => console.log("Default logout"),
  setIsProfileOpen = (open: boolean) => console.log("Default set profile open:", open),
  navigateToPayments,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('readNotificationIds');
    return stored ? JSON.parse(stored) : [];
  });

  const fullName = user?.tenant?.full_name || "Guest";
  const email = user?.tenant?.email || null;
  const phone = user?.tenant?.phone || null;
  const roomNo = user?.tenant?.roomName ? [user.tenant.roomName] : [];
  const tenantId = user?.tenant?.tenant_id;

  const fetchNotificationsAndData = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false);
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    try {
      const [tenantRes, utilityRes, maintenanceRes, rentRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/tenants`),
        axios.get(`${API_BASE_URL}/utilities/tenant_utility_usage`),
        axios.get(`${API_BASE_URL}/maintenance`),
        axios.get(`${API_BASE_URL}/rent`),
      ]);

      let combinedNotifications: Notification[] = [];
      const tenants = tenantRes.data;
      const activeTenant = tenants.find(
        (tenant: any) => Number(tenant.terminated) === 0 && tenant.tenant_id === tenantId
      );

      if (activeTenant) {
        // Process Utilities
        const utilities = utilityRes.data.filter((u: any) => u.tenant_id === tenantId);
        utilities.forEach((utility: any) => {
          const notificationId = `utility_${utility.id}`;
          const dueDate = moment(utility.due_date);
          const isOverdue = dueDate.isBefore(moment(), "day");
          const message = isOverdue
            ? `Utility bill for ${utility.utility_type.toUpperCase()} is overdue (Due: ${dueDate.format("MMM D")}). Amount: ${utility.cost}`
            : `Utility bill for ${utility.utility_type.toUpperCase()} is due soon (${dueDate.format("MMM D")}). Amount: ${utility.cost}`;
          combinedNotifications.push({
            _id: notificationId,
            message,
            createdAt: utility.bill_date,
            read: readNotificationIds.includes(notificationId),
            type: "utility",
            utilityId: utility.id.toString(),
          });
        });

        // Process Maintenance
        const maintenanceIssues = maintenanceRes.data.filter((m: any) => m.tenant_id === tenantId);
        maintenanceIssues.forEach((issue: any) => {
          const notificationId = `maintenance_${issue.id}`;
          const status = issue.status.toLowerCase();
          const message =
            status === "pending"
              ? `Maintenance issue reported: ${issue.issueDescription} (${issue.category})`
              : status === "resolved"
              ? `Maintenance issue resolved: ${issue.issueDescription} (${issue.category})`
              : `Maintenance issue in progress: ${issue.issueDescription} (${issue.category})`;
          combinedNotifications.push({
            _id: notificationId,
            message,
            createdAt: issue.createdAt,
            read: readNotificationIds.includes(notificationId),
            type: "maintenance",
            maintenanceId: issue.id.toString(),
          });
        });

        // Process Rent
        const rents = rentRes.data.filter((r: any) => r.tenant_id === tenantId);
        rents.forEach((rent: any) => {
          const notificationId = `rent_${rent.id}`;
          const dueDate = moment(rent.due_date);
          const isOverdue = dueDate.isBefore(moment(), "day");
          const paymentStatus = rent.payment_status?.toLowerCase();
          if (paymentStatus !== "paid") {
            const message = isOverdue
              ? `Rent payment for Room ${activeTenant.roomName} is overdue (Due: ${dueDate.format("MMM D")}). Amount: ${rent.amount}`
              : `Rent payment for Room ${activeTenant.roomName} is due soon (${dueDate.format("MMM D")}). Amount: ${rent.amount}`;
            combinedNotifications.push({
              _id: notificationId,
              message,
              createdAt: rent.created_at || rent.due_date,
              read: readNotificationIds.includes(notificationId),
              type: "billing",
              billId: rent.id.toString(),
            });
          }
        });
      }

      combinedNotifications.sort((a, b) =>
        moment(b.createdAt).diff(moment(a.createdAt))
      );

      setNotifications(combinedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Could not fetch notifications.",
        variant: "destructive",
      });
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, readNotificationIds]);

  useEffect(() => {
    fetchNotificationsAndData();
    const intervalId = setInterval(fetchNotificationsAndData, 60000);
    return () => clearInterval(intervalId);
  }, [fetchNotificationsAndData]);

  const formatDate = (date: string) => moment(date).fromNow();

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === "billing" && navigateToPayments) {
      navigateToPayments();
    } else if (notification.type === "maintenance") {
      console.log(`View maintenance issue ${notification.maintenanceId}`);
    }

    if (!readNotificationIds.includes(notification._id)) {
      const newReadIds = [...readNotificationIds, notification._id];
      setReadNotificationIds(newReadIds);
      localStorage.setItem('readNotificationIds', JSON.stringify(newReadIds));
    }

    setNotifications(prev =>
      prev.map(n =>
        n._id === notification._id ? { ...n, read: true } : n
      )
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-white border-b border-emerald-100 shadow-sm sticky top-0 z-50">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <User className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                {fullName}
              </span>
              {roomNo.length > 0 && (
                <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-300 font-normal">
                  Room {roomNo.join(", ")}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-emerald-100">
                  <Bell className="h-5 w-5 text-emerald-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-[80vh] overflow-y-auto">
                <DropdownMenuLabel className="flex justify-between items-center">
                  <span>Notifications</span>
                  {isLoading && <Skeleton className="h-4 w-4 rounded-full animate-spin" />}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading && notifications.length === 0 ? (
                  <div className="p-2 space-y-3">
                    {[...Array(2)].map((_, index) => (
                      <div key={index} className="flex space-x-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification._id}
                      onSelect={() => handleNotificationClick(notification)}
                      className={`flex items-start space-x-3 p-3 cursor-pointer hover:bg-emerald-50 ${
                        notification.read ? "opacity-60" : "font-medium"
                      }`}
                      style={{ whiteSpace: "normal", height: "auto" }}
                    >
                      {notification.type === "billing" ? (
                        <Wallet className={`h-5 w-5 mt-0.5 ${notification.read ? "text-gray-400" : "text-blue-500"}`} />
                      ) : notification.type === "maintenance" ? (
                        <Hammer className={`h-5 w-5 mt-0.5 ${notification.read ? "text-gray-400" : "text-yellow-500"}`} />
                      ) : (
                        <AlertCircle className={`h-5 w-5 mt-0.5 ${notification.read ? "text-gray-400" : "text-yellow-500"}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notification.read ? "text-gray-700" : "text-gray-900"}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 ml-auto flex-shrink-0 mt-1"></span>
                      )}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <p className="p-4 text-sm text-center text-gray-500">
                    No notifications yet.
                  </p>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border border-emerald-200">
                    <AvatarImage
                      src={user?.tenant?.avatarUrl || "/placeholder.svg"}
                      alt={fullName || "User"}
                    />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {fullName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {email || phone || "No contact info"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsProfileOpen(true)} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;