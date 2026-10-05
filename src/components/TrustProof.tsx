import React from 'react';
import { ShieldCheck, HeartHandshake, History, Server, CheckCircle2, Lock } from 'lucide-react';
import { TRUST_FACTS } from '../data/content';

export const TrustProof: React.FC = () => {
  return (
    <section id="proof" className="py-20 md:py-28 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Intro */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Trust & Verifiable Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
            Trust built on transparency, not star ratings.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300">
            We don&apos;t use manufactured customer reviews or artificial scarcity timers. We prove our respect for your time through architectural choices and daily commitment.
          </p>
        </div>

        {/* Dogfooding Hero Card */}
        <div className="max-w-4xl mx-auto mb-16 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/70 p-8 sm:p-10 shadow-xs">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-sm">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Our Daily Guarantee</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 font-sans">
                Our own support team books every customer call through Cadence.
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                We refuse to build software that compromises the user&apos;s privacy because we rely on it ourselves every single morning. If a feature feels pushy, deceptive, or intrusive to us, it never enters Cadence.
              </p>
            </div>
          </div>
        </div>

        {/* Concrete Specific Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {TRUST_FACTS.map((fact, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-950/50 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-neutral-900 dark:text-neutral-50">
                  {fact.metric}
                </div>
                <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {fact.label}
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed border-t border-neutral-200/80 dark:border-neutral-800/80 pt-3">
                {fact.sublabel}
              </p>
            </div>
          ))}
        </div>

        {/* Real Named Use Cases (Transparent Proof) */}
        <div className="mt-16 max-w-4xl mx-auto rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 bg-white dark:bg-neutral-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 font-sans">
                Real Workflows in the Field
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Verified deployment architectures across professional disciplines.
              </p>
            </div>
            <div className="text-xs font-mono text-neutral-400">Zero Sponsored Placements</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/70 dark:border-neutral-800">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                Studio Monolith (Architecture)
              </div>
              <div className="text-[11px] font-mono text-neutral-500">Hamburg & Zurich</div>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Connects 12 partner CalDAV calendars to present single-window client reviews with 30-minute buffers between site visits.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/70 dark:border-neutral-800">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                Vanguard Legal Advisory
              </div>
              <div className="text-[11px] font-mono text-neutral-500">London</div>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Ensures strict client confidentiality by keeping appointment titles on hardware, preventing third-party cloud subpoena risks.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/70 dark:border-neutral-800">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                OpenCore Systems (Open Source)
              </div>
              <div className="text-[11px] font-mono text-neutral-500">Global Remote</div>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Maintains weekly community office hours using open .ics endpoints and markdown booking logs archived in Git.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
