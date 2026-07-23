import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { FAQItem } from "@/data/faqData";

interface FAQAccordionProps {
  items: FAQItem[];
  reduceMotion?: boolean | null;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ items, reduceMotion }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-[#8892A6] font-body-ui">
        No results found
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        return (
          <div
            key={item.id}
            className={`border rounded-2xl overflow-hidden transition-colors duration-200 focus-within:ring-2 focus-within:ring-[#4FE0C8] ${
              isExpanded
                ? "border-[#4FE0C8]/50 bg-[#0C1220]/80"
                : "border-[#1B2436] bg-[#0C1220]/40 hover:border-[#4FE0C8]/30"
            }`}
          >
            <button
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              onClick={() => toggleItem(item.id)}
              aria-expanded={isExpanded}
              aria-controls={`faq-answer-${item.id}`}
              id={`faq-question-${item.id}`}
            >
              <span className="font-necosmic font-medium text-lg text-[#E7EBF3]">
                {item.question}
              </span>
              <motion.div
                animate={{ rotate: isExpanded ? (reduceMotion ? 0 : 180) : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                className="text-[#4FE0C8] ml-4 shrink-0"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  id={`faq-answer-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-question-${item.id}`}
                  initial={{ height: reduceMotion ? "auto" : 0, opacity: reduceMotion ? 1 : 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: reduceMotion ? "auto" : 0, opacity: reduceMotion ? 1 : 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeInOut" }}
                >
                  <div className="px-6 pb-5 pt-1 text-[#8892A6] font-body-ui leading-relaxed">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
