import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Settings, Key, Rocket } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Key,
    title: "Sign Up & Setup",
    description: "Create your account and configure your property portfolio in minutes. Our smart onboarding process makes it easy to get started.",
    color: "from-primary-green to-emerald-400"
  },
  {
    id: 2,
    icon: Settings,
    title: "Customize & Connect",
    description: "Integrate your existing tools and customize the platform to match your workflow. Set up automated processes for maximum efficiency.",
    color: "from-blue-400 to-primary-blue"
  },
  {
    id: 3,
    icon: Rocket,
    title: "Launch & Scale",
    description: "Go live with your optimized property management system. Scale your operations effortlessly with our AI-powered platform.",
    color: "from-purple-400 to-pink-500"
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How It{' '}
            <span className="text-gradient-primary">Works</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Get started in three simple steps
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Timeline Line */}
          <div className="absolute top-24 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700" />
          
          {/* Steps */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-primary-green flex items-center justify-center font-bold text-primary-green">
                  {step.id}
                </div>

                {/* Card */}
                <div className="pt-8 h-full">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl h-full transform hover:scale-105 transition-transform">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} p-3 mb-6`}>
                      <step.icon className="w-full h-full text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-primary-green" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <button className="bg-gradient-primary px-8 py-3 rounded-full text-white hover:opacity-90 transition-all duration-300 transform hover:scale-105">
              Get Started Now
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}; 