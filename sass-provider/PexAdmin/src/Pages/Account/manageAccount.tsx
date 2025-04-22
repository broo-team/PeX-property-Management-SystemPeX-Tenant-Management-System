"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/services/authService"; // Import axiosInstance
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, UserCog, Trash, AlertCircle, X } from "lucide-react";
import Modal from "react-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Account {
  _id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  location: string;
  phoneNumber: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageAccount: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRole, setSelectedRole] = useState<string>(""); // State for tracking selected role
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Fetch accounts from API
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axiosInstance.get("/api/user/get-all-user");
        console.log(response.data); // Check if the data structure is correct
        if (Array.isArray(response.data.users)) {
          // Accessing the correct array
          setAccounts(response.data.users); // Update state with the user array
        } else {
          console.error("Users data is not an array");
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    fetchAccounts();
  }, []);

  const filteredAccounts = Array.isArray(accounts)
    ? accounts.filter(
        (account) =>
          account.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (roleFilter === "All" || account.role === roleFilter) &&
          (statusFilter === "All" || account.status === statusFilter)
      )
    : [];

  const handleStatusToggle = async (
    _id: number | undefined,
    checked: boolean
  ) => {
    if (!_id) {
      console.error("User ID is undefined. Cannot toggle status.");
      return;
    }

    try {
      const newStatus = checked ? "active" : "inactive"; // Set status based on toggle

      // Send the PATCH request to toggle the status
      const response = await axiosInstance.patch(
        `/api/user/${_id}/toggleStatus`,
        {
          status: newStatus,
        }
      );

      if (response.status === 200) {
        console.log("API Response:", response.data); // Log API response

        // Update the account list in state
        setAccounts(
          accounts.map((account) =>
            account._id === _id
              ? { ...account, status: newStatus } // Update the status in UI
              : account
          )
        );
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  //Change Role
  const handleChangeUserRole = async () => {
    if (!selectedUserId || !selectedRole) {
      alert("User ID or role is not selected.");
      return;
    }

    try {
      // Log request to see what's being sent
      console.log("Requesting role change for:", selectedUserId, selectedRole);

      const response = await axiosInstance.patch(
        `/api/user/${selectedUserId}/changeUserRole`,
        { role: selectedRole }
      );

      console.log("API response:", response.data); // Log response

      if (response.status === 200) {
        // Update UI
        setAccounts((prevAccounts) =>
          prevAccounts.map((account) =>
            account._id === selectedUserId
              ? { ...account, role: selectedRole }
              : account
          )
        );
        alert(`Role updated successfully to ${selectedRole}`);
      } else {
        alert(`Failed to update role: ${response.data.message}`);
      }
    } catch (error) {
      // Detailed error logging
      console.error("Error updating role:", error?.response || error);
      alert("Failed to update role due to an internal error.");
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!email) {
      console.error("Email is required to reset the password");
      return;
    }

    try {
      const response = await axiosInstance.put("/api/user/resetPassword", {
        email,
      });

      if (response.status === 200) {
        // Show a success message to the user
        alert(`Password for ${email} has been reset to the default value.`);
      } else {
        console.error(response.data.message);
        alert(`Failed to reset password: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password due to an internal error.");
    }
  };
  //Delete
  const handleDeleteUser = async (userId: number) => {
    try {
      // Confirm deletion before proceeding
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this user?"
      );
      if (!confirmDelete) return;

      // Send DELETE request to the backend
      const response = await axiosInstance.delete(
        `/api/user/delete-user/${userId}`
      );

      // Check for success response
      if (response.status === 200) {
        // Remove the deleted user from the accounts state
        setAccounts((prevAccounts) =>
          prevAccounts.filter((account) => account._id !== userId)
        );
        alert("User deleted successfully");
      } else {
        alert(`Error deleting user: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error?.response || error);
      alert("Failed to delete user. Please try again.");
    }
  };

  const handleEmailChange = (id: number, value: string) => {
    setAccounts(
      accounts.map((account) =>
        account._id === id ? { ...account, email: value } : account
      )
    );
  };

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role); // Update the selected role
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
        <h1 className="text-2xl font-bold mb-6">Manage Accounts</h1>
                       
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center w-full md:w-auto">
            <Input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mr-2"
            />
            <Button size="icon" className="bg-spring-500">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex space-x-2 w-full md:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((account) => (
              <TableRow
                key={account._id}
                className={
                  account.status === "inactive" ? "bg-red-100 text-red-800" : ""
                } // Enhanced styling for inactive users
              >
                <TableCell>{account.fullName}</TableCell>
                <TableCell>{account.email}</TableCell>
                <TableCell>{account.role}</TableCell>
                <TableCell>
                  <Switch
                    checked={account.status === "active"}
                    onCheckedChange={(checked) =>
                      handleStatusToggle(account._id, checked)
                    }
                  />
                </TableCell>
                <TableCell>{account.location}</TableCell>
                <TableCell>{account.phoneNumber}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {/* Reset Password Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-yellow-500 text-slate-50 hover:bg-yellow-600"
                        >   
                          <UserCog className="h-4 w-4 mr-1" />
                          Reset Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white shadow-lg rounded-lg p-6 max-w-sm">
                        <DialogHeader>
                          <DialogTitle>
                            Reset Password For {account.fullName}
                          </DialogTitle>
                        </DialogHeader>
                        {/* Warning Section */}
                        <div className="p-4 bg-yellow-50 border border-yellow-400 text-yellow-800 rounded mb-4">
                          <div className="flex items-center">
                            <AlertCircle className="h-6 w-6 mr-2 text-yellow-600" />
                            <p className="font-semibold">Warning:</p>
                          </div>
                          <p>
                            This action is irreversible. Proceed with caution.
                          </p>
                        </div>

                        {/* Email Input */}
                        <div className="py-4">
                          <Label
                            htmlFor={`email-${account._id}`}
                            className="mb-2 block"
                          >
                            Email
                          </Label>
                          <Input
                            id={`email-${account._id}`}
                            type="email"
                            value={account.email}
                            onChange={(e) =>
                              handleEmailChange(account._id, e.target.value)
                            }
                            placeholder="Enter new email"
                            className="border border-gray-300 p-2 rounded"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-500 text-slate-50 hover:bg-red-600 mt-2 flex justify-end"
                            onClick={() => handleResetPassword(account.email)} // Call the API
                          >
                            Reset Password
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Change Role Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-500 text-slate-50 hover:bg-blue-600"
                          onClick={() => {
                            setSelectedUserId(account._id); // Set the user ID when opening the role change dialog
                            setSelectedRole(account.role); // Set the current role as default
                          }}
                        >
                          <UserCog className="h-4 w-4 mr-1" />
                          Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Change Role for {account.fullName}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <Label
                            htmlFor={`role-${account._id}`}
                            className="mb-2 block"
                          >
                            Select New Role
                          </Label>
                          <Select
                            onValueChange={handleRoleSelection} // Call the role change function
                            value={selectedRole} // Bind the selected role
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleChangeUserRole}
                          className="bg-primary"
                        >
                          Save
                        </Button>
                      </DialogContent>
                    </Dialog>
                    {/* Delete Account Button */}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex items-center bg-red-500 text-white hover:bg-red-600"
                      onClick={() => handleDeleteUser(account._id)} // Trigger the delete function with account ID
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Modal>
  );
};

export default ManageAccount;    