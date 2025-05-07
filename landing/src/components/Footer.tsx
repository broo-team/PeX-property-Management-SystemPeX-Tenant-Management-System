import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  ArrowRight,
  CheckCircle,
  Loader2,
  PhoneCall
} from 'lucide-react';

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubscriptionStatus('success');
      setEmail('');
    } catch (error) {
      setSubscriptionStatus('error');
    } finally {
      setIsSubscribing(false);
      setTimeout(() => setSubscriptionStatus('idle'), 3000);
    }
  };

  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-green to-primary-blue rounded-lg" />
              <span className="text-2xl font-bold">Ex Pex</span>
            </div>
            <p className="text-gray-400">
              Transforming property management with innovative solutions and cutting-edge technology.
            </p>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{ y: -3 }}
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gradient-to-r from-primary-green to-primary-blue transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              {['About Us', 'Features', 'Pricing', 'Blog', 'Contact'].map((link) => (
                <li key={link}>
                  <motion.a
                    href="#"
                    className="text-gray-400 hover:text-white flex items-center group"
                    whileHover={{ x: 5 }}
                  >
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-5 h-5 text-primary-green" />
                <span>support@pexproperties.com</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-5 h-5 text-primary-green" />
                
                <span>+251 929 16 51 00/01/02</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <PhoneCall className="w-5 h-5 text-primary-green" />

                <span>+251 118 58 57 79</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <MapPin className="w-5 h-5 text-primary-green" />
                <span>Lancha<br />Global Hotel ground floor</span>
                
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Newsletter</h3>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <p className="text-gray-400">
                Subscribe to our newsletter for updates and insights.
              </p>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-green"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gradient-to-r from-primary-green to-primary-blue disabled:opacity-50"
                >
                  {isSubscribing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </button>
              </div>
              <AnimatePresence>
                {subscriptionStatus !== 'idle' && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-sm flex items-center ${
                      subscriptionStatus === 'success' ? 'text-primary-green' : 'text-red-500'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {subscriptionStatus === 'success' 
                      ? 'Successfully subscribed!' 
                      : 'Something went wrong. Please try again.'}
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Pex Properties. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}; 