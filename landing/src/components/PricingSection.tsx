import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info } from 'lucide-react';

interface PricingFeature {
  name: string;
  basic: boolean;
  pro: boolean;
  enterprise: boolean;
  tooltip?: string;
}

const features: PricingFeature[] = [
  {
    name: 'Property Units',
    basic: true,
    pro: true,
    enterprise: true,
    tooltip: 'Number of properties you can manage'
  },
  {
    name: 'Tenant Portal',
    basic: true,
    pro: true,
    enterprise: true
  },
  {
    name: 'Maintenance Requests',
    basic: true,
    pro: true,
    enterprise: true
  },
  {
    name: 'AI-Powered Analytics',
    basic: false,
    pro: true,
    enterprise: true,
    tooltip: 'Advanced analytics and predictions'
  },
  // Add more features...
];

export const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const getPrice = (base: number) => {
    const yearly = base * 12 * 0.8; // 20% discount for yearly
    return billingCycle === 'monthly' ? base : Math.round(yearly / 12);
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple,{' '}
            <span className="bg-gradient-to-r from-primary-green to-primary-blue bg-clip-text text-transparent">
              Transparent
            </span>{' '}
            Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your property management needs
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-primary-green to-primary-blue text-white'
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-primary-green to-primary-blue text-white'
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              Yearly
              <span className="ml-2 text-sm text-primary-green">Save 20%</span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {['Basic', 'Pro', 'Enterprise'].map((plan, index) => (
            <motion.div
              key={plan}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onHoverStart={() => setHoveredPlan(plan)}
              onHoverEnd={() => setHoveredPlan(null)}
              className={`relative p-8 rounded-2xl transition-all duration-300 ${
                hoveredPlan === plan
                  ? 'transform scale-105 shadow-2xl'
                  : 'shadow-xl'
              } ${
                plan === 'Pro'
                  ? 'bg-gradient-to-b from-primary-green to-primary-blue text-white'
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              {plan === 'Pro' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-white text-primary-green rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-4">{plan}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ${getPrice(plan === 'Basic' ? 99 : plan === 'Pro' ? 199 : 299)}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  /month
                </span>
              </div>

              <ul className="space-y-4 mb-8">
                {features.map((feature) => (
                  <li
                    key={feature.name}
                    className="flex items-center gap-2"
                  >
                    {feature[plan.toLowerCase() as keyof PricingFeature] ? (
                      <Check className="w-5 h-5 text-primary-green" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400" />
                    )}
                    <span>{feature.name}</span>
                    {feature.tooltip && (
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    )}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-full transition-all duration-300 ${
                  plan === 'Pro'
                    ? 'bg-white text-primary-blue hover:bg-gray-100'
                    : 'bg-gradient-to-r from-primary-green to-primary-blue text-white hover:opacity-90'
                }`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}; 