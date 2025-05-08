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
  X
} from 'lucide-react';
import { useContactForm } from '@/hooks/useContactForm'; // Assuming this hook exists and provides submitForm, isSubmitting, isSuccess, error
import axiosInstance from '@/services/authService'; // Your existing axios instance

// --- Zod Schema ---
const contactSchema = z.object({
  buildingName: z.string().min(2, 'Building name is required'),
  buildingImage: z.any().optional(), // Handle image validation separately
  propertyType: z.enum(['residential', 'commercial', 'mixed'], {
    errorMap: () => ({ message: "Please select a property type" })
  }),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  address: z.string().min(5, 'Address is required'),
  message: z.string().optional()
});

type ContactFormData = z.infer<typeof contactSchema>;

// --- API Function (kept inside for single file component) ---
// Note: This might be redundant if useContactForm already does this.
// However, keeping it here to match original structure, but it's not used in onSubmit below.
export const contactApi = {
  create: async (formData: FormData) => {
    try {
      const { data } = await axiosInstance.post('api/contacts/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          console.log('Upload progress:', percentCompleted);
        },
      });
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};


// --- ContactSection Component ---
export const ContactSectionForm = () => {
  // State for multi-step form
  const [currentStep, setCurrentStep] = useState(1);
  // State for image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Use the custom hook for submission logic and state
  const { submitForm, isSubmitting, isSuccess, error } = useContactForm();

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    trigger,
    setValue,
    getValues, // Added to access image file for FormData
    setFocus // Added for optional focus on error
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues: {
      buildingName: '',
      propertyType: undefined,
      fullName: '',
      email: '',
      phone: '',
      address: '',
      message: ''
    }
  });

  // --- Image Handling Logic ---
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Client-side validation
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB'); // Consider a more integrated error display
        // Optionally clear the input
        const inputElement = document.getElementById('building-image') as HTMLInputElement;
        if (inputElement) inputElement.value = '';
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file'); // Consider a more integrated error display
         // Optionally clear the input
         const inputElement = document.getElementById('building-image') as HTMLInputElement;
         if (inputElement) inputElement.value = '';
        return;
      }

      setValue('buildingImage', file); // Update react-hook-form state
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string); // Update local state for preview
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setValue('buildingImage', undefined); // Clear react-hook-form state
    setImagePreview(null); // Clear local state
    // Clear the actual file input element value for re-uploading the same file
    const inputElement = document.getElementById('building-image') as HTMLInputElement;
    if (inputElement) {
        inputElement.value = '';
    }
  };
  // --- End Image Handling Logic ---


  // --- Submission Logic ---
  // Modified onSubmit to use the hook's submitForm and remove redundant API call
  const onSubmit = async (data: ContactFormData) => {
    console.log('Form data before submission:', data);
    try {
      const formData = new FormData();

      // Append all text fields
      Object.keys(data).forEach(key => {
        // Exclude image here, handle it specifically below. Also ensure value is not null/undefined/empty string for non-optional fields
        if (key !== 'buildingImage' && data[key] !== undefined && data[key] !== null && data[key] !== '') {
           // Ensure propertyType is appended as a string
          if (key === 'propertyType') {
             formData.append(key, data[key] as string);
          } else {
             formData.append(key, data[key]);
          }
        }
      });

      // Append the image file if it exists and is a File object
      const imageFile = getValues('buildingImage'); // Get value directly
      if (imageFile instanceof File) {
        console.log('Appending file:', imageFile.name);
        formData.append('buildingImage', imageFile, imageFile.name); // Append with filename
      } else {
        console.log('No file to append or invalid type:', imageFile);
      }

      // Debug: Log all form data entries
      console.log('FormData entries:');
      // Note: Can't easily log FormData contents directly, loop through entries
       for (let [key, value] of formData.entries()) {
         console.log(`${key}:`, value);
       }

      // Use the hook's submitForm which should handle the API call and state updates
      // Removed the direct `await contactApi.create(formData);` call
      await submitForm(formData);

      // The hook will handle setting isSuccess=true on success

    } catch (submissionError) {
      console.error('Submission Error:', submissionError);
      // The hook should ideally update the `error` state,
      // which you might want to display here.
    }
  };
  // --- End Submission Logic ---


  // --- Navigation Logic ---
  const nextStep = async () => {
    let fieldsToValidate: (keyof ContactFormData)[] = [];

    // Fields to validate for each step before proceeding
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['buildingName', 'propertyType'];
        // Note: image validation is manual currently, not triggered by RHF `trigger`
        break;
      case 2:
        fieldsToValidate = ['fullName', 'email', 'phone'];
        break;
      case 3: // No 'next' from step 3, validation happens on submit
        break;
      default:
        fieldsToValidate = [];
    }

    // Only trigger validation if there are fields specified for this step
    if (fieldsToValidate.length > 0) {
       const isStepValid = await trigger(fieldsToValidate);
       if (isStepValid) {
         setCurrentStep(prev => prev + 1);
       } else {
         console.log(`Step ${currentStep} validation failed`, errors); // Debug validation errors
         // Optional: focus the first field with an error
         const firstErrorField = fieldsToValidate.find(field => errors[field]);
         if(firstErrorField) {
            setFocus(firstErrorField);
         }
       }
    } else if (currentStep < 3) { // Allow moving if no specific fields to validate but not the last step
       setCurrentStep(prev => prev + 1);
    }
     // No action if currentStep is the last step (3)
  };

  const prevStep = () => {
      setCurrentStep(prev => Math.max(1, prev - 1)); // Prevent going below step 1
  };

  // Form steps content - consolidated for single component
  // Corrected the keys and structure to align with rendering logic
  const formStepsContent = {
    1: (
        <motion.div
          key={1} // Key for AnimatePresence
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div>
            <label htmlFor="buildingName" className="block text-sm font-medium mb-2">Building Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="buildingName"
                {...register('buildingName')}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green ${errors.buildingName ? 'border-red-500' : ''}`}
                placeholder="Enter building name"
              />
            </div>
            {errors.buildingName && (
              <p className="text-red-500 text-sm mt-1">{errors.buildingName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Building Image</label>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {!imagePreview ? (
                <div className="text-center">
                  <input
                    type="file"
                    accept="image/*"
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
                      (Max size: 5MB)
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
             {/* Add RHF error for image if validation was integrated */}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Property Type</label>
            <div className="grid grid-cols-3 gap-4">
              {['residential', 'commercial', 'mixed'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('propertyType', type as any, { shouldValidate: true })} // Validate on click
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
         initial={{ x: 20, opacity: 0 }}
         animate={{ x: 0, opacity: 1 }}
         exit={{ x: -20, opacity: 0 }}
         transition={{ duration: 0.3 }}
         className="space-y-6"
       >
         <div>
           <label htmlFor="fullName" className="block text-sm font-medium mb-2">
             Full Name
           </label>
           <input
             id="fullName"
             {...register('fullName')}
             className={`w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green ${errors.fullName ? 'border-red-500' : ''}`}
             placeholder="John Doe"
           />
           {errors.fullName && (
             <p className="text-red-500 text-sm mt-1">
               {errors.fullName.message}
             </p>
           )}
         </div>

         <div>
           <label htmlFor="email" className="block text-sm font-medium mb-2">
             Email
           </label>
           <div className="relative">
             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
             <input
               id="email"
               type="email"
               {...register('email')}
               className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green ${errors.email ? 'border-red-500' : ''}`}
               placeholder="john@example.com"
             />
           </div>
           {errors.email && (
             <p className="text-red-500 text-sm mt-1">
               {errors.email.message}
             </p>
           )}
         </div>

         <div>
           <label htmlFor="phone" className="block text-sm font-medium mb-2">
             Phone Number
           </label>
           <div className="relative">
             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
             <input
               id="phone"
               type="tel"
               {...register('phone')}
               className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green ${errors.phone ? 'border-red-500' : ''}`}
               placeholder="+1 (555) 000-0000"
             />
           </div>
           {errors.phone && (
             <p className="text-red-500 text-sm mt-1">
               {errors.phone.message}
             </p>
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
             type="button"
             onClick={nextStep}
             className="flex-1 py-3 rounded-lg bg-gradient-to-r from-primary-green to-primary-blue text-white hover:opacity-90 transition-opacity"
           >
             Next Step
           </button>
         </div>
       </motion.div>
    ),
    3: (
      <motion.div
        key={3} // Key for AnimatePresence
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-2">Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="address"
              {...register('address')}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green ${errors.address ? 'border-red-500' : ''}`}
              placeholder="Enter property address"
            />
          </div>
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">Additional Message</label>
          <textarea
            id="message"
            {...register('message')}
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green"
            placeholder="Any specific requirements or questions?"
          />
          {/* Message is optional, so no error message needed here */}
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
              'Submit Request'
            )}
          </button>
        </div>
      </motion.div>
    )
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
              Start Your{' '}
              <span className="bg-gradient-to-r from-primary-green to-primary-blue bg-clip-text text-transparent">
                Journey
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Transform your property management experience today
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-12 relative">
            {/* Background bar */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2" />

            {/* Progress bar */}
            <motion.div
               className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary-green to-primary-blue -translate-y-1/2 transition-all duration-300"
               initial={{ width: '0%' }}
               animate={{ width: `${((currentStep - 1) / 2) * 100}%` }} // (currentStep - 1) / (totalSteps - 1) * 100 -> (3-1)=2, (1-1)/2=0, (2-1)/2=0.5, (3-1)/2=1
               transition={{ duration: 0.5 }}
            />

            {/* Step circles */}
            {[1, 2, 3].map((step) => (
              <motion.div
                key={step}
                initial={{ scale: 0.8 }}
                animate={{
                  scale: currentStep >= step ? 1 : 0.8,
                  backgroundColor: currentStep >= step ? '#4ADE80' : (step === currentStep ? '#6EE7B7' : '#E5E7EB'), // Highlight current step lightly
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
              >
                 {/* Render the current step content with animation */}
                <AnimatePresence mode="wait">
                    {/* Use the formStepsContent object to render the current step */}
                    {formStepsContent[currentStep as keyof typeof formStepsContent]}
                </AnimatePresence>

                 {/* Optional: Display general submission error from hook */}
                {error && (
                   <div className="text-red-500 text-sm mt-4 text-center">
                       Submission failed: {error instanceof Error ? error.message : String(error)}
                   </div>
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
                 className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl" // Apply similar styling as form container
               >
                 <CheckCircle className="w-16 h-16 text-primary-green mx-auto mb-6" />
                 <h3 className="text-2xl font-bold mb-4">
                   Thank You for Reaching Out!
                 </h3>
                 <p className="text-gray-600 dark:text-gray-400">
                   We've received your request and will get back to you within 24 hours.
                 </p>
                  {/* Optional: Add a button to reset the form or navigate */}
                  {/* <button
                      type="button"
                      onClick={() => window.location.reload()} // Simple reset, or navigate programmatically
                      className="mt-6 py-3 px-6 rounded-lg bg-gradient-to-r from-primary-green to-primary-blue text-white hover:opacity-90 transition-opacity"
                  >
                      Submit another request
                  </button> */}
               </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};