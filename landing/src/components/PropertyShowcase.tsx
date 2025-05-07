import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { MapPin, Phone } from "lucide-react";
import axiosInstance from "@/services/authService";

interface Property {
  buildingId: string;
  promotion: {
    promotionImage: string;
    promotionDetails: {
      buildingName: string;
      address: string;
      phoneNumber: string;
      createdAt: string;
    };
  };
}

export const PropertyShowcase = () => {
  const [promotedProperties, setPromotedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const controls = useAnimation();

  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchPromotedProperties = async () => {
      try {
        const response = await axiosInstance.get("/api/promotions/promoted-properties");
        console.log("API Response:", response.data);
        if (response.data && response.data.data) {
          setPromotedProperties(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching promoted properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotedProperties();
  }, []);

  useEffect(() => {
    if (promotedProperties.length > 0) {
      controls.start({
        x: ["0%", "-100%"],
        transition: {
          repeat: Infinity,
          duration: 20,
          ease: "linear",
        },
      });
    }
  }, [controls, promotedProperties]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const duplicatedProperties = [...promotedProperties, ...promotedProperties];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Featured{" "}
            <span className="bg-gradient-to-r from-primary-green to-primary-blue bg-clip-text text-transparent">
              Properties
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover our handpicked selection of premium properties
          </p>
        </motion.div>

        <div className="overflow-hidden">
          <motion.div className="flex" animate={controls}>
            {duplicatedProperties.map((property, index) => (
              <motion.div
                key={`${property.buildingId}-${index}`}
                className="min-w-[300px] mx-4 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl"
                whileHover={{ scale: 1.05 }}
                onHoverStart={() => controls.stop()}
                onHoverEnd={() =>
                  controls.start({
                    x: ["0%", "-100%"],
                    transition: {
                      repeat: Infinity,
                      duration: 20,
                      ease: "linear",
                    },
                  })
                }
              >
                <div className="relative h-64">
                  <img
                    src={`${baseURL}/${property.promotion.promotionImage}`}
                    alt={property.promotion.promotionDetails.buildingName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', property.promotion.promotionImage);
                      e.currentTarget.src = '/fallback-image.jpg';
                    }}
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">
                    {property.promotion.promotionDetails.buildingName}
                  </h3>
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    {property.promotion.promotionDetails.address}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-primary-green to-primary-blue bg-clip-text text-transparent">
                      {new Date(property.promotion.promotionDetails.createdAt).toLocaleDateString()}
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <Phone className="w-4 h-4" />
                      {property.promotion.promotionDetails.phoneNumber}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
