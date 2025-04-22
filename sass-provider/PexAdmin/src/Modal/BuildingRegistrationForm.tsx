// src/Modal/BuildingRegistrationForm.tsx
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "../services/authService";

interface BuildingRegistrationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BuildingRegistrationForm: React.FC<BuildingRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  // State declarations (unchanged from original)
  const [buildingName, setBuildingName] = useState('');
  const [buildingImage, setBuildingImage] = useState('');
  const [buildingAddress, setBuildingAddress] = useState('');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    // Basic presence validation based on your backend's check
    if (!buildingName) newErrors.buildingName = "Building name is required.";
    if (!buildingImage) newErrors.buildingImage = "Building image URL is required.";
    if (!buildingAddress) newErrors.buildingAddress = "Building address is required.";
    if (!location) newErrors.location = "Location is required.";
    if (!propertyType) newErrors.propertyType = "Property type is required.";
    if (!ownerEmail) newErrors.ownerEmail = "Owner email is required.";
    if (!ownerPhone) newErrors.ownerPhone = "Owner phone is required.";
    if (!ownerAddress) newErrors.ownerAddress = "Owner address is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation and submit logic (unchanged from original)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Registering property...");

    // Data structure must match backend's expected req.body
    const buildingData = {
      buildingName,
      buildingImage,
      buildingAddress,
      location, // Use 'location' key as per backend
      propertyType,
      ownerEmail,
      ownerPhone,
      ownerAddress,
    };

    try {
      // Make POST request to the backend endpoint
      // Assumes your router is mounted under /api in your main Express app
      const response = await axiosInstance.post('/api/buildings', buildingData);

      console.log("Registration Response:", response.data);

      // Check for 201 Created status upon successful registration
      if (response.status === 201) {
        toast.success("Property registered successfully", { id: loadingToast });
        onSuccess(); // Call the parent success handler to close modal and refresh list
      } else {
         // This block might catch unexpected non-error responses, though 201 is expected for success
         toast.error(response.data?.message || "Registration failed with unexpected response.", { id: loadingToast });
      }

    } catch (error: any) {
      console.error("Error registering building:", error.response?.data || error);
      // Display specific backend error message if available
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "An unexpected error occurred during registration.";
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const propertyTypes = ["Residential", "Commercial", "Industrial", "Mixed-Use", "Other"];

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50/20 to-purple-50/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl shadow-blue-900/10 dark:shadow-purple-500/10 dark:bg-gray-900/80">
        <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center mb-8">
          Register New Property
        </h3>

        <div className="space-y-6">
          {/* Building Information Section */}
          <div className="space-y-5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-l-4 border-blue-500 pl-3">
              Building Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Building Name</Label>
                <Input 
                  id="buildingName"
                  className="rounded-lg border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={buildingName} 
                  onChange={(e) => setBuildingName(e.target.value)}
                />
                {errors.buildingName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>{errors.buildingName}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Property Type</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="rounded-lg border-gray-300 hover:border-blue-300 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg shadow-lg border border-gray-200 mt-1">
                    {propertyTypes.map(type => (
                      <SelectItem 
                        key={type} 
                        value={type}
                        className="hover:bg-blue-50/50 focus:bg-blue-50/50 transition-colors"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyType && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>{errors.propertyType}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Building Image URL</Label>
                <Input 
                  id="buildingImage"
                  type="text"
                  className="rounded-lg border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={buildingImage}
                  onChange={(e) => setBuildingImage(e.target.value)}
                />
                {errors.buildingImage && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>{errors.buildingImage}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Location (City/Area)</Label>
                <Input 
                  id="location"
                  className="rounded-lg border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>{errors.location}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Building Address</Label>
                <Input 
                  id="buildingAddress"
                  className="rounded-lg border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={buildingAddress}
                  onChange={(e) => setBuildingAddress(e.target.value)}
                />
                {errors.buildingAddress && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>{errors.buildingAddress}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Owner Information Section */}
          <div className="space-y-5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-l-4 border-purple-500 pl-3">
              Owner Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Owner Email</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  className="rounded-lg border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                />
                {errors.ownerEmail && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>{errors.ownerEmail}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Owner Phone</Label>
                <Input
                  id="ownerPhone"
                  type="tel"
                  className="rounded-lg border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                />
                {errors.ownerPhone && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>{errors.ownerPhone}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Owner Address</Label>
                <Input
                  id="ownerAddress"
                  className="rounded-lg border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={ownerAddress}
                  onChange={(e) => setOwnerAddress(e.target.value)}
                />
                {errors.ownerAddress && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>{errors.ownerAddress}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-lg px-6 py-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50/50 transition-all hover:-translate-y-0.5 shadow-sm dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-blue-500/30"
            >
              {isSubmitting ? 'Registering...' : 'Register Property'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default BuildingRegistrationForm;