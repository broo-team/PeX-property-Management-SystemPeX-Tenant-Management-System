"use client"; // Keep this if you are using Next.js App Router

import React, { useState, useEffect } from 'react';
import axiosInstance from "@/services/authService"; // Assumes you have axios setup for API requests
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import Modal from "react-modal"; // Import react-modal
import { X, Loader2, AlertCircleIcon } from 'lucide-react'; // Import Loader2, AlertCircleIcon
import { Toaster } from '@/components/ui/toaster';

// Ensure Modal.setAppElement('#root'); is called ONLY ONCE in your main index.tsx file (or _app.tsx for Next.js Pages Router)

// Updated UserProfile interface to match backend snake_case keys for state consistency
interface UserProfile {
  id: number; // Assuming id is a number based on backend insertId
  full_name: string; // Using backend naming for state consistency
  email: string;
  phone_number?: string; // Made optional as it might be null/empty
  location?: string; // Made optional as it might be null/empty
  // Add any other fields returned by the backend /api/creators/me endpoint
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Profile: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  // Initialize state with backend naming for easier mapping
  const [user, setUser] = useState<UserProfile>({
    id: 0,
    full_name: '',
    email: '',
    phone_number: undefined, // Initialize optional fields
    location: undefined,  // Initialize optional fields
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); // Loading state for initial fetch


  // Fetch user profile data from the backend when the modal opens
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isOpen) {
        // Optional: Clear user data when modal closes to prevent seeing old data briefly
        setUser({
            id: 0,
            full_name: '',
            email: '',
            phone_number: undefined,
            location: undefined,
        });
        setIsLoadingProfile(false); // Ensure loading is off if closing
        return; // Only fetch if the modal is open
      }

      setIsLoadingProfile(true); // Start loading

      try {
        // Use the correct backend endpoint /api/creators/me
        const response = await axiosInstance.get('/api/creators/me');

        if (response.status === 200 && response.data.creator) { // Added check for response.data.creator
          // The backend returns data in response.data.creator
          setUser(response.data.creator);
            // console.log("Fetched user data:", response.data.creator); // Log fetched user data - keep for debugging if needed
        } else {
            console.warn('User data not found in expected format:', response.data);
          toast({
            title: "Error",
            description: "Failed to fetch user profile.",
            variant: "destructive",
          });
          // Clear user state or set a default if fetch fails
          setUser({ id: 0, full_name: '', email: '', phone_number: undefined, location: undefined });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        const errorMessage = (error as any).response?.data?.message || "An error occurred while fetching profile data.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        // Clear user state or set a default on error
        setUser({ id: 0, full_name: '', email: '', phone_number: undefined, location: undefined });
      } finally {
        setIsLoadingProfile(false); // End loading
      }
    };

