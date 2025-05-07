import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { PropertyShowcase } from '@/components/PropertyShowcase';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';
import { Loader2 } from 'lucide-react';
import { PricingSection } from './components/PricingSection';
import { PartnersSection } from './components/PartnersSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { FAQSection } from './components/FAQSection';
import { FeatureExplorer } from './components/FeatureExplorer';

export default function Dashboard() {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();
  const [isLoading, setIsLoading] = useState(true);
  const [showCookieConsent, setShowCookieConsent] = useState(() => {
    // Check if user has already accepted cookies
    return !localStorage.getItem('cookiesAccepted');
  });

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Handle cookie consent
  const handleAcceptCookies = () => {
    setShowCookieConsent(false);
    localStorage.setItem('cookiesAccepted', 'true');
  };

  const handleDeclineCookies = () => {
    setShowCookieConsent(false);
    localStorage.setItem('cookiesDeclined', 'true');
  };

  // SEO Meta tags
  useEffect(() => {
    document.title = 'PeX Property Management System';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'PeX Property Management System - Advanced property management platform with AI-powered solutions'
      );
    }
  }, []);

  // Scroll to section handler
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mb-4 mx-auto">
            <svg className="animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-white text-lg">Loading Ex Pex...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme}`}>
      <Navbar onNavigate={scrollToSection} />
      
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero Section */}
            <section id="home">
              <HeroSection />
            </section>


            {/* Property Showcase */}
            <section id="properties">
              <PropertyShowcase />
            </section>

            {/* Features Explorer */}
            <section id="featuresexplorer">
              <FeatureExplorer />
            </section>

            {/* Pricing Section */}

            <section id="pricingsection">
              <PricingSection />
            </section>

            <section id="howitworks">
              <HowItWorksSection />
            </section>

            {/* Testimonials */}
            <section id="testimonials">
              <TestimonialsSection />
            </section>  

            <section id="partners">
              <PartnersSection />
            </section>  

            <section id="faq">
              <FAQSection />
            </section>

            {/* Contact Form */}
            <section id="contact">
              <ContactSection />
            </section>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {/* Mobile Navigation Menu */}
      {isMobile && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="flex justify-around py-3">
            {['home', 'features', 'properties', 'contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="flex flex-col items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-green"
              >
                <span className="capitalize">{item}</span>
              </button>
            ))}
          </div>
        </motion.nav>
      )}

      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 right-6 p-3 rounded-full bg-gradient-to-r from-primary-green to-primary-blue text-white shadow-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </motion.button>

      {/* Cookie Consent Banner */}
      <AnimatePresence>
        {showCookieConsent && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-lg z-50"
          >
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
                We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleDeclineCookies}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptCookies}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-primary-green to-primary-blue text-white rounded-lg hover:opacity-90"
                >
                  Accept All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
