import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ArrowRight, ArrowLeft } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  image: string;
  content: string;
  rating: number;
  propertyType: string;
  location: string;
  experience: string;
}

const testimonials: Testimonial[] = [
    {
        id: 1,
        name: "Sarah Johnson",
        role: "Property Manager",
        company: "Urban Living Co.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80",
        content: "Ex Pex transformed our property management workflow. The AI-powered features saved us countless hours of work.",
        rating: 5,
        propertyType: "Luxury Apartments",
        location: "New York, NY",
        experience: "2 years with Ex Pex"
      },
      {
        id: 2,
        name: "Michael Chen",
        role: "Real Estate Developer",
        company: "Chen Properties",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80",
        content: "The analytics and reporting features have given us invaluable insights into our property performance.",
        rating: 5,
        propertyType: "Commercial Buildings",
        location: "San Francisco, CA",
        experience: "1.5 years with Ex Pex"
      },
      {
        id: 3,
        name: "Emily Rodriguez",
        role: "Property Owner",
        company: "Rodriguez Estates",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80",
        content: "Managing multiple properties has never been easier. The automation features are a game-changer.",
        rating: 5,
        propertyType: "Residential Properties",
        location: "Chicago, IL",
        experience: "3 years with Ex Pex"
      }
  // Add more testimonials...
];

export const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Property Manager",
      company: "Urban Living Co.",
      content: "Ex Pex transformed our property management workflow. The AI-powered features saved us countless hours of work. Highly recommended for any property management company looking to modernize their operations.",
      rating: 5,
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Real Estate Developer",
      company: "Chen Properties",
      content: "The analytics and reporting features have given us invaluable insights into our property performance. The platform is intuitive and the support team is exceptional.",
      rating: 5,
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "Property Owner",
      company: "Rodriguez Estates",
      content: "Managing multiple properties has never been easier. The automation features are a game-changer. I've been able to scale my business without scaling my team.",
      rating: 5,
    },
    {
      id: 4,
      name: "David Thompson",
      role: "Facility Manager",
      company: "Thompson Real Estate",
      content: "Outstanding platform that has revolutionized how we handle property management. The interface is clean and user-friendly. Couldn't be happier with the results.",
      rating: 5,
    },
    {
      id: 5,
      name: "Lisa Anderson",
      role: "Real Estate Investor",
      company: "Anderson Investments",
      content: "Ex Pex has streamlined our entire property management process. The automated reporting and tenant communication features are exceptional.",
      rating: 5,
    }
  ];

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400; // Adjust this value to control scroll distance
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
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
            What Our{' '}
            <span className="text-gradient-primary">
              Clients
            </span>{' '}
            Say
          </h2>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-end space-x-4 mb-8 px-4">
          <button
            onClick={() => scroll('left')}
            className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:scale-110 transition-transform"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:scale-110 transition-transform"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Testimonials Slider */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide gap-6 pb-8 -mx-4 px-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="min-w-[350px] md:min-w-[400px] bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
              style={{ scrollSnapAlign: 'start' }}
            >
              <Quote className="w-12 h-12 text-primary-green mb-6 opacity-50" />
              
              <p className="text-lg mb-8 text-gray-600 dark:text-gray-300">
                "{testimonial.content}"
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>

                <div>
                  <h4 className="text-xl font-bold bg-gradient-primary text-gradient-primary">
                    {testimonial.name}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}; 