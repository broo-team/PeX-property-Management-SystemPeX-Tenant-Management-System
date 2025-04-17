import React from "react";
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
import { Bell, User, LogOut, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

// Define a Notification type for clarity.
export type Notification = {
  _id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

// Header component props excluding userData since it's fetched from context.
interface HeaderProps {
  notifications?: Notification[];
  isNotificationsLoading?: boolean;
  formatDate?: (date: string) => string;
  markNotificationAsRead?: (id: string) => void;
  handleLogout?: () => void;
  setIsProfileOpen?: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  notifications = [],
  isNotificationsLoading = false,
  formatDate = (date: string) => new Date(date).toLocaleString(),
  markNotificationAsRead = (id: string) => console.log(`Notification ${id} marked as read`),
  handleLogout = () => console.log("Default logout"),
  setIsProfileOpen = (open: boolean) => console.log("Default set profile open:", open),
}) => {
  // Fetch tenant info from AuthContext
  const { user } = useAuth();
  const fullName = user?.tenant?.full_name || "Guest";
  const email = user?.tenant?.email || null;
  const phone = user?.tenant?.phone || null;
  const roomNo = user?.tenant?.roomName ? [user.tenant.roomName] : [];

  return (
    <header className="bg-white border-b border-emerald-100">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section: Display user info */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-full">
              <User className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">
                {fullName}
              </span>
              {roomNo.length > 0 && (
                <Badge className="bg-white text-emerald-600 border-emerald-200">
                  Room {roomNo.join(", ")}
                </Badge>
              )}
            </div>
          </div>

          {/* Right section: Notifications and Profile dropdown */}
          <div className="flex items-center space-x-4">
            {/* Notifications Dropdown */}
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
                      <AlertCircle className="h-5 w-5 text-emerald-600" />
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

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="/placeholder.svg"
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
                      {email || phone || "N/A"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
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
};

export default Header;