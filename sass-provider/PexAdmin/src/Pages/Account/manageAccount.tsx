"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/services/authService";
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
import { Search, UserCog, Trash, AlertCircle, X, Loader2 } from "lucide-react"; // Added Loader2
import Modal from "react-modal";
import {
  Dialog,
  DialogClose, // Import DialogClose
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast"; // Import toast

// Assuming the backend returns this structure for each creator/user
interface BackendUser {
  id: number; // Use 'id' as per backend
  full_name: string; // Use snake_case as per backend
  email: string;
  role: string; // Assuming backend stores role as a string
  status: 'active' | 'inactive'; // Assuming backend stores status as string 'active' or 'inactive'
  location?: string; // Assuming optional
  phone_number?: string; // Use snake_case as per backend, assuming optional
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Set the app element for react-modal (Ensure this is REMOVED from this file
// and correctly set once in your index.tsx or _app.tsx)
// Modal.setAppElement('#root'); // REMOVED from here - should be in index.tsx

const ManageAccount: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  // Store accounts in the format received from the backend (snake_case, id)
  const [accounts, setAccounts] = useState<BackendUser[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedUserIdForRoleChange, setSelectedUserIdForRoleChange] = useState<number | null>(null); // Separate state for role change dialog
  const [selectedUserForReset, setSelectedUserForReset] = useState<BackendUser | null>(null); // State for reset password dialog
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false); // Loading state for initial fetch
  const [isUpdatingRole, setIsUpdatingRole] = useState(false); // Loading state for role change
  const [isResettingPassword, setIsResettingPassword] = useState(false); // Loading state for password reset
  const [isDeletingUser, setIsDeletingUser] = useState(false); // Loading state for delete


  // Fetch accounts from API
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!isOpen) {
        // Clear state when modal closes
        setAccounts([]);
        return;
      }

      setIsLoadingAccounts(true);
      try {
        // Use the correct backend endpoint - assuming GET /api/creators returns all creators
        const response = await axiosInstance.get("/api/creators");
        console.log("Fetched Accounts:", response.data); // Check if the data structure is correct

        // Assuming the backend returns { creators: [...] } or just the array [...]
        const fetchedUsers = Array.isArray(response.data.creators)
          ? response.data.creators
          : Array.isArray(response.data)
          ? response.data
          : []; // Fallback to empty array if unexpected structure

        // Ensure data matches BackendUser interface expected keys (snake_case, id)
        // If backend sends camelCase, adjust interface/mapping here
        setAccounts(fetchedUsers);

      } catch (error) {
        console.error("Error fetching accounts:", error);
        toast({
          title: "Error",
          description: "Failed to fetch accounts.",
          variant: "destructive",
        });
        setAccounts([]); // Clear accounts on error
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [isOpen]); // Refetch when modal opens

  // Filter accounts using snake_case keys
  const filteredAccounts = accounts.filter(
    (account) =>
      (account.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) && // Use optional chaining for safety
      (roleFilter === "All" || account.role === roleFilter.toLowerCase()) && // Filter by lowercase role
      (statusFilter === "All" || account.status === statusFilter.toLowerCase()) // Filter by lowercase status
  );


  // Handle status toggle
  const handleStatusToggle = async (
    id: number, // Use 'id'
    checked: boolean
  ) => {
    try {
      const newStatus = checked ? "active" : "inactive";

      // Use the correct backend endpoint - assuming PATCH /api/creators/:id/status
      const response = await axiosInstance.patch(
        `/api/creators/${id}/status`,
        {
          status: newStatus,
        }
      );

      if (response.status === 200) {
        console.log("API Response (Status Toggle):", response.data);
        toast({
          title: "Status Updated",
          description: `User status updated to ${newStatus}.`,
        });
        // Update the account list in state using 'id'
        setAccounts(
          accounts.map((account) =>
            account.id === id
              ? { ...account, status: newStatus }
              : account
          )
        );
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      const errorMessage = (error as any).response?.data?.message || "Failed to toggle user status.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle Change Role API call
  const handleChangeUserRole = async () => {
    if (!selectedUserIdForRoleChange || !selectedRole) {
      toast({
        title: "Error",
        description: "User or role not selected.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingRole(true);
    try {
      // Use the correct backend endpoint - assuming PATCH /api/creators/:id/role
      const response = await axiosInstance.patch(
        `/api/creators/${selectedUserIdForRoleChange}/role`,
        { role: selectedRole.toLowerCase() } // Send role in lowercase if backend expects it
      );

      console.log("API response (Role Change):", response.data);

      if (response.status === 200) {
        toast({
          title: "Role Updated",
          description: `User role updated successfully to ${selectedRole}.`,
        });
        // Update UI using 'id'
        setAccounts((prevAccounts) =>
          prevAccounts.map((account) =>
            account.id === selectedUserIdForRoleChange
              ? { ...account, role: selectedRole.toLowerCase() } // Update role in lowercase
              : account
          )
        );
      } else {
        const errorMessage = response.data.message || `Failed to update role: Status ${response.status}`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating role:", error?.response || error);
      const errorMessage = (error as any).response?.data?.message || "Failed to update role due to an internal error.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Handle Reset Password API call
  const handleResetPassword = async () => {
    if (!selectedUserForReset?.email) {
      toast({
        title: "Error",
        description: "User email is required to reset the password.",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      // Use the correct backend endpoint - assuming PUT /api/creators/reset-password
      // It should reset the password for the user with this email (requires admin privilege check on backend)
      const response = await axiosInstance.put("/api/creators/reset-password", {
        email: selectedUserForReset.email,
      });

      if (response.status === 200) {
        toast({
          title: "Password Reset",
          description: `Password for ${selectedUserForReset.email} has been reset.`,
        });
        setSelectedUserForReset(null); // Close dialog
      } else {
        const errorMessage = response.data.message || `Failed to reset password: Status ${response.status}`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      const errorMessage = (error as any).response?.data?.message || "Failed to reset password due to an internal error.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle Delete User API call
  const handleDeleteUser = async (id: number) => { // Use 'id'
    setIsDeletingUser(true);
    try {
      // Use the correct backend endpoint - DELETE /api/creators/:id
      const response = await axiosInstance.delete(
        `/api/creators/${id}`
      );

      if (response.status === 200) {
        toast({
          title: "User Deleted",
          description: "User deleted successfully.",
        });
        // Remove the deleted user from the accounts state using 'id'
        setAccounts((prevAccounts) =>
          prevAccounts.filter((account) => account.id !== id)
        );
      } else {
        const errorMessage = response.data.message || `Error deleting user: Status ${response.status}`;
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error?.response || error);
      const errorMessage = (error as any).response?.data?.message || "Failed to delete user. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Removed handleEmailChange as email update isn't part of this component's logic or backend
  // const handleEmailChange = (id: number, value: string) => { ... };

  // Update selected role state when the Select value changes
  const handleRoleSelection = (role: string) => {
    setSelectedRole(role);
  };


  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      className="modal-content" // Add class for custom styling
      overlayClassName="modal-overlay" // Add class for custom styling
    >
      <div className="container mx-auto p-6 max-h-screen overflow-y-auto"> {/* Added max height and overflow */}
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
                {/* Ensure these values match your backend's actual role strings (e.g., 'admin', 'user') */}
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                {/* Ensure these values match your backend's actual status strings (e.g., 'active', 'inactive') */}
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingAccounts ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600">Loading accounts...</span>
          </div>
        ) : (
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
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No accounts found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow
                    key={account.id} // Use 'id' as key
                    className={
                      account.status === "inactive" ? "bg-red-50/50 text-red-800" : ""
                    }
                  >
                    {/* Use snake_case keys for displaying data */}
                    <TableCell className="font-medium">{account.full_name}</TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.role}</TableCell>
                    <TableCell>
                      <Switch
                        checked={account.status === "active"}
                        onCheckedChange={(checked) =>
                          handleStatusToggle(account.id, checked) // Use 'id'
                        }
                      />
                    </TableCell>
                    <TableCell>{account.location || '-'}</TableCell> {/* Handle potential null/undefined */}
                    <TableCell>{account.phone_number || '-'}</TableCell> {/* Handle potential null/undefined */}
                    <TableCell>
                      <div className="flex space-x-2">
                        {/* Reset Password Dialog */}
                        <Dialog onOpenChange={(open) => !open && setSelectedUserForReset(null)}> {/* Clear selected user on close */}
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-yellow-500 text-slate-50 hover:bg-yellow-600"
                              onClick={() => setSelectedUserForReset(account)} // Set the user for the dialog
                            >
                              <UserCog className="h-4 w-4 mr-1" />
                              Reset Password
                            </Button>
                          </DialogTrigger>
                          {selectedUserForReset && ( // Render content only if a user is selected
                            <DialogContent className="bg-white shadow-lg rounded-lg p-6 max-w-sm">
                              <DialogHeader>
                                <DialogTitle>
                                  Reset Password For {selectedUserForReset.full_name}
                                </DialogTitle>
                              </DialogHeader>
                              {/* Warning Section */}
                              <div className="p-4 bg-yellow-50 border border-yellow-400 text-yellow-800 rounded mb-4">
                                <div className="flex items-center">
                                  <AlertCircle className="h-6 w-6 mr-2 text-yellow-600" />
                                  <p className="font-semibold">Warning:</p>
                                </div>
                                <p>
                                  This will reset the password for {selectedUserForReset.email}.
                                  This action is irreversible.
                                </p>
                              </div>

                              <Button
                                onClick={handleResetPassword}
                                disabled={isResettingPassword}
                                className="bg-red-500 text-slate-50 hover:bg-red-600 w-full"
                              >
                                {isResettingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Confirm Reset Password
                            </Button>
                            </DialogContent>
                          )}
                        </Dialog>

                        {/* Change Role Dialog */}
                        <Dialog onOpenChange={(open) => !open && setSelectedUserIdForRoleChange(null)}> {/* Clear selected user ID on close */}
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-500 text-slate-50 hover:bg-blue-600"
                              onClick={() => {
                                setSelectedUserIdForRoleChange(account.id); // Use 'id'
                                setSelectedRole(account.role); // Set the current role as default
                              }}
                            >
                              <UserCog className="h-4 w-4 mr-1" />
                              Role
                            </Button>
                          </DialogTrigger>
                          {selectedUserIdForRoleChange === account.id && ( // Only render if this dialog is for the current account
                            <DialogContent className="bg-white shadow-lg rounded-lg p-6 max-w-sm">
                              <DialogHeader>
                                <DialogTitle>
                                  Change Role for {account.full_name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="py-4">
                                <Label
                                  htmlFor={`role-${account.id}`} // Use 'id'
                                  className="mb-2 block"
                                >
                                  Select New Role
                                </Label>
                               <Select
  onValueChange={handleRoleSelection}
  value={selectedRole}
>
  <SelectTrigger>
    <SelectValue placeholder="Select Role" />
  </SelectTrigger>
  {/* Ensure values match backend */}
  <SelectItem value="admin">Admin</SelectItem>
  <SelectItem value="user">User</SelectItem>
</Select> {/* Corrected closing tag */}
                            </div>
                            <Button
                              onClick={handleChangeUserRole}
                              disabled={isUpdatingRole}
                              className="bg-primary"
                            >
                              {isUpdatingRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Save Changes
                            </Button>
                            </DialogContent>
                          )}
                        </Dialog>

                        {/* Delete Account Button */}
                        {/* Using a Dialog for delete confirmation is better than window.confirm */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex items-center bg-red-500 text-white hover:bg-red-600"
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white shadow-lg rounded-lg p-6 max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Confirm Deletion</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 text-center">
                              Are you sure you want to delete the account for **{account.full_name}**? This action cannot be undone.
                            </div>
                            <div className="flex justify-end space-x-2">
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              {/* Call delete function and close dialog on success */}
                              <Button
                                variant="destructive"
                                onClick={() => handleDeleteUser(account.id)} // Use 'id'
                                disabled={isDeletingUser}
                              >
                                {isDeletingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Delete
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                  </div>
                </TableCell>
              </TableRow>
                )
             ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Modal>
  );
};

export default ManageAccount;