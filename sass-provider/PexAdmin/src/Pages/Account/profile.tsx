'use client'

import React, { useState, useEffect } from 'react'
import axiosInstance from "@/services/authService" // Assumes you have axios setup for API requests
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

import Modal from "react-modal";
import { X } from 'lucide-react';  
import { Toaster } from '@/components/ui/toaster'

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Profile: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState({ 
    _id: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    location: ''
  })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')


  // Fetch user profile data from the backend on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axiosInstance.get('/api/user/me'); // Replace with your actual endpoint
        if (response.status === 200) {
          setUser(response.data.user); // Assumes user data comes in `response.data.user`
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch user profile.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Error",
          description: "An error occurred while fetching profile data.",
          variant: "destructive",
        });
      }
    }

    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser(prevUser => ({ ...prevUser, [name]: value }));
  }


  const handleSettingsSave = async () => {
    try {
      // Make the API request to update user
      const response = await axiosInstance.put(`/api/user/update-user/${user._id}`, user); // Ensure the endpoint and user data are correct
  
      if (response.status === 200) {
        // Trigger success toast
        toast({
          title: "Settings updated",
          description: "Your profile settings have been updated successfully.",
          variant: "default", // Or remove this if you don't want to customize
        });
      } else {
        // Handle failure response
        toast({
          title: "Error",
          description: "Failed to update profile.",
          variant: "destructive", // Use destructive for errors
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
  
      // Handle catch block in case of error
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again later.",
        variant: "destructive", // Customize this variant
      });
    }
  };

  const handlePasswordChange = async () => {
    // Check if the new passwords match
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      // Make the API request to change the user's password
      const response = await axiosInstance.put(`http://localhost:8000/api/user/${user._id}/changePassword`, {
        currentPassword, // The current password entered by the user
        newPassword,     // The new password entered by the user
        confirmPassword  // The confirmation of the new password
      });
  
      // If the request was successful
      if (response.status === 200) {
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        });
  
        // Clear the password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Show error toast if the response is not successful
        toast({
          title: "Error",
          description: "Failed to change password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      
      // Show error toast in case of an exception
      toast({
        title: "Error",
        description: "An error occurred while changing the password.",
        variant: "destructive",
      });
    }
  };
  
  

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} ariaHideApp={false}>
      <div className="container mx-auto p-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rela p-2 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
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
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={user.fullName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={user.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={user.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={user.location}
                    onChange={handleInputChange}
                  />
                </div>
               
              </CardContent>
              <CardFooter>
                <Button onClick={handleSettingsSave} className='bg-spring-500 hover:bg-spring-700'>Save Changes</Button>
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
  <Button onClick={handlePasswordChange} className='bg-spring-500 hover:bg-spring-700'>
    Change Password
  </Button>
</CardFooter>

            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </Modal>
  )
}

export default Profile
