import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, MessageCircle } from 'lucide-react';

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        id: 1,
        question: "How quickly can I get started with Ex Pex?",
        answer: "You can get started with Ex Pex in less than 5 minutes. Simply sign up, complete our smart onboarding process, and you'll be ready to manage your properties efficiently."
      },
      {
        id: 2,
        question: "Is there a free trial available?",
        answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start."
      }
    ]
  },
  {
    category: "Pricing & Plans",
    questions: [
      {
        id: 3,
        question: "Can I change my plan later?",
        answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."
      },
      {
        id: 4,
        question: "Do you offer custom enterprise solutions?",
        answer: "Yes, we provide customized enterprise solutions for large-scale property management operations. Contact our sales team for details."
      }
    ]
  },
  {
    category: "Features & Integration",
    questions: [
      {
        id: 5,
        question: "Can I integrate Ex Pex with my existing software?",
        answer: "Ex Pex supports integration with major property management tools, accounting software, and CRM systems through our API."
      },
      {
        id: 6,
        question: "Is mobile access available?",
        answer: "Yes, Ex Pex is fully responsive and also offers dedicated mobile apps for iOS and Android devices."
      }
    ]
  }
];

export const FAQSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openQuestions, setOpenQuestions] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const toggleQuestion = (questionId: number) => {
    setOpenQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => 
    !selectedCategory || category.category === selectedCategory
  );

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
            Frequently Asked{' '}
            <span className="text-gradient-primary">Questions</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Find answers to common questions about Ex Pex
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search your question..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-green bg-white dark:bg-gray-800"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2 rounded-full transition-all ${
                !selectedCategory 
                  ? 'bg-gradient-primary text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {faqs.map(category => (
              <button
                key={category.category}
                onClick={() => setSelectedCategory(category.category)}
                className={`px-6 py-2 rounded-full transition-all ${
                  selectedCategory === category.category
                    ? 'bg-gradient-primary text-white'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {category.category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          {filteredFaqs.map(category => (
            <div key={category.category} className="mb-8">
              {category.questions.length > 0 && (
                <h3 className="text-xl font-semibold mb-4">{category.category}</h3>
              )}
              
              <div className="space-y-4">
                {category.questions.map(faq => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleQuestion(faq.id)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <span className="font-medium">{faq.question}</span>
                      {openQuestions.includes(faq.id) ? (
                        <Minus className="w-5 h-5 text-primary-green" />
                      ) : (
                        <Plus className="w-5 h-5 text-primary-green" />
                      )}
                    </button>

                    <AnimatePresence>
                      {openQuestions.includes(faq.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-6 pb-4"
                        >
                          <p className="text-gray-600 dark:text-gray-400">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-primary p-8 rounded-2xl max-w-2xl mx-auto">
            <MessageCircle className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">
              Still Have Questions?
            </h3>
            <p className="text-white/90 mb-6">
              Can't find the answer you're looking for? Our team is here to help!
            </p>
            <button className="bg-white text-primary-blue px-8 py-3 rounded-full hover:bg-gray-100 transition-colors">
              Contact Support
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}; 