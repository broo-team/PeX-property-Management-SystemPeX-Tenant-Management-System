import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { format } from "date-fns";
import { User, LogOut, UserPlus, Settings, Globe, Bell, Search, Menu, CheckCircle } from 'lucide-react'; // Add CheckCircle icon
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import CreateAccount from "./Account/createAccount"; // Assuming this exists
import ManageAccount from "./Account/manageAccount"; // Assuming this exists
import Profile from "./Account/profile"; // Corrected Profile component
import { useAuth } from "@/context/AuthContext"; // Assuming this exists
import axiosInstance from "@/services/authService"; // Assumes your axios setup

// Define the structure of the user data expected AFTER fetching and mapping
interface FrontendUser {
  id: number; // Assuming id is a number
  fullName: string; // Mapped from full_name
  email: string;
  phoneNumber?: string; // Mapped from phone_number, might be optional
  location?: string; // Might be optional
  profileImage?: string; // Assuming this might exist in backend data
}

// Define the structure of a notification from the backend
interface FrontendNotification {
    id: number;
    type: string; // e.g., 'new_building', 'end_date_reminder'
    title: string;
    message: string;
    is_read: boolean; // Note: using snake_case to match potential backend db column
    created_at: string; // Assuming timestamp string
    related_entity_type?: string;
    related_entity_id?: number;
}


const languages = [
  { code: 'en', name: 'English' },
  { code: 'am', name: 'አማርኛ' }
];

// Polling interval (in milliseconds) - Adjust as needed, don't make it too short!
const NOTIFICATION_POLLING_INTERVAL = 60000; // 1 minute (60000 ms) - CHANGE FOR PRODUCTION

