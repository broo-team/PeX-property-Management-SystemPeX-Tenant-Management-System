import React from "react";
import { useForm, Controller, FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Modal from "react-modal";
import { X } from "lucide-react";  
import axiosInstance from "@/services/authService"; // Use axiosInstance
import { toast } from "react-hot-toast"; // Toast for success/error notifications

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  password: string;
  role: string;
  status: string;
};

const CreateAccount: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  const [showPassword, setShowPassword] = React.useState(false);

  // Function to handle form submission and make API request
  const onSubmit = async (data: FormValues) => {
    try {
      const response = await axiosInstance.post("/api/auth/create-account", {
        ...data,
      });

      if (response.data && response.data.message) {
        toast.success("Account created successfully!");
        onClose(); // Close the modal after success
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const renderError = (error: FieldErrors<FormValues>[keyof FormValues]) => {
    return error ? (
      <p className="text-sm text-red-500 mt-1">{error.message}</p>
    ) : null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      className="w-full max-w-2xl ml-80 mt-5"
    >
      <div>
        <Card className="w-full max-w-2xl">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rela p-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-6 w-6" /> {/* Close icon */}
            </button>
          </div>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Register users with different roles and settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <Controller
                  name="fullName"
                  control={control}
                  rules={{ required: "Full name is required" }}
                  render={({ field }) => (
                    <Input
                      id="fullName"
                      {...field}
                      className="border-b border-gray-300 focus:border-primary focus:ring-0"
                    />
                  )}
                />
                {renderError(errors.fullName)}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Invalid email address",
                    },
                  }}
                  render={({ field }) => (
                    <Input
                      id="email"
                      type="email"
                      {...field}
                      className="border-b border-gray-300 focus:border-primary focus:ring-0"
                    />
                  )}
                />
                {renderError(errors.email)}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <Controller
                  name="phoneNumber"
                  control={control}
                  rules={{ required: "Phone number is required" }}
                  render={({ field }) => (
                    <Input
                      id="phoneNumber"
                      type="tel"
                      {...field}
                      className="border-b border-gray-300 focus:border-primary focus:ring-0"
                    />
                  )}
                />
                {renderError(errors.phoneNumber)}
              </div>

              <div className="space-y-1">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                  Location
                </Label>
                <Controller
                  name="location"
                  control={control}
                  rules={{ required: "Location is required" }}
                  render={({ field }) => (
                    <Input
                      id="location"
                      {...field}
                      className="border-b border-gray-300 focus:border-primary focus:ring-0"
                    />
                  )}
                />
                {renderError(errors.location)}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Controller
                    name="password"
                    control={control}
                    rules={{
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...field}
                        className="border-b border-gray-300 focus:border-primary focus:ring-0"
                      />
                    )}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {renderError(errors.password)}
              </div>

              <div className="flex space-x-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                    Role
                  </Label>
                  <Controller
                    name="role"
                    control={control}
                    rules={{ required: "Role is required" }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {renderError(errors.role)}
                </div>

                <div className="flex-1 space-y-1">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Controller
                    name="status"
                    control={control}
                    rules={{ required: "Status is required" }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {renderError(errors.status)}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-spring-500 hover:bg-spring-600"
              >
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Modal>
  );
};

export default CreateAccount;
