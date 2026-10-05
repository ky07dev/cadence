import React, { useState } from 'react';
import { Download, ChevronDown, Check, Shield, Lock, Laptop, Sparkles, ExternalLink, RefreshCw, Calendar, Clock, Coffee } from 'lucide-react';
import { Platform } from '../types';
import { HERO_CONTENT } from '../data/content';
import { LiveDemoButton } from './LiveDemoButton';

interface HeroProps {
  detectedOS: Platform;
  onChangeOS: (os: Platform) => void;
  onOpenDownload: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  detectedOS,
  onChangeOS,
  onOpenDownload,
}) => {
  const [osDropdownOpen, setOsDropdownOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>('14:30');
  const [bufferActive, setBufferActive] = useState(true);

  const getOsDisplayName = (os: Platform) => {
    switch (os) {
      case 'windows': return 'Windows';
      case 'macos': return 'macOS';
      case 'linux': return 'Linux';
      case 'web': return 'Web App';
    }
  };

  const platforms: { id: Platform; name: string; note: string }[] = [
    { id: 'windows', name: 'Windows', note: 'x64 & ARM64 installer (.msi / .exe)' },
    { id: 'macos', name: 'macOS', note: 'Apple Silicon & Intel (.dmg)' },
    { id: 'linux', name: 'Linux', note: 'AppImage, .deb, Flatpak' },
    { id: 'web', name: 'Web Companion', note: 'Offline PWA in your browser' },
  ];

  return (
    <section id="hero-section" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Background architectural grid pattern - quiet, low contrast */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          
          {/* Subtle status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-neutral-200/70 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-neutral-300/60 dark:border-neutral-700/60 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{HERO_CONTENT.badge}</span>
          </div>

          {/* Headline - exact PRD: max 10 words */}
          <h1
            id="hero-headline"
            className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans leading-[1.08]"
          >
            {HERO_CONTENT.headline}
          </h1>

          {/* Subheadline - exact PRD: max 25 words */}
          <p
            id="hero-subheadline"
            className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 font-normal leading-relaxed max-w-2xl mx-auto"
          >
            {HERO_CONTENT.subheadline}
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {/* Primary CTA with OS selector */}
            <div className="relative inline-flex rounded-lg shadow-sm w-full sm:w-auto">
              <button
                type="button"
                id="hero-primary-cta-btn"
                onClick={onOpenDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-l-lg sm:rounded-r-none rounded-r-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 font-medium text-sm hover:bg-neutral-800 dark:hover:bg-white active:scale-[0.99] transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Get Cadence for {getOsDisplayName(detectedOS)}</span>
              </button>
              <button
                type="button"
                id="hero-os-dropdown-trigger"
                onClick={() => setOsDropdownOpen(!osDropdownOpen)}
                aria-label="Select alternative operating system"
                className="hidden sm:inline-flex items-center px-2.5 rounded-r-lg border-l border-neutral-700 dark:border-neutral-300 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* OS Dropdown */}
              {osDropdownOpen && (
                <div
                  id="hero-os-dropdown-menu"
                  className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-72 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl z-50 p-1.5 space-y-1 text-left"
                >
                  <div className="px-2.5 py-1 text-[11px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    Available Platforms
                  </div>
                  {platforms.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      id={`hero-os-select-${p.id}`}
                      onClick={() => {
                        onChangeOS(p.id);
                        setOsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs text-left transition-colors ${
                        detectedOS === p.id
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 font-medium'
                          : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">{p.name}</div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{p.note}</div>
                      </div>
                      {detectedOS === p.id && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Secondary CTA (Cal.com Native Modal Overlay) */}
            <LiveDemoButton
              label={HERO_CONTENT.secondaryCta}
              variant="secondary"
              className="w-full sm:w-auto"
            />
          </div>

          {/* Micro-copy value proofs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-neutral-500 dark:text-neutral-400">
            {HERO_CONTENT.microCopy.map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Hero Interactive Showcase: "Show Don't Tell" Cadence Local Calendar */}
        <div className="mt-12 md:mt-16 max-w-4xl mx-auto">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden transition-all">
            {/* Window header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span className="ml-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                  cadence://schedule/elena-advisory
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  id="hero-toggle-buffer-mode"
                  onClick={() => setBufferActive(!bufferActive)}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-mono transition-colors flex items-center gap-1.5 ${
                    bufferActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  {bufferActive ? '15m Focus Buffer Active' : 'Buffers Disabled'}
                </button>
                <div className="hidden sm:flex items-center gap-1 text-neutral-500 dark:text-neutral-400 text-[11px] font-mono">
                  <Lock className="w-3 h-3 text-emerald-500" /> Local Cryptographic State
                </div>
              </div>
            </div>

            {/* Interactive Schedule View */}
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Booking Persona & Details */}
              <div className="lg:col-span-5 space-y-4 pr-0 lg:pr-4 lg:border-r border-neutral-200 dark:border-neutral-800">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 flex items-center justify-center font-serif text-lg font-semibold shrink-0">
                    E
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Elena Rostova</h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Independent Architecture Advisor</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-300">
                      <Clock className="w-3 h-3 opacity-70" />
                      <span>30-Minute Advisory Consultation</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-2 text-neutral-600 dark:text-neutral-300">
                  <p className="font-medium text-neutral-900 dark:text-neutral-200">
                    &ldquo;My calendar respects my deep work blocks and lunch hour automatically.&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-1 border-t border-neutral-200 dark:border-neutral-700/60">
                    <span>Time Zone: Europe/Berlin (CET)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">Direct CalDAV</span>
                  </div>
                </div>

                {/* Selected Slot summary */}
                <div className="rounded-lg p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-neutral-400">Selected Booking</div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                    <span>Thursday, Sep 24 • {selectedSlot || 'Select a time'}</span>
                    <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                      Available
                    </span>
                  </div>
                  <LiveDemoButton
                    label="Confirm in Live Demo →"
                    variant="primary"
                    className="w-full mt-2 text-xs py-2"
                  />
                </div>
              </div>

              {/* Right Column: Interactive Day Timeline */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Thursday Schedule • Elena&apos;s Availability
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Click any open slot to preview
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {/* Standup */}
                  <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-800/40 text-xs flex items-center justify-between opacity-85">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                      <span className="font-mono text-neutral-500 dark:text-neutral-400">09:00 - 09:30</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-300">Architecture Standup</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">Busy</span>
                  </div>

                  {/* Buffer if active */}
                  {bufferActive && (
                    <div className="px-3 py-1 rounded border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-mono">
                      <span>09:30 - 09:45 (15m Cadence Transition Buffer)</span>
                      <span>Protected</span>
                    </div>
                  )}

                  {/* Morning Open Slot */}
                  <button
                    type="button"
                    id="hero-slot-1000"
                    onClick={() => setSelectedSlot('10:00')}
                    className={`w-full p-2.5 rounded-lg border text-xs text-left flex items-center justify-between transition-all ${
                      selectedSlot === '10:00'
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100/90 dark:bg-neutral-800 font-semibold'
                        : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/10 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-mono text-neutral-900 dark:text-neutral-100">10:00 - 10:30</span>
                      <span className="text-neutral-700 dark:text-neutral-300">Open Advisory Window</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">Bookable</span>
                  </button>

                  {/* Lunch Block - Protected */}
                  <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/20 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="font-mono text-neutral-500 dark:text-neutral-400">12:00 - 13:30</span>
                      <span className="font-medium text-amber-900 dark:text-amber-200">Protected Lunch & Walk Ritual</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">Shielded</span>
                  </div>

                  {/* Buffer after lunch if active */}
                  {bufferActive && (
                    <div className="px-3 py-1 rounded border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-mono">
                      <span>13:30 - 13:45 (15m Cadence Transition Buffer)</span>
                      <span>Protected</span>
                    </div>
                  )}

                  {/* Afternoon Open Slot */}
                  <button
                    type="button"
                    id="hero-slot-1430"
                    onClick={() => setSelectedSlot('14:30')}
                    className={`w-full p-2.5 rounded-lg border text-xs text-left flex items-center justify-between transition-all ${
                      selectedSlot === '14:30'
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100/90 dark:bg-neutral-800 font-semibold'
                        : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/10 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-mono text-neutral-900 dark:text-neutral-100">14:30 - 15:00</span>
                      <span className="text-neutral-700 dark:text-neutral-300">Open Advisory Window</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">Recommended</span>
                  </button>

                  {/* Late Deep Work Block */}
                  <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-800/30 text-xs flex items-center justify-between opacity-80">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span className="font-mono text-neutral-500 dark:text-neutral-400">16:00 - 18:00</span>
                      <span className="text-neutral-700 dark:text-neutral-400">Deep Work: System Architecture Plan</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">Quiet Block</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
