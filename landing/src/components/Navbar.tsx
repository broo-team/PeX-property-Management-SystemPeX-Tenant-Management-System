// src/components/layout/Navbar.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";
import { Sun, Moon, Menu, X } from "lucide-react";
import { Link } from "react-router-dom"; // <-- Added for navigation

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/10 dark:bg-black/10 backdrop-blur-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/ex.png" alt="Pex" className="h-8 w-auto" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary-green to-primary-blue bg-clip-text text-transparent">
              Pex Properties
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-6">
              {["Home", "Features", "Properties", "Pricing", "Contact"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-sm font-medium hover:text-primary-green transition-colors"
                  >
                    {item}
                  </a>
                )
              )}
              {/* Login Link */}
              <Link
                to="/auth/login"
                className="text-sm font-medium hover:text-primary-green transition-colors"
              >
                Login
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button className="px-6 py-2 rounded-full bg-gradient-to-r from-primary-green to-primary-blue text-white hover:opacity-90 transition-opacity">
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: isMobileMenuOpen ? 1 : 0,
          y: isMobileMenuOpen ? 0 : -20,
        }}
        transition={{ duration: 0.2 }}
        className={`md:hidden ${
          isMobileMenuOpen ? "block" : "hidden"
        } bg-white dark:bg-gray-900 border-t dark:border-gray-800`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col space-y-4">
            {["Home", "Features", "Properties", "Pricing", "Contact"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium hover:text-primary-green transition-colors"
                >
                  {item}
                </a>
              )
            )}
            {/* Mobile Login Link */}
            <Link
              to="/auth/login"
              className="text-sm font-medium hover:text-primary-green transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </motion.div>
    </nav>
  );
};