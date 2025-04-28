import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { format } from "date-fns";
import { User, LogOut, UserPlus, Settings, Globe, Bell, Search, Menu } from 'lucide-react';
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


const languages = [
  { code: 'en', name: 'English' },
  { code: 'am', name: 'አማርኛ' }
];

const Navbar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openModal, setOpenModal] = useState<string | null>(null); // Explicitly type modal name or null
  const [userData, setUserData] = useState<FrontendUser | null>(null); // Use the defined interface
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(0); // Assuming notifications count
  const navigate = useNavigate();
  const { role, logout } = useAuth(); // Assuming useAuth provides role and logout
  const { t, i18n } = useTranslation(); // Assuming react-i18next setup

  // Effect to set initial language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]); // Depend on i18n instance

  // Effect to update date and fetch user data
  useEffect(() => {
    // Set up interval for date update
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);

    // Function to fetch user data
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        // Use the correct backend endpoint /api/creators/me
        const response = await axiosInstance.get('/api/creators/me');

        if (response.status === 200 && response.data.creator) {
          // Backend returns data in response.data.creator
          const backendUser = response.data.creator;
          // Map backend snake_case to frontend camelCase
          const frontendUser: FrontendUser = {
            id: backendUser.id,
            fullName: backendUser.full_name,
            email: backendUser.email,
            phoneNumber: backendUser.phone_number,
            location: backendUser.location,
            // Add other fields if your backend returns them, e.g., profileImage
            // profileImage: backendUser.profile_image,
          };
          setUserData(frontendUser);
        } else {
          // Handle cases where status is 200 but data structure is unexpected
          console.warn('User data not found in expected format:', response.data);
          setUserData(null); // Clear data if unexpected
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setUserData(null); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData(); // Fetch data when component mounts

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Effect to simulate fetching notifications (runs once on mount)
  useEffect(() => {
    // Simulating fetching notifications - replace with actual API call
    // For now, it sets a random number of notifications
    setNotifications(Math.floor(Math.random() * 5));
    // Add your actual notification fetching logic here
  }, []); // Empty dependency array

  const closeModal = () => setOpenModal(null);

  const handleLogout = async () => {
    // Assuming useAuth.logout handles clearing token and state
    await logout();
    navigate("/"); // Navigate to login or home page after logout
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
    // No need to force re-render with setCurrentDate, i18n change usually triggers update
    // If updates are slow, ensure components using t are correctly re-rendering or consider context
  };

  // Correctly type the date parameter
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    // Use i18n.language for locale
    return new Intl.DateTimeFormat(i18n.language, options).format(date);
  };


  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-emerald-100 backdrop-blur-sm bg-white/80 supports-[backdrop-filter]:bg-white/80 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center -ml-28"> {/* Check this margin, seems large */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center">
                {/* Ensure /ex.png path is correct */}
                <img src="/ex.png" alt="Logo" className="h-8 w-8" />
              </div>
              <span className="ml text-xl font-light bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent mt-3">
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
                  {/* Use mapped fullName */}
                  {t('welcome', { name: userData.fullName })}
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

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-emerald-600" />
              {/* Check if notifications is greater than 0 before rendering Badge */}
              {notifications > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">
                  {notifications}
                </Badge>
              )}
            </Button>

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
                {role === "admin" && (
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
      {/* Added conditional rendering based on isMobileMenuOpen */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-emerald-100 py-2">
          <div className="px-4 space-y-2">
            <Input
              type="text"
              placeholder={t('search')}
              className="w-full pl-10 pr-4 py-2 rounded-full border-gray-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
            />
            {/* Use mapped userData properties */}
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
          </div>
        </div>
      )}


      {/* Modals */}
      {/* Render modals conditionally based on openModal state */}
      <Profile
        isOpen={openModal === "profile"}
        onClose={closeModal}
      />
      {/* Assuming CreateAccount and ManageAccount also accept isOpen and onClose props */}
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