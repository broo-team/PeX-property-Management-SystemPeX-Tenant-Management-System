import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Loader2,
  Upload,
  X,
  Map
} from 'lucide-react';
// Remove the contact-specific hook and API function import
// import { useContactForm } from '@/hooks/useContactForm';
// import { contactApi } from './contactApi'; // Or wherever your contactApi was

import axiosInstance from '@/services/authService'; // Your existing axios instance, assuming it's configured

// --- Zod Schema: Corrected for Building Registration Backend ---
const buildingRegistrationSchema = z.object({
  buildingName: z.string().min(2, 'Building name is required'),
  building_address: z.string().min(5, 'Building address is required'), // Added missing field
  location: z.string().min(2, 'Location is required'), // Added missing field
  propertyType: z.enum(['residential', 'commercial', 'mixed'], {
    errorMap: () => ({ message: "Please select a property type" })
  }),
  buildingImage: z.any().refine(file => file instanceof File, 'Building image is required'), // Changed to required File object
  owner_email: z.string().email('Invalid email address'), // Changed name to match backend
  owner_phone: z.string().min(10, 'Invalid phone number'), // Changed name to match backend
  owner_address: z.string().min(5, 'Owner address is required'), // Changed name to match backend
  // Removed fullName and message as they are not in the backend schema
});

// Type based on the corrected schema
type BuildingRegistrationFormData = z.infer<typeof buildingRegistrationSchema>;

