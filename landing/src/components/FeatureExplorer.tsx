import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  PieChart, 
  Shield, 
  Users, 
  MessageSquare, 
  Calendar,
  Settings,
  Zap,
  ArrowRight
} from 'lucide-react';

interface Feature {
  id: number;
  icon: any;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  demo?: string;
}

const features: Feature[] = [
  {
    id: 1,
    icon: Building2,
    title: "Smart Property Management",
    description: "AI-powered system for efficient property oversight",
    benefits: [
      "Automated maintenance scheduling",
      "Real-time property monitoring",
      "Smart resource allocation"
    ],
    color: "from-primary-green to-emerald-400",
    demo: "https://your-demo-url.com/property"
  },
  {
    id: 2,
    icon: PieChart,
    title: "Advanced Analytics",
    description: "Deep insights into your property performance",
    benefits: [
      "Custom reporting dashboard",
      "Predictive analytics",
      "Revenue optimization"
    ],
    color: "from-blue-400 to-primary-blue",
    demo: "https://your-demo-url.com/analytics"
  },
  {
    id: 3,
    icon: Shield,
    title: "Security Suite",
    description: "Enterprise-grade security for your properties",
    benefits: [
      "24/7 monitoring",
      "Access control",
      "Incident reporting"
    ],
    color: "from-purple-400 to-pink-500",
    demo: "https://your-demo-url.com/security"
  }
];

export const FeatureExplorer = () => {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-grid-pattern" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Explore Our{' '}
            <span className="text-gradient-primary">
              Advanced Features
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Discover how our innovative features can transform your property management
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ 
                scale: 1.05,
                rotateY: mousePosition.x > window.innerWidth / 2 ? 5 : -5,
                rotateX: mousePosition.y > window.innerHeight / 2 ? -5 : 5
              }}
              className="relative group cursor-pointer"
              onClick={() => setSelectedFeature(feature)}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl h-full transform transition-all duration-300">
                {/* Feature Icon */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} p-4 mb-6`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {feature.description}
                </p>

                {/* Benefits List */}
                <ul className="space-y-3 mb-6">
                  {feature.benefits.map((benefit, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                    >
                      <Zap className="w-4 h-4 text-primary-green mr-2" />
                      {benefit}
                    </motion.li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-primary-green to-primary-blue text-white group-hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  <span>Explore Feature</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Demo Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">
                Try Our Interactive Demo
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Experience our features firsthand with our interactive demo. No signup required.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full bg-gradient-primary text-white hover:opacity-90 transition-opacity"
              >
                Launch Demo
              </motion.button>
            </div>
            
            <div className="relative h-64 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
              {/* Add interactive demo preview here */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Settings className="w-16 h-16 text-gray-400 animate-spin-slow" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}; 