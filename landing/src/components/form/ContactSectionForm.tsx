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
  Map // Assuming Map icon is for Location/City
} from 'lucide-react';

import axiosInstance from '@/services/authService'; // Your existing axios instance

// --- Zod Schema: Corrected for Building Registration Backend ---
// Note: Schema keys use camelCase/standard JS naming, mapping to backend snake_case happens in onSubmit
const buildingRegistrationSchema = z.object({
  buildingName: z.string().min(2, 'Building name is required'),
  building_address: z.string().min(5, 'Building address is required'),
  location: z.string().min(2, 'Location is required'),
  propertyType: z.enum(['residential', 'commercial', 'mixed'], { // Use camelCase here internally
    errorMap: () => ({ message: "Please select a property type" })
  }),
  buildingImage: z.any().refine(file => file instanceof File, 'Building image is required'),
  owner_email: z.string().email('Invalid email address'),
  owner_phone: z.string().min(10, 'Invalid phone number'),
  owner_address: z.string().min(5, 'Owner address is required'),
});

// Type based on the corrected schema
type BuildingRegistrationFormData = z.infer<typeof buildingRegistrationSchema>;

// --- BuildingRegistrationForm Component ---
export const ContactSectionForm = () => {
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
        alert('Invalid file type. Only JPEG, PNG, and JPG images are allowed.');
        removeImage();
        return;
      }

      // Backend doesn't specify size limit in the provided snippet, but 5MB is common
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        removeImage();
        return;
      }

      // Set value in react-hook-form state for schema validation
      setValue('buildingImage', file, { shouldValidate: true });
      setError(null); // Clear previous submission error

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setValue('buildingImage', undefined, { shouldValidate: true });
    setImagePreview(null);
    const inputElement = document.getElementById('building-image') as HTMLInputElement;
    if (inputElement) {
        inputElement.value = '';
    }
  };
  // --- End Image Handling Logic ---


  // --- Submission Logic: Fixed FormData Key ---
  const onSubmit = async (data: BuildingRegistrationFormData) => {
    console.log('Form data before submission:', data);

    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      const formData = new FormData();

      // Append text fields using the EXACT backend keys (snake_case where needed)
      formData.append('buildingName', data.buildingName);
      formData.append('building_address', data.building_address);
      formData.append('location', data.location);
      formData.append('property_type', data.propertyType); // <-- FIXED: Use snake_case key
      formData.append('owner_email', data.owner_email);
      formData.append('owner_phone', data.owner_phone);
      formData.append('owner_address', data.owner_address);

      // Append the image file
      const imageFile = getValues('buildingImage');
      if (imageFile instanceof File) {
        formData.append('buildingImage', imageFile, imageFile.name);
      } else {
         console.warn('Building image is missing or not a File object', imageFile);
         setError('Building image file is missing.');
         setIsSubmitting(false);
         return;
      }

      // Debug: Log all form data entries
      console.log('FormData entries:');
       for (let [key, value] of formData.entries()) {
         if (value instanceof File) {
             console.log(`${key}:`, value.name, `(${value.size} bytes)`);
         } else {
            console.log(`${key}:`, value);
         }
       }

      // Use axiosInstance to send the POST request to the correct backend endpoint
      const response = await axiosInstance.post('/api/buildings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Although axios often handles this for FormData
        },
      });

      console.log('Backend response:', response.data);

      if (response.status === 201) {
        setIsSuccess(true);
      } else {
         setError(response.data.message || 'Registration failed.');
      }


    } catch (err) {
      console.error('Submission Error:', err);

      if (axiosInstance.isAxiosError(err) && err.response) {
        const backendError = err.response.data;
        if (backendError && backendError.error) {
             setError(`Error: ${backendError.error}`);
        } else {
             setError(`Server responded with status ${err.response.status}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }

    } finally {
      setIsSubmitting(false);
    }
  };
  // --- End Submission Logic ---


  // --- Navigation Logic ---
  const totalSteps = 2;

  const nextStep = async () => {
    let fieldsToValidate: (keyof BuildingRegistrationFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['buildingName', 'building_address', 'location', 'propertyType', 'buildingImage'];
        break;
      case 2:
         // No fields to validate for 'next' from step 2, validation is on submit
        break;
      default:
        fieldsToValidate = [];
    }

    // Trigger validation for the fields specific to the current step
    // For step 2, this trigger won't do anything as fieldsToValidate is empty
    const isStepValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;


    if (isStepValid) {
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
            setError(null);
        }
    } else {
        console.log(`Step ${currentStep} validation failed`, errors);
        const firstErrorField = fieldsToValidate.find(field => errors[field]);
        if(firstErrorField) {
           setFocus(firstErrorField as any);
        }
    }
  };

  const prevStep = () => {
      setCurrentStep(prev => Math.max(1, prev - 1));
      setError(null);
  };

  // Form steps content - Now 2 steps
  const formStepsContent = {
    1: (
        <motion.div
          key={1}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
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
                  type="button"
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

          <div>
            <label htmlFor="building-image" className="block text-sm font-medium mb-2">Building Image</label>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {!imagePreview ? (
                <div className="text-center">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="building-image"
                  />
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
             {errors.buildingImage && (
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
         key={2}
         initial={{ x: 50, opacity: 0 }}
         animate={{ x: 0, opacity: 1 }}
         exit={{ x: -50, opacity: 0 }}
         transition={{ duration: 0.3 }}
         className="space-y-6"
       >
         <h3 className="text-xl font-semibold mb-4">Owner Details</h3>

         <div>
           <label htmlFor="owner_email" className="block text-sm font-medium mb-2">
             Owner Email
           </label>
           <div className="relative">
             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
             <input
               id="owner_email"
               type="email"
               {...register('owner_email')}
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

         <div>
           <label htmlFor="owner_phone" className="block text-sm font-medium mb-2">
             Owner Phone Number
           </label>
           <div className="relative">
             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
             <input
               id="owner_phone"
               type="tel"
               {...register('owner_phone')}
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

         <div>
           <label htmlFor="owner_address" className="block text-sm font-medium mb-2">Owner Address</label>
           <div className="relative">
             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
             <input
               id="owner_address"
               {...register('owner_address')}
               className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.owner_address ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:ring-2 focus:ring-primary-green`}
               placeholder="Enter owner's address"
             />
           </div>
           {errors.owner_address && (
             <p className="text-red-500 text-sm mt-1">{errors.owner_address.message}</p>
           )}
         </div>

        <div className="flex gap-4">
           <button
             type="button"
             onClick={prevStep}
             className="flex-1 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
           >
             Back
           </button>
           <button
             type="submit"
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
               animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
               transition={{ duration: 0.5 }}
            />

            {/* Step circles (Now 2 steps) */}
            {[1, 2].map((step) => (
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
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
              >
                 <AnimatePresence mode="wait" initial={false}>
                    {formStepsContent[currentStep as keyof typeof formStepsContent]}
                </AnimatePresence>

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
              <motion.div
                 key="success"
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
               </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};