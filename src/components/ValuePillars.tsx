import React from 'react';
import { Shield, Sliders, Archive, Check, X, Lock, EyeOff, FileText, Database } from 'lucide-react';
import { VALUE_PILLARS } from '../data/content';

export const ValuePillars: React.FC = () => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'calendar-is-yours':
        return <Shield className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />;
      case 'schedule-is-unique':
        return <Sliders className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />;
      case 'time-should-last':
        return <Archive className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />;
      default:
        return <FileText className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />;
    }
  };

  return (
    <section id="philosophy" className="py-20 md:py-28 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-stone-100/50 dark:bg-neutral-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Intro */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16 md:mb-20">
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Ownership Principles
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
            Scheduling built on ownership, not surveillance.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Where most scheduling tools force you into their rigid booking flow and harvest your calendar data for their own ends, Cadence gives you full control over how, when, and with whom your time is shared.
          </p>
        </div>

        {/* 3 Core Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {VALUE_PILLARS.map((pillar) => (
            <article
              key={pillar.id}
              id={`pillar-${pillar.id}`}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 flex flex-col justify-between shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    {getIcon(pillar.id)}
                  </div>
                  <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
                    {pillar.number}
                  </span>
                </div>

                <h3 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
                  {pillar.statement}
                </h3>

                <blockquote className="text-sm font-medium text-neutral-800 dark:text-neutral-200 border-l-2 border-neutral-300 dark:border-neutral-700 pl-3 italic">
                  &ldquo;{pillar.quote}&rdquo;
                </blockquote>

                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2">
                {pillar.points.map((pt, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Contrast Comparison Matrix */}
        <div className="mt-16 max-w-4xl mx-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/70">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              The Architecture of Respect
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              How local-first scheduling differs from cloud-monetized booking platforms.
            </p>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
            <div className="grid grid-cols-12 p-4 font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50/30 dark:bg-neutral-950/30">
              <div className="col-span-5 sm:col-span-6">Principle</div>
              <div className="col-span-4 sm:col-span-3 text-emerald-700 dark:text-emerald-400 font-semibold">Cadence</div>
              <div className="col-span-3 sm:col-span-3 text-neutral-400">Typical SaaS</div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-5 sm:col-span-6 font-medium text-neutral-800 dark:text-neutral-200">
                Data Storage & Privacy
              </div>
              <div className="col-span-4 sm:col-span-3 text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Local & Encrypted
              </div>
              <div className="col-span-3 sm:col-span-3 text-neutral-500 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5 text-rose-500" />
                Cloud database mined
              </div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-5 sm:col-span-6 font-medium text-neutral-800 dark:text-neutral-200">
                Data Portability
              </div>
              <div className="col-span-4 sm:col-span-3 text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Open .ics, JSON, CSV
              </div>
              <div className="col-span-3 sm:col-span-3 text-neutral-500 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5 text-rose-500" />
                Proprietary lock-in
              </div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-5 sm:col-span-6 font-medium text-neutral-800 dark:text-neutral-200">
                Tracking & Ad Pixels
              </div>
              <div className="col-span-4 sm:col-span-3 text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                0 trackers, 0 cookies
              </div>
              <div className="col-span-3 sm:col-span-3 text-neutral-500 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5 text-rose-500" />
                Trackers on booking page
              </div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-5 sm:col-span-6 font-medium text-neutral-800 dark:text-neutral-200">
                Focus Time Protection
              </div>
              <div className="col-span-4 sm:col-span-3 text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Auto-buffers & caps
              </div>
              <div className="col-span-3 sm:col-span-3 text-neutral-500 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5 text-neutral-400" />
                Rigid back-to-back
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
