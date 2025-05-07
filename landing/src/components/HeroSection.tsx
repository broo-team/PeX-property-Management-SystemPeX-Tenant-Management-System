import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

const heroSlides = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80',
        title: 'Modern Living Spaces',
        description: 'Where innovation meets elegance in real estate'
      },
      {
        id: 2,
        image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80',
        title: 'Smart Property Solutions',
        description: 'Advanced technology for seamless management'
      },
      {
        id: 3,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80',
        title: 'Luxury Living',
        description: 'Experience the pinnacle of residential comfort'
      }
];

const categories = [
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'luxury', label: 'Luxury Properties' }
];

export const HeroSection = () => {
  const [activeCategory, setActiveCategory] = useState('residential');

  return (
    <section className="relative h-screen">
      <Swiper
        modules={[Autoplay, EffectFade, Navigation]}
        effect="fade"
        autoplay={{ delay: 5000 }}
        navigation
        loop
        className="h-full"
      >
        {heroSlides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative h-full">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
                <div className="container mx-auto px-4 h-full flex items-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-3xl"
                  >
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                      {slide.title}
                    </h1>
                    <p className="text-xl text-white/90 mb-8">
                      {slide.description}
                    </p>
                    <div className="flex gap-4">
                      <button className="px-8 py-3 rounded-full bg-gradient-to-r from-primary-green to-primary-blue text-white hover:opacity-90 transition-all duration-300 transform hover:scale-105">
                        Get Started
                      </button>
                      <button className="px-8 py-3 rounded-full border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-300">
                        Learn More
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Floating Category Pills */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-2 p-2 bg-white/10 backdrop-blur-md rounded-full"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                activeCategory === category.id
                  ? 'bg-gradient-to-r from-primary-green to-primary-blue text-white'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              {category.label}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}; 