// --- BuildingRegistrationForm Component ---
export const ContactSectionForm = () => { // Renamed component
  // State for multi-step form (Now 2 steps)
  const [currentStep, setCurrentStep] = useState(1);
  // State for image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Local states for submission process
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    setValue,
    getValues,
    setFocus
  } = useForm<BuildingRegistrationFormData>({
    resolver: zodResolver(buildingRegistrationSchema),
    mode: 'onChange', // Validate on change
    defaultValues: {
      buildingName: '',
      building_address: '',
      location: '',
      propertyType: undefined, // Initialize enum field
      buildingImage: undefined, // Initialize file field
      owner_email: '',
      owner_phone: '',
      owner_address: '',
    }
  });

  // --- Image Handling Logic ---
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Client-side validation (should align with backend fileFilter logic)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only JPEG, PNG, and JPG images are allowed.'); // Consider a more integrated error display
        // Clear the input and state
        removeImage(); // Reuses logic to clear input/state
        return;
      }

      // Backend doesn't specify size limit in the provided snippet, but 5MB is a common client-side check.
      // Adjust if backend has a limit.
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB'); // Consider a more integrated error display
        // Clear the input and state
        removeImage(); // Reuses logic to clear input/state
        return;
      }

      // Set value in react-hook-form state for schema validation
      setValue('buildingImage', file, { shouldValidate: true });
      setError(null); // Clear previous submission error if setting image fixes a required field error

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setValue('buildingImage', undefined, { shouldValidate: true }); // Clear react-hook-form state & re-validate
    setImagePreview(null); // Clear local state
    // Clear the actual file input element value to allow selecting the same file again
    const inputElement = document.getElementById('building-image') as HTMLInputElement;
    if (inputElement) {
        inputElement.value = '';
    }
    // Clear any image validation error explicitly if needed, though setValue/shouldValidate should trigger re-validation
  };
  // --- End Image Handling Logic ---


  // --- Submission Logic: Modified to use axiosInstance ---
  const onSubmit = async (data: BuildingRegistrationFormData) => {
    console.log('Form data before submission:', data); // Data validated by Zod

    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      const formData = new FormData();

      // Append all text fields using the exact backend keys
      formData.append('buildingName', data.buildingName);
      formData.append('building_address', data.building_address);
      formData.append('location', data.location);
      formData.append('propertyType', data.propertyType); // Enum appended as string
      formData.append('owner_email', data.owner_email);
      formData.append('owner_phone', data.owner_phone);
      formData.append('owner_address', data.owner_address);

      // Append the image file only if it exists and is a File object
      const imageFile = getValues('buildingImage'); // Get value directly from RHF state
      if (imageFile instanceof File) {
        console.log('Appending file:', imageFile.name);
        formData.append('buildingImage', imageFile, imageFile.name); // Append with filename
      } else {
         // This case should ideally not happen if schema validation works,
         // but adding a log for debugging
         console.warn('Building image is missing or not a File object', imageFile);
         setError('Building image file is missing.'); // Set a user-friendly error
         setIsSubmitting(false);
         return; // Stop submission
      }

      // Debug: Log all form data entries (Note: File content won't be visible, only filename/details)
      console.log('FormData entries:');
       for (let [key, value] of formData.entries()) {
         // For file entries, value is the File object, which is not easily stringifiable.
         // Log a property of the File object like name or size.
         if (value instanceof File) {
             console.log(`${key}:`, value.name, `(${value.size} bytes)`);
         } else {
            console.log(`${key}:`, value);
         }
       }


      // Use axiosInstance to send the POST request to the correct backend endpoint
      const response = await axiosInstance.post('/api/buildings', formData, {
        headers: {
          // axiosInstance might set this automatically for FormData, but explicit is fine too
          'Content-Type': 'multipart/form-data',
        },
         // Optional: Add onUploadProgress if you need a progress bar
        // onUploadProgress: (progressEvent) => {
        //   const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
        //   console.log('Upload progress:', percentCompleted);
        // },
      });

      console.log('Backend response:', response.data);

      // Check for success based on status code (201 for created)
      if (response.status === 201) {
        setIsSuccess(true);
        // Optional: Handle successful registration message or redirect
        // e.g., localStorage.setItem('newBuildingId', response.data.id);
        // router.push('/buildings'); // Example redirect
      } else {
         // Handle other non-201 success-range status codes if necessary
         setError(response.data.message || 'Registration failed.'); // Use backend message if available
      }


    } catch (err) {
      console.error('Submission Error:', err);

      // Improved error handling based on axios response structure
      if (axiosInstance.isAxiosError(err) && err.response) {
        // Backend sent a response with a status code (4xx, 5xx)
        const backendError = err.response.data;
        if (backendError && backendError.error) {
             setError(`Error: ${backendError.error}`); // Display backend specific error
        } else {
             setError(`Server responded with status ${err.response.status}`);
        }
      } else {
        // Network error or other issue
        setError('An unexpected error occurred. Please try again.');
      }

    } finally {
      setIsSubmitting(false);
    }
  };
  // --- End Submission Logic ---


  // --- Navigation Logic ---
  // Now navigating between 2 steps
  const totalSteps = 2;

  const nextStep = async () => {
    let fieldsToValidate: (keyof BuildingRegistrationFormData)[] = [];

    // Fields to validate for each step before proceeding
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['buildingName', 'building_address', 'location', 'propertyType', 'buildingImage'];
        break;
      case 2: // No 'next' from step 2, validation happens on submit
        break;
      default:
        fieldsToValidate = [];
    }

     // Trigger validation for the fields specific to the current step
    const isStepValid = await trigger(fieldsToValidate);

    if (isStepValid) {
       // Check image specifically if trigger didn't cover it fully (though schema should now)
       // const imageFile = getValues('buildingImage');
       // if (currentStep === 1 && (!imageFile || !(imageFile instanceof File))) {
       //      setError('Building image is required.'); // Or set error in RHF state
       //      return; // Don't proceed
       // }

        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
            setError(null); // Clear previous submission error on moving forward
        }
       // else { // currentStep is the last step, no next action needed }
    } else {
        console.log(`Step ${currentStep} validation failed`, errors); // Debug validation errors
        // Optional: focus the first field with an error in the current step's fields
        const firstErrorField = fieldsToValidate.find(field => errors[field]);
        if(firstErrorField) {
           // Cast to any if needed, or refine setFocus type
           setFocus(firstErrorField as any);
        }
        // Do NOT clear submission error here, as validation failed client-side
    }
  };

  const prevStep = () => {
      setCurrentStep(prev => Math.max(1, prev - 1)); // Prevent going below step 1
      setError(null); // Clear previous submission error on moving backward
  };

  // Form steps content - Now 2 steps
  const formStepsContent = {
    1: (
        <motion.div
          key={1} // Key for AnimatePresence
          initial={{ x: 50, opacity: 0 }} // Animation from right
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }} // Exit to left
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-semibold mb-4">Building Details</h3>
          <div>
            <label htmlFor="buildingName" className="block text-sm font-medium mb-2">Building Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="buildingName"
                {...register('buildingName')}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.buildingName ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:ring-2 focus:ring-primary-green`}
                placeholder="Enter building name"
              />
            </div>
            {errors.buildingName && (
              <p className="text-red-500 text-sm mt-1">{errors.buildingName.message}</p>
            )}
          </div>

           {/* Added Building Address */}
           <div>
            <label htmlFor="building_address" className="block text-sm font-medium mb-2">Building Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="building_address"
                {...register('building_address')}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.building_address ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:ring-2 focus:ring-primary-green`}
                placeholder="Enter building address"
              />
            </div>
            {errors.building_address && (
              <p className="text-red-500 text-sm mt-1">{errors.building_address.message}</p>
            )}
          </div>

           {/* Added Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-2">Location / City</label>
            <div className="relative">
              <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="location"
                {...register('location')}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.location ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:ring-2 focus:ring-primary-green`}
                placeholder="Enter location or city"
              />
            </div>
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
            )}
          </div>


          <div>
            <label className="block text-sm font-medium mb-2">Property Type</label>
            <div className="grid grid-cols-3 gap-4">
              {['residential', 'commercial', 'mixed'].map((type) => (
                <button
                  key={type}
                  type="button" // Important: type="button" to prevent form submission
                  onClick={() => setValue('propertyType', type as any, { shouldValidate: true })}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    watch('propertyType') === type
                      ? 'border-primary-green bg-primary-green/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
             {errors.propertyType && (
                <p className="text-red-500 text-sm mt-1">{errors.propertyType.message}</p>
              )}
          </div>

          {/* Building Image Field */}
          <div>
            <label htmlFor="building-image" className="block text-sm font-medium mb-2">Building Image</label>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {!imagePreview ? (
                <div className="text-center">
                   {/* The actual file input */}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg" // Restrict file types client-side
                    onChange={handleImageUpload}
                    className="hidden"
                    id="building-image"
                  />
                  {/* Label to trigger the hidden file input */}
                  <label
                    htmlFor="building-image"
                    className="cursor-pointer inline-flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Click to upload building image
                    </span>
                    <span className="text-xs text-gray-400">
                      (JPEG, PNG, JPG | Max size: 5MB)
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Building preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    aria-label="Remove building image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {/* Display error for buildingImage */}
             {errors.buildingImage && (
                // Note: Error message comes from the `.refine` method in the schema
                <p className="text-red-500 text-sm mt-1">{errors.buildingImage.message?.toString()}</p>
             )}
          </div>


          <button
            type="button"
            onClick={nextStep}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-primary-green to-primary-blue text-white hover:opacity-90 transition-opacity"
          >
            Next Step
          </button>
        </motion.div>
    ),
    2: (
      <motion.div
         key={2} // Key for AnimatePresence
         initial={{ x: 50, opacity: 0 }} // Animation from right
         animate={{ x: 0, opacity: 1 }}
         exit={{ x: -50, opacity: 0 }} // Exit to left
         transition={{ duration: 0.3 }}
         className="space-y-6"
       >
         <h3 className="text-xl font-semibold mb-4">Owner Details</h3>
         {/* Removed Full Name field */}

         {/* Owner Email Field */}
         <div>
           <label htmlFor="owner_email" className="block text-sm font-medium mb-2">
             Owner Email
           </label>
           <div className="relative">
             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
             <input
               id="owner_email"
               type="email"
               {...register('owner_email')} // Corrected name
               className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.owner_email ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:ring-2 focus:ring-primary-green`}
               placeholder="owner@example.com"
             />
           </div>
           {errors.owner_email && (
             <p className="text-red-500 text-sm mt-1">
               {errors.owner_email.message}
             </p>
           )}
         </div>

         {/* Owner Phone Field */}
         <div>
           <label htmlFor="owner_phone" className="block text-sm font-medium mb-2">
             Owner Phone Number
           </label>
           <div className="relative">
             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
             <input
               id="owner_phone"
               type="tel" // Use type="tel" for phone numbers
               {...register('owner_phone')} // Corrected name
               className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.owner_phone ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:ring-2 focus:ring-primary-green`}
               placeholder="+1 (555) 000-0000"
             />
           </div>
           {errors.owner_phone && (
             <p className="text-red-500 text-sm mt-1">
               {errors.owner_phone.message}
             </p>
           )}
         </div>

         {/* Owner Address Field (Moved from Step 3) */}
         <div>
           <label htmlFor="owner_address" className="block text-sm font-medium mb-2">Owner Address</label>
           <div className="relative">
             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
             <input
               id="owner_address"
               {...register('owner_address')} // Corrected name
               className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.owner_address ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:ring-2 focus:ring-primary-green`}
               placeholder="Enter owner's address"
             />
           </div>
           {errors.owner_address && (
             <p className="text-red-500 text-sm mt-1">{errors.owner_address.message}</p>
           )}
         </div>

        {/* Removed Additional Message field */}

        {/* Navigation Buttons */}
        <div className="flex gap-4">
           <button
             type="button"
             onClick={prevStep}
             className="flex-1 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
           >
             Back
           </button>
           <button
             type="submit" // This button triggers the form's onSubmit handler via handleSubmit
             disabled={isSubmitting}
             className="flex-1 py-3 rounded-lg bg-gradient-to-r from-primary-green to-primary-blue text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isSubmitting ? (
               <span className="flex items-center justify-center">
                 <Loader2 className="w-5 h-5 animate-spin mr-2" />
                 Submitting...
               </span>
             ) : (
               <span className="flex items-center justify-center">
                  Submit Registration <Send className="ml-2 w-5 h-5" />
               </span>
             )}
           </button>
         </div>
       </motion.div>
    ),
     // Step 3 is removed
  };


  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Register Your{' '}
              <span className="bg-gradient-to-r from-primary-green to-primary-blue bg-clip-text text-transparent">
                Building
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Enter your building details to get started
            </p>
          </div>

          {/* Progress Steps (Now 2 steps) */}
          <div className="flex justify-between mb-12 relative">
            {/* Background bar */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2" />

            {/* Progress bar */}
            <motion.div
               className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary-green to-primary-blue -translate-y-1/2 transition-all duration-300"
               initial={{ width: '0%' }}
                // (currentStep - 1) / (totalSteps - 1) * 100
               animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
               transition={{ duration: 0.5 }}
            />

            {/* Step circles (Now 2 steps) */}
            {[1, 2].map((step) => ( // Render 2 circles
              <motion.div
                key={step}
                initial={{ scale: 0.8 }}
                animate={{
                  scale: currentStep >= step ? 1 : 0.8,
                  backgroundColor: currentStep >= step ? '#4ADE80' : (step === currentStep ? '#6EE7B7' : '#E5E7EB'),
                  color: currentStep >= step ? '#ffffff' : '#6B7280'
                }}
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-semibold`}
              >
                {step}
              </motion.div>
            ))}
          </div>

          {/* Form or Success Message Container */}
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              // Render the form
              <motion.form
                key="form" // Key for AnimatePresence
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)} // RHF handleSubmit wraps our onSubmit
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
                // Use encType="multipart/form-data" for older methods, but FormData handles it
                // encType="multipart/form-data"
              >
                 {/* Render the current step content with animation */}
                <AnimatePresence mode="wait" initial={false}> {/* initial={false} to prevent animation on mount */}
                    {/* Use the formStepsContent object to render the current step */}
                    {formStepsContent[currentStep as keyof typeof formStepsContent]}
                </AnimatePresence>

                 {/* Display general submission error */}
                {error && (
                   <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="text-red-500 text-sm mt-4 text-center"
                   >
                       {error}
                   </motion.div>
                )}

              </motion.form>
            ) : (
              // Render success message when isSuccess is true
              <motion.div
                 key="success" // Key for AnimatePresence
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.3 }}
                 className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
               >
                 <CheckCircle className="w-16 h-16 text-primary-green mx-auto mb-6" />
                 <h3 className="text-2xl font-bold mb-4">
                   Building Registered Successfully!
                 </h3>
                 <p className="text-gray-600 dark:text-gray-400">
                   You can now proceed to add units or manage the building.
                 </p>
                  {/* Optional: Add a button to go to the building dashboard or list */}
                  {/* <button
                      type="button"
                      onClick={() => router.push('/dashboard/buildings')} // Example navigation
                      className="mt-6 py-3 px-6 rounded-lg bg-gradient-to-r from-primary-green to-primary-blue text-white hover:opacity-90 transition-opacity"
                  >
                      Go to Dashboard
                  </button> */}
               </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};