import React, { useState } from 'react';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';
import { FAQ_ITEMS } from '../data/content';
import { FaqItem } from '../types';

export const FAQSection: React.FC = () => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0, 1]); // first two open by default
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleAccordion = (index: number) => {
    if (openIndexes.includes(index)) {
      setOpenIndexes(openIndexes.filter(i => i !== index));
    } else {
      setOpenIndexes([...openIndexes, index]);
    }
  };

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'privacy', label: 'Privacy & Ownership' },
    { id: 'product', label: 'Buffers & Rules' },
    { id: 'compatibility', label: 'Calendars & Sync' },
    { id: 'pricing', label: 'Why Free?' },
  ];

  const filteredFaqs = FAQ_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="faq" className="py-20 md:py-28 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-stone-50/60 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Intro */}
        <div className="text-center space-y-4 mb-12">
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Frequently Answered
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
            Clear answers, zero obfuscation.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300">
            Everything you need to know about our local-first architecture, privacy guarantees, and everyday ergonomics.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-4 mb-10">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              id="faq-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search answers (e.g. buffers, privacy, google calendar, export)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 dark:focus:border-neutral-100 shadow-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                id={`faq-category-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List (At least 10 items) */}
        <div className="space-y-3" role="region" aria-label="Frequently Asked Questions">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs sm:text-sm">
              No questions found matching &ldquo;{searchQuery}&rdquo;. Try another term or reset filters.
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndexes.includes(idx);
              return (
                <div
                  key={idx}
                  id={`faq-item-${idx}`}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all overflow-hidden"
                >
                  <button
                    type="button"
                    id={`faq-toggle-${idx}`}
                    onClick={() => toggleAccordion(idx)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40"
                  >
                    <span className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 font-sans">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${idx}`}
                      className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60"
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-12 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Have an architectural question not answered here? Visit our{' '}
          <a href="#community" className="underline hover:text-neutral-900 dark:hover:text-neutral-100">
            community forum
          </a>{' '}
          or inspect the source documentation.
        </div>

      </div>
    </section>
  );
};
