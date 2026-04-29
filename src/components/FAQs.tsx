import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does the AI Live Assessment work?",
    answer: "AuraFit uses advanced pose estimation technology to track your body's key landmarks through your camera. It calculates joint angles and movement symmetry in real-time to provide immediate feedback on your form and technique."
  },
  {
    question: "Is my camera data stored or recorded?",
    answer: "No. Your privacy is our priority. All pose tracking and biomechanical analysis happen locally in your browser. No video or images are ever uploaded to our servers or stored permanently."
  },
  {
    question: "How accurate is the rep counting?",
    answer: "Our AI is highly accurate when you are positioned correctly in the camera's view (typically 5-8 feet away). It looks for specific biomechanical triggers like the bottom of a squat or full extension to count reps and ensure quality."
  },
  {
    question: "What is the Injury Risk Assessment?",
    answer: "This module analyzes your movement patterns over time to detect imbalances—like one hip dropping or knees caving in. Based on these findings, it suggests corrective exercises to help prevent common fitness-related injuries."
  },
  {
    question: "How do I get the best results from the AI Coach?",
    answer: "The more context you provide, the better. When chatting with the AI Coach, feel free to mention specific injuries, equipment you have available, or how you're feeling that day for highly personalized advice."
  },
  {
    question: "Can I use AuraFit on my mobile device?",
    answer: "Yes! AuraFit is fully responsive and designed to work on modern smartphones. For live assessments, we recommend propping your phone up at waist height and ensuring your full body is visible."
  }
];

export default function FAQs() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-full text-sm font-bold uppercase tracking-widest">
          <HelpCircle className="w-4 h-4" />
          Support Center
        </div>
        <h2 className="text-4xl font-bold tracking-tighter dark:text-[#EDEDED]">Frequently Asked Questions</h2>
        <p className="text-neutral-500 dark:text-[#A0A0A0] font-medium max-w-lg mx-auto">
          Need help? Here are the most common questions about AuraFit's AI technology and fitness features.
        </p>
      </header>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} faq={faq} index={index} />
        ))}
      </div>

      <div className="bg-neutral-900 dark:bg-[#1E1E1E] rounded-[2.5rem] p-10 text-white text-center space-y-6">
        <h3 className="text-2xl font-bold">Still have questions?</h3>
        <p className="text-neutral-400 dark:text-[#A0A0A0] font-medium">
          Our AI Coach is available 24/7 to answer specific questions about your fitness journey.
        </p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-coach'))}
          className="bg-brand text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105"
        >
          Ask the AI Coach
        </button>
      </div>
    </div>
  );
}

function AccordionItem({ faq, index }: { faq: FAQItem, index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-[#1E1E1E] rounded-3xl border border-neutral-100 dark:border-[#2A2A2A] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex items-center justify-between gap-4"
      >
        <span className="font-bold text-lg text-neutral-800 dark:text-[#EDEDED]">{faq.question}</span>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
          isOpen ? "bg-brand text-white" : "bg-neutral-100 dark:bg-[#121212] text-neutral-400 dark:text-[#A0A0A0]"
        )}>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 text-neutral-500 dark:text-[#A0A0A0] font-medium leading-relaxed">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
