import { useState } from "react";
import { contactApi } from "../components/ContactSection";

export const useContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitForm = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await contactApi.create(formData);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit form");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    isSuccess,
    error,
    submitForm,
  };
};
