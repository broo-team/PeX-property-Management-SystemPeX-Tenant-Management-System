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
import { useContactForm } from '@/hooks/useContactForm';
import axiosInstance from '@/services/authService';

// Updated schema to include image and remove units
const contactSchema = z.object({
  buildingName: z.string().min(2, 'Building name is required'),
  buildingImage: z.any().optional(), // We'll handle image validation separately
  propertyType: z.enum(['residential', 'commercial', 'mixed']),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  address: z.string().min(5, 'Address is required'),
  message: z.string().optional()
});

type ContactFormData = z.infer<typeof contactSchema>;

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

export const ContactSection = () => {
  const { submitForm, isSubmitting, isSuccess, error } = useContactForm();

  const onSubmit = async (data: ContactFormData) => {
    try {
      const formData = new FormData();
      
      // Log the file before appending
      console.log('Building Image:', data.buildingImage);
      
      // Append all text fields
      Object.keys(data).forEach(key => {
        if (key !== 'buildingImage' && data[key]) {
          formData.append(key, data[key]);
        }
      });
      
      // Append the image file if it exists
      if (data.buildingImage instanceof File) {
        console.log('Appending file:', data.buildingImage.name);
        formData.append('buildingImage', data.buildingImage);
      } else {
        console.log('No file to append');
      }

      // Debug: Log all form data
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await contactApi.create(formData);
      console.log('Response:', response);
      
      await submitForm(formData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const [currentStep, setCurrentStep] = useState(1);

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid },
    watch,
    trigger,
    setValue 
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange'
  });

  const nextStep = async () => {
    let fieldsToValidate: string[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['buildingName', 'propertyType'];
        break;
      case 2:
        fieldsToValidate = ['fullName', 'email', 'phone'];
        break;
      default:
        fieldsToValidate = [];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setCurrentStep(prev => prev + 1);
  };

  // Add loading states for different form actions
  const [loadingStates, setLoadingStates] = useState({
    propertyCheck: false,
    addressValidation: false,
    finalSubmission: false
  });

  // Add state for image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      console.log('Setting file:', file);
      setValue('buildingImage', file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setValue('buildingImage', undefined);
    setImagePreview(null);
  };

  // Form steps content
  const formSteps = {
    2: (
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium mb-2">Building Name</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              {...register('buildingName')}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green"
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
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Property Type</label>
          <div className="grid grid-cols-3 gap-4">
            {['residential', 'commercial', 'mixed'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue('propertyType', type as any)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  watch('propertyType') === type
                    ? 'border-primary-green bg-primary-green/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
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

    3: (
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium mb-2">
            Full Name
          </label>
          <input
            {...register('fullName')}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green"
            placeholder="John Doe"
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            {...register('email')}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green"
            placeholder="john@example.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Phone Number
          </label>
          <input
            {...register('phone')}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green"
            placeholder="+1 (555) 000-0000"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
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

        <div>
          <label className="block text-sm font-medium mb-2">Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              {...register('address')}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green"
              placeholder="Enter property address"
            />
          </div>
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Additional Message</label>
          <textarea
            {...register('message')}
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green"
            placeholder="Any specific requirements or questions?"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
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
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2" />
            <div className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary-green to-primary-blue -translate-y-1/2 transition-all duration-300"
                 style={{ width: `${((currentStep - 1) / 2) * 100}%` }} />
            
            {[1, 2, 3].map((step) => (
              <motion.div
                key={step}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: currentStep >= step ? 1 : 0.8,
                  backgroundColor: currentStep >= step ? '#4ADE80' : '#E5E7EB'
                }}
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step 
                    ? 'bg-primary-green text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {step}
              </motion.div>
            ))}
          </div>

          {/* Form */}
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
                {currentStep === 1 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2">Building Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          {...register('buildingName')}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green"
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
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Property Type</label>
                      <div className="grid grid-cols-3 gap-4">
                        {['residential', 'commercial', 'mixed'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setValue('propertyType', type as any)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              watch('propertyType') === type
                                ? 'border-primary-green bg-primary-green/10'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-primary-green to-primary-blue text-white hover:opacity-90 transition-opacity"
                    >
                      Next Step
                    </button>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Full Name
                      </label>
                      <input
                        {...register('fullName')}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green"
                        placeholder="John Doe"
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <input
                        {...register('email')}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green"
                        placeholder="john@example.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone Number
                      </label>
                      <input
                        {...register('phone')}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green"
                        placeholder="+1 (555) 000-0000"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
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
                )}

                {currentStep === 3 && formSteps[3]}
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <CheckCircle className="w-16 h-16 text-primary-green mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">
                  Thank You for Reaching Out!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We'll get back to you within 24 hours.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}; 