    fetchUserProfile();
  }, [isOpen]); // Depend on isOpen so it refetches when the modal opens

  // Renamed to avoid confusion, handles changes specifically in the settings tab inputs
  const handleSettingsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Update state using backend naming convention
    setUser(prevUser => ({ ...prevUser, [name]: value }));
  }


  const handleSettingsSave = async () => {
    // Prevent saving if user data hasn't been fetched yet (id is 0)
    if (!user.id) {
      toast({
        title: "Error",
        description: "User data not loaded yet. Cannot save changes.",
        variant: "destructive",
      });
      return;
    }

    // console.log("Attempting to save settings for user ID:", user.id); // Log user ID before saving - keep for debugging if needed

    setIsSavingSettings(true);

    try {
      // Make the API request to update user
      // Use the correct endpoint /api/creators/:id and PUT method
      // Send data using backend naming convention
      const response = await axiosInstance.put(`/api/creators/${user.id}`, {
        full_name: user.full_name,
        phone_number: user.phone_number,
        location: user.location,
        // Do NOT send email or password here - backend updateCreator doesn't handle them
      });

      if (response.status === 200) {
        // Trigger success toast
        toast({
          title: "Settings updated",
          description: "Your profile settings have been updated successfully.",
          variant: "default",
        });
        // Optionally update state with response data if backend returns it (recommended)
        if(response.data.creator) {
          setUser(response.data.creator);
        }
      } else {
        // Handle failure response (though axios usually throws for non-2xx)
        const errorMessage = response.data.message || `Failed to update profile: Status ${response.status}`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);

      // Handle catch block in case of error
      const errorMessage = (error as any).response?.data?.message || "Failed to update profile. Please try again later.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!currentPassword || !newPassword) {
      toast({
        title: "Error",
        description: "Please fill in both current and new password fields.",
        variant: "destructive",
      });
      return;
    }
    // Basic check for password length (optional but recommended)
     if (newPassword.length < 8) { // Example: Minimum 8 characters
         toast({
             title: "Error",
             description: "New password must be at least 8 characters long.",
             variant: "destructive",
         });
         return;
     }

     // console.log("Attempting to change password for user (ID from JWT):", user.id); // Keep for debugging if needed

    setIsChangingPassword(true);

    try {
      // This frontend call to '/api/creators/change-password' is correct,
      // assuming the backend endpoint is implemented at this path and method (PUT).
      const response = await axiosInstance.put('/api/creators/change-password', {
        current_password: currentPassword, // Assuming backend expects snake_case
        new_password: newPassword,       // Assuming backend expects snake_case
        // Do NOT send user ID here; backend gets it from JWT
      });

      // If the request was successful (assuming 200 or 204)
      if (response.status === 200 || response.status === 204) {
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        });

        // Clear the password fields on success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Show error toast if the response is not successful
        const errorMessage = response.data.message || `Failed to change password: Status ${response.status}`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);

      // Show error toast in case of an exception
      const errorMessage = (error as any).response?.data?.message || "An error occurred while changing the password.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };


  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      // Removed className and overlayClassName to potentially restore older default styling
    >
      {/* Removed max-h-screen overflow-y-auto from here */}
      <div className="container mx-auto p-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <h1 className="text-3xl font-bold mb-6">Profile</h1>

        {isLoadingProfile ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <span className="ml-2 text-gray-600">Loading profile...</span>
            </div>
        ) : user.id === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                <AlertCircleIcon className="h-10 w-10 mb-2 text-red-500" />
                <p>Failed to load profile data. Please log in again.</p> {/* Improved error message */}
             </div>
        ) : (
            <Tabs defaultValue="settings" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="password">Change Password</TabsTrigger>
                </TabsList>
                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Settings</CardTitle>
                            <CardDescription>Manage your account settings and preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label> {/* Use backend name */}
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    value={user.full_name}
                                    onChange={handleSettingsInputChange} // Use the specific settings handler
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={user.email}
                                    disabled // Email is typically not changeable via this profile update
                                    onChange={handleSettingsInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone_number">Phone Number</Label> {/* Use backend name */}
                                <Input
                                    id="phone_number"
                                    name="phone_number"
                                    value={user.phone_number || ''} // Handle potential undefined/null
                                    onChange={handleSettingsInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label> {/* Use backend name */}
                                <Input
                                    id="location"
                                    name="location"
                                    value={user.location || ''} // Handle potential undefined/null
                                    onChange={handleSettingsInputChange}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSettingsSave} disabled={isSavingSettings} className='bg-spring-500 hover:bg-spring-700'>
                                {isSavingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {/* Added Loader */}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="password">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Update your password to keep your account secure.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)} // Bind to currentPassword state
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)} // Bind to newPassword state
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)} // Bind to confirmPassword state
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handlePasswordChange} disabled={isChangingPassword} className='bg-spring-500 hover:bg-spring-700'>
                                {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {/* Added Loader */}
                                Change Password
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        )} {/* End conditional rendering based on loading and user.id */}
      </div>
      <Toaster /> {/* Ensure Toaster is rendered somewhere in your app, usually root */}
    </Modal>
  );
}

export default Profile;