const Navbar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [userData, setUserData] = useState<FrontendUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // notifications state will now represent the *unread count*
  const [notificationsCount, setNotificationsCount] = useState(0);
  // New state to hold the list of all notifications
  const [notificationList, setNotificationList] = useState<FrontendNotification[]>([]);

  const navigate = useNavigate();
  const { role, logout, user } = useAuth(); // Assuming useAuth provides role, logout, and user (with ID)
  const { t, i18n } = useTranslation();

  // Effect to set initial language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  // Effect to update date
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Function to fetch user data (remains the same)
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/api/creators/me'); // Assuming this endpoint fetches the logged-in user

      if (response.status === 200 && response.data.creator) {
        const backendUser = response.data.creator;
        const frontendUser: FrontendUser = {
          id: backendUser.id,
          fullName: backendUser.full_name,
          email: backendUser.email,
          phoneNumber: backendUser.phone_number,
          location: backendUser.location,
          // profileImage: backendUser.profile_image, // Uncomment if available
        };
        setUserData(frontendUser);
      } else {
        console.warn('User data not found in expected format:', response.data);
        setUserData(null);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencies: [] because it fetches the *current* user

  // Effect to fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]); // Dependency: fetchUserData memoized by useCallback


  // --- NEW/MODIFIED Effect for fetching notifications via polling ---
  const fetchNotifications = useCallback(async () => {
      // Only fetch if the user is logged in (check for user or user ID from AuthContext)
      // You might need to adjust this check based on your AuthContext structure
      if (!user || !user.id) {
          console.log("User not logged in, skipping notification fetch.");
          setNotificationList([]);
          setNotificationsCount(0);
          return;
      }
    try {
      // Assuming a backend endpoint like GET /api/notifications/me exists
      // that returns notifications for the logged-in user
      const response = await axiosInstance.get('/api/notifications/me');

      if (response.status === 200 && Array.isArray(response.data.notifications)) {
        const fetchedNotifications: FrontendNotification[] = response.data.notifications;
        setNotificationList(fetchedNotifications);
        // Calculate unread count
        const unreadCount = fetchedNotifications.filter(notif => !notif.is_read).length;
        setNotificationsCount(unreadCount);
      } else {
        console.warn('Notifications data not found in expected format:', response.data);
        setNotificationList([]);
        setNotificationsCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Optionally clear notifications or show an error state
      // setNotificationList([]);
      // setNotificationsCount(0);
    }
  }, [user]); // Dependency: `user` from AuthContext to know when user logs in/out

  // Effect to set up polling for notifications
  useEffect(() => {
      fetchNotifications(); // Fetch immediately on mount/user change

      // Set up the interval ONLY if the user is logged in
      let pollingTimer: NodeJS.Timeout | null = null;
      if (user && user.id) {
          pollingTimer = setInterval(() => {
              fetchNotifications(); // Poll periodically
          }, NOTIFICATION_POLLING_INTERVAL);
      }


      // Cleanup interval on component unmount or if user changes/logs out
      return () => {
          if (pollingTimer) {
              clearInterval(pollingTimer);
          }
      };
  }, [fetchNotifications, user]); // Dependencies: fetchNotifications and user


  // Function to mark all notifications as read (placeholder)
  const markAllAsRead = async () => {
      // Check if user is logged in before attempting to mark as read
      if (!user || !user.id) {
          console.log("User not logged in, cannot mark notifications as read.");
          return;
      }

      // Add API call to backend to mark all notifications for this user as read
      console.log("Attempting to mark all notifications as read for user:", user.id);
      // Assuming a backend endpoint like PATCH /api/notifications/mark-all-read
      try {
          await axiosInstance.patch('/api/notifications/mark-all-read');
          // Update frontend state immediately after successful API call
          setNotificationList(prevList =>
              prevList.map(notif => ({ ...notif, is_read: true }))
          );
          setNotificationsCount(0); // All are now read
          console.log("Notifications marked as read.");
      } catch (error) {
          console.error("Failed to mark notifications as read:", error);
          // Handle error (e.g., show a toast message)
      }
  };

   // Function to mark a single notification as read (optional)
   const markSingleAsRead = async (notificationId: number) => {
       if (!user || !user.id) return;
       console.log("Attempting to mark notification", notificationId, "as read...");
       try {
           // Assuming a backend endpoint like PATCH /api/notifications/:id/mark-read
           await axiosInstance.patch(`/api/notifications/${notificationId}/mark-read`);
           // Update frontend state
           setNotificationList(prevList =>
               prevList.map(notif =>
                   notif.id === notificationId ? { ...notif, is_read: true } : notif
               )
           );
           setNotificationsCount(prevCount => Math.max(0, prevCount - 1)); // Decrement count, ensure it doesn't go below 0
           console.log("Notification", notificationId, "marked as read.");
       } catch (error) {
           console.error("Failed to mark notification", notificationId, "as read:", error);
       }
   };


  const closeModal = () => setOpenModal(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  const formatDate = (date: Date | string) => {
    try {
        // Attempt to parse string dates if necessary
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
            // Fallback for invalid dates, maybe try parsing common string formats manually if needed
             // Or just return a consistent error string
             return "Invalid Date";
        }
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        return new Intl.DateTimeFormat(i18n.language, options).format(dateObj);
    } catch (error) {
        console.error("Error formatting date:", date, error);
        return "Invalid Date"; // Or return a placeholder
    }
  };


  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-emerald-100 backdrop-blur-sm bg-white/80 supports-[backdrop-filter]:bg-white/80 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          {/* Adjusted margin to a more standard value like ml-4 or just remove it if not needed */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center">
                <img src="/ex.png" alt="Logo" className="h-8 w-8" /> {/* Ensure /ex.png path is correct */}
              </div>
              <span className="ml-2 text-xl font-light bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent mt-0"> {/* Adjusted ml and mt */}
                {t('PeX Admin')}
              </span>
            </Link>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="w-full relative">
              <Input
                type="text"
                placeholder={t('search')}
                className="w-full pl-10 pr-4 py-2 rounded-full border-gray-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* User Name Display - Hidden on mobile */}
            {!isLoading && userData && (
              <div className="hidden lg:flex items-center space-x-2 bg-emerald-50/80 px-3 py-1.5 rounded-full animate-fadeIn backdrop-blur-sm">
                <User className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {t('welcome', { name: userData.fullName })} {/* Use mapped fullName */}
                </span>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="hidden lg:flex items-center space-x-2 bg-emerald-50/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <div className="h-4 w-32 bg-emerald-200 animate-pulse rounded-full"></div>
              </div>
            )}

            {/* Date Display - Hidden on mobile */}
            <div className="hidden lg:flex items-center px-3 py-1.5 rounded-full bg-emerald-50/80 text-emerald-700 backdrop-blur-sm">
              <span className="text-sm font-medium">
                {formatDate(currentDate)}
              </span>
            </div>

            {/* Notifications Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5 text-emerald-600" />
                        {/* Use notificationsCount for the badge */}
                        {/* Render badge only if count is greater than 0 */}
                        {notificationsCount > 0 && (
                            <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">
                                {notificationsCount}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 mt-2 max-h-96 overflow-y-auto">
                    <DropdownMenuLabel>Notifications ({notificationsCount})</DropdownMenuLabel> {/* Show count in label */}
                    <DropdownMenuSeparator />

                    {notificationList.length === 0 ? (
                        <DropdownMenuItem disabled>
                            No notifications yet.
                        </DropdownMenuItem>
                    ) : (
                        notificationList.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                // Add styling for read/unread notifications
                                className={`whitespace-normal h-auto py-2 cursor-pointer ${!notification.is_read ? 'bg-emerald-50 font-medium' : ''}`}
                                // Optional: Add onClick handler to navigate or show detail
                                // onClick={() => handleNotificationClick(notification)}
                                // Optional: Mark as read when clicked (if not already read)
                                onClick={() => !notification.is_read && markSingleAsRead(notification.id)}
                            >
                                <div className="flex flex-col">
                                    <div className="text-sm font-semibold text-emerald-700">{notification.title}</div>
                                    <div className={`text-xs ${!notification.is_read ? 'text-emerald-600' : 'text-gray-500'}`}>{notification.message}</div>
                                    <div className="text-xs text-gray-400 mt-1">{formatDate(notification.created_at)}</div>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}

                    {/* Option to Mark All as Read */}
                    {notificationList.length > 0 && notificationsCount > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            {/* Only show the option if there are unread notifications */}
                            { notificationsCount > 0 && (
                                <DropdownMenuItem onClick={markAllAsRead} className="text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    <span>Mark all as read</span>
                                </DropdownMenuItem>
                            )}
                        </>
                    )}

                </DropdownMenuContent>
            </DropdownMenu>


            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-emerald-50/80">
                  <Globe className="h-5 w-5 text-emerald-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 mt-2">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`hover:bg-emerald-50 ${i18n.language === lang.code ? 'bg-emerald-100' : ''}`}
                  >
                    {t(`languageSwitcher.${lang.code}`)} {/* Assuming translation keys like languageSwitcher.en */}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-emerald-50/80">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={userData?.profileImage || "/placeholder.svg"}
                      alt={userData?.fullName || "User"}
                    />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {userData?.fullName
                        // Safely split and join for initials, handle cases with no spaces
                        ? userData.fullName.split(" ").map(n => n ? n[0] : '').join("").toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 mt-2">
                {!isLoading && userData && (
                  <>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        {/* Use mapped fullName and phoneNumber */}
                        <p className="text-sm font-medium text-emerald-700">
                          {userData.fullName}
                        </p>
                        <p className="text-xs text-emerald-600">
                          {userData.email}
                        </p>
                        {/* Conditionally render phone number if it exists */}
                        {userData.phoneNumber && (
                          <p className="text-xs text-emerald-500">
                            {userData.phoneNumber}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Conditionally render admin links */}
                {role === "admin" && ( // Assuming 'admin' role check
                  <>
                    {/* Changed modal names to match the components being opened */}
                    <DropdownMenuItem
                      onClick={() => setOpenModal("createAccount")}
                      className="hover:bg-emerald-50"
                    >
                      <UserPlus className="mr-2 h-4 w-4 text-emerald-600" />
                      <span>{t('createAccount')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setOpenModal("manageAccount")}
                      className="hover:bg-emerald-50"
                    >
                      <Settings className="mr-2 h-4 w-4 text-emerald-600" />
                      <span>{t('manageAccount')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem
                  onClick={() => setOpenModal("profile")}
                  className="hover:bg-emerald-50"
                >
                  <User className="mr-2 h-4 w-4 text-emerald-600" />
                  <span>{t('profile')}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-6 w-6 text-emerald-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-emerald-100 py-2">
          <div className="px-4 space-y-2">
            <Input
              type="text"
              placeholder={t('search')}
              className="w-full pl-10 pr-4 py-2 rounded-full border-gray-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
            />
            {!isLoading && userData && (
              <div className="flex items-center space-x-2 bg-emerald-50/80 px-3 py-1.5 rounded-full">
                <User className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {t('welcome', { name: userData.fullName })}
                </span>
              </div>
            )}
            <div className="flex items-center px-3 py-1.5 rounded-full bg-emerald-50/80 text-emerald-700">
              <span className="text-sm font-medium">
                {formatDate(currentDate)}
              </span>
            </div>
             {/* Mobile notification link/button can be added here if needed */}
             {/* Example: */}
             {/* <Button variant="ghost" className="w-full justify-start pl-3 pr-4 py-2 rounded-full text-emerald-700 hover:bg-emerald-50">
                <Bell className="mr-2 h-5 w-5" />
                Notifications ({notificationsCount})
             </Button> */}
          </div>
        </div>
      )}

      {/* Modals */}
      <Profile
        isOpen={openModal === "profile"}
        onClose={closeModal}
      />
      <CreateAccount
        isOpen={openModal === "createAccount"}
        onClose={closeModal}
      />
      <ManageAccount
        isOpen={openModal === "manageAccount"}
        onClose={closeModal}
      />

    </nav>
  );
};

export default Navbar;