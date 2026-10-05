import React from 'react';
import { Download, ExternalLink, MessageSquare, Compass, Code2, ArrowUpRight, Check, Heart, Shield } from 'lucide-react';
import { Platform } from '../types';
import { COMMUNITY_CARDS } from '../data/content';
import { LiveDemoButton } from './LiveDemoButton';

interface ClosingCTAProps {
  detectedOS: Platform;
  onOpenDownload: () => void;
  onChangeOS: (os: Platform) => void;
}

export const ClosingCTA: React.FC<ClosingCTAProps> = ({
  detectedOS,
  onOpenDownload,
  onChangeOS,
}) => {
  const getOsLabel = (os: Platform) => {
    switch (os) {
      case 'windows': return 'Windows';
      case 'macos': return 'macOS';
      case 'linux': return 'Linux';
      case 'web': return 'Web Companion';
    }
  };

  const getCardIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />;
      case 'Code2':
        return <Code2 className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />;
      default:
        return <Compass className="w-5 h-5" />;
    }
  };

  return (
    <section id="community" className="py-20 md:py-28 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* Decisive Primary Call-to-Action */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-stone-100/60 dark:bg-neutral-950 p-8 sm:p-14 text-center space-y-6 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-neutral-200/70 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Free without limits • Zero telemetry</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
            Ready to own your time?
          </h2>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto leading-relaxed">
            Install Cadence today. Take control of your availability, shield your focus rituals, and share time on your own terms.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              id="closing-primary-cta-btn"
              onClick={onOpenDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-white shadow-md active:scale-[0.99] transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Get Cadence for {getOsLabel(detectedOS)}</span>
            </button>

            <LiveDemoButton
              label="See a live demo"
              variant="secondary"
              className="w-full sm:w-auto px-6 py-3.5"
            />
          </div>

          {/* Alternative OS Switcher */}
          <div className="pt-2 text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>Also available for:</span>
            {(['macos', 'windows', 'linux', 'web'] as Platform[])
              .filter(p => p !== detectedOS)
              .map(platform => (
                <button
                  key={platform}
                  type="button"
                  id={`closing-os-switch-${platform}`}
                  onClick={() => onChangeOS(platform)}
                  className="underline hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  {getOsLabel(platform)}
                </button>
              ))}
          </div>
        </div>

        {/* Soft Landing Community Section (Obsidian-Style) */}
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 font-sans">
              Not ready to download? Explore the ecosystem.
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Cadence is sustained by an active, thoughtful global community of people who value focus, privacy, and digital craftsmanship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COMMUNITY_CARDS.map((card, idx) => (
              <div
                key={idx}
                id={`community-card-${idx}`}
                className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-950/50 flex flex-col justify-between space-y-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                      {getCardIcon(card.iconName)}
                    </div>
                    <span className="text-xs font-mono text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors flex items-center gap-0.5">
                      {card.destination}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 font-sans">
                    {card.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {card.valueStatement}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-200/70 dark:border-neutral-800/70 text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                  {card.meta}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
