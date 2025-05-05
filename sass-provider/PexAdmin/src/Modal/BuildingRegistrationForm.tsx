// src/Modal/BuildingRegistrationForm.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react'; // Import ChangeEvent and FormEvent
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "../services/authService"; // Assuming this is correctly configured

interface BuildingRegistrationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BuildingRegistrationForm: React.FC<BuildingRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  // State declarations
  const [buildingName, setBuildingName] = useState('');
  // Change this state to hold a File object or null
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [buildingAddress, setBuildingAddress] = useState('');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});


  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Select the first file
      setSelectedImage(e.target.files[0]);
      // Clear image-related error if a file is selected
      setErrors(prev => ({ ...prev, buildingImage: '' }));
    } else {
      setSelectedImage(null);
    }
  };


  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    // Basic presence validation based on your backend's check
    if (!buildingName) newErrors.buildingName = "Building name is required.";
    // Validate that a file has been selected
    if (!selectedImage) newErrors.buildingImage = "Building image is required.";
    if (!buildingAddress) newErrors.buildingAddress = "Building address is required.";
    if (!location) newErrors.location = "Location is required.";
    if (!propertyType) newErrors.propertyType = "Property type is required.";
    if (!ownerEmail) newErrors.ownerEmail = "Owner email is required.";
    if (!ownerPhone) newErrors.ownerPhone = "Owner phone is required.";
    if (!ownerAddress) newErrors.ownerAddress = "Owner address is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors
  
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }
  
    setIsSubmitting(true);
    const loadingToast = toast.loading("Registering property...");
  
    const formData = new FormData();
  
    // ✅ Correct: Append text fields using snake_case keys
    formData.append('buildingName', buildingName); // Use unique key for building name
    formData.append('building_address', buildingAddress);
    formData.append('location', location);
    formData.append('property_type', propertyType);
    formData.append('owner_email', ownerEmail);
    formData.append('owner_phone', ownerPhone);
    formData.append('owner_address', ownerAddress);
  
    // ✅ Append the file under 'buildingImage' (as expected by multer)
    if (selectedImage) {
      formData.append('buildingImage', selectedImage);  // Ensure this matches multer's field name
    }
  
    try {
      const response = await axiosInstance.post('/api/buildings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',  // This is essential for file uploads
        },
      });
  
      if (response.status === 201) {
        toast.success("Property registered successfully", { id: loadingToast });
        onSuccess();
      } else {
        toast.error(response.data?.message || "Registration failed with unexpected response.", { id: loadingToast });
      }
    } catch (error: any) {
      console.error("Error registering building:", error.response?.data || error);
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
                <Label htmlFor="buildingName" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Building Name</Label>
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
                <Label htmlFor="propertyType" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Property Type</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger id="propertyType" className="rounded-lg border-gray-300 hover:border-blue-300 focus:ring-2 focus:ring-blue-200">
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

              {/* Building Image File Input */}
              <div>
                <Label htmlFor="buildingImage" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Building Image</Label>
                <Input
                  id="buildingImage"
                  type="file" // Changed to file input
                  accept="image/*" // Suggest image files
                  className="rounded-lg border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
                  onChange={handleFileChange} // Use new handler
                />
                 {selectedImage && (
                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Selected file: {selectedImage.name}</p>
                 )}
                {errors.buildingImage && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>{errors.buildingImage}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Location (City/Area)</Label>
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
                <Label htmlFor="buildingAddress" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Building Address</Label>
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
                <Label htmlFor="ownerEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Owner Email</Label>
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
                <Label htmlFor="ownerPhone" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Owner Phone</Label>
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
                <Label htmlFor="ownerAddress" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Owner Address</Label>
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