import React from 'react';
import { Clock, ShieldCheck, Github, Radio } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="main-footer" className="border-t border-neutral-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 py-12 md:py-16 text-xs text-neutral-600 dark:text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand & Manifesto statement */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
              <div className="w-6 h-6 rounded bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-950">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-sm font-sans tracking-tight">Cadence</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm">
              The free and flexible scheduling app that puts you in control, not your calendar. Built on local-first principles with zero surveillance and open data formats.
            </p>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Network status: All local relay engines active</span>
            </div>
          </div>

          {/* Links 1: Product */}
          <div className="md:col-span-2 space-y-2.5">
            <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Product</div>
            <ul className="space-y-2">
              <li><a href="#philosophy" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Philosophy</a></li>
              <li><a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Adaptive Links</a></li>
              <li><a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Focus Buffers</a></li>
              <li><a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Team Coordination</a></li>
              <li><a href="#proof" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Dogfooding Policy</a></li>
            </ul>
          </div>

          {/* Links 2: Open Standards */}
          <div className="md:col-span-2 space-y-2.5">
            <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Standards</div>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">RFC 5545 (.ics)</a></li>
              <li><a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">CalDAV Sync</a></li>
              <li><a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">JSON Availability Schema</a></li>
              <li><a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Zero-Telemetry Protocol</a></li>
            </ul>
          </div>

          {/* Links 3: Community */}
          <div className="md:col-span-3 space-y-2.5">
            <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Community & Freedom</div>
            <ul className="space-y-2">
              <li><a href="#community" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Community Discord (18.4k)</a></li>
              <li><a href="#community" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Roadmap & Governance Forum</a></li>
              <li><a href="#community" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Developer Documentation</a></li>
              <li><a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Privacy Guarantee</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 dark:text-neutral-400">
          <div>
            © {new Date().getFullYear()} Cadence Project. Free without limits. Your schedule belongs to you.
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Zero Cookies • Zero Behavioral Pixels
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
