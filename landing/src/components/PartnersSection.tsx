import { motion } from 'framer-motion';

const partners = [
  {
    id: 1,
    name: "Gebeya Store",
    logo: "ethiobetoch.png", // Replace with actual logo
    category: "find your dream home",
    description: "Leading Car Rental and Purchase",
    yearJoined: 2021
  },
  {
    id: 2,
    name: "Mekina Zone",
    logo: "mekinaZone.png", // Replace with actual logo
    category: "Your Car from your home",
    description: "Leading Car dealer",
    yearJoined: 2020
  },
  {
    id: 3,
    name: "Gebeya Store",
    logo: "gebya.png", // Replace with actual logo
    category: "Online Store",
    description: "Leading Online store",
    yearJoined: 2022
  },
  {
    id: 4,
    name: "Global Properties Ltd",
    logo: "Palmer.png", // Replace with actual logo
    category: "Real Estate",
    description: "International property management group",
    yearJoined: 2021
  },
  // Add more partners as needed
];

export const PartnersSection = () => {
  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Trusted by{' '}
            <span className="text-gradient-primary">
              Industry Leaders
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Partnering with the best in the business
          </p>
        </motion.div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              {/* Hexagon Shape Background */}
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity clip-hexagon" />
              
              {/* Partner Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-center mb-6">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="w-24 h-24 object-contain filter dark:invert"
                  />
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">{partner.name}</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-sm bg-gradient-primary text-white mb-3">
                    {partner.category}
                  </span>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {partner.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Partner since {partner.yearJoined}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
        >
          {[
            { label: 'Partner Companies', value: '50+' },
            { label: 'Countries', value: '5+' },
            { label: 'Properties Managed', value: '1K+' },
            { label: 'Success Rate', value: '99%' },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-900"
            >
              <h4 className="text-4xl font-bold text-gradient-primary mb-2">
                {stat.value}
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}; 