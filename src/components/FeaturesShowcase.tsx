import React, { useState } from 'react';
import { 
  Link2, Shield, Users, Smartphone, Share2, 
  Check, Calendar, Clock, Lock, Sparkles, Download, 
  Laptop, Tablet, ArrowRight, Eye, RefreshCw, Copy
} from 'lucide-react';
import { FEATURES } from '../data/content';

export const FeaturesShowcase: React.FC = () => {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  // Feature 1 interactive state: Smart Booking Links
  const [lunchProtected, setLunchProtected] = useState(true);
  const [standupProtected, setStandupProtected] = useState(true);

  // Feature 2 interactive state: Buffers & Rules
  const [bufferDuration, setBufferDuration] = useState<number>(15);
  const [dailyCap, setDailyCap] = useState<number>(3);

  // Feature 3 interactive state: Team Coordination
  const [selectedTeammates, setSelectedTeammates] = useState<{ [key: string]: boolean }>({
    alex: true,
    sam: true,
    elena: true,
  });

  // Feature 4 interactive state: Sync Everywhere
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [syncedEventTitle, setSyncedEventTitle] = useState('Product Architecture Review');

  // Feature 5 interactive state: Open Export
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const toggleTeammate = (id: string) => {
    setSelectedTeammates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExportDownload = (type: 'ics' | 'json') => {
    let content = '';
    let filename = '';
    let mime = '';

    if (type === 'ics') {
      content = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Cadence//CalDAV Client//EN\nBEGIN:VEVENT\nSUMMARY:${syncedEventTitle}\nDTSTART:20260924T140000Z\nDTEND:20260924T144500Z\nDESCRIPTION:Exported from Cadence open calendar.\nEND:VEVENT\nEND:VCALENDAR`;
      filename = 'cadence-schedule.ics';
      mime = 'text/calendar';
    } else {
      content = JSON.stringify({
        schema: 'cadence.open-schedule.v1',
        exportedAt: new Date().toISOString(),
        events: [
          { title: syncedEventTitle, start: '14:00', end: '14:45', bufferMinutes: bufferDuration, host: 'you@cadence.local' }
        ]
      }, null, 2);
      filename = 'cadence-schedule.json';
      mime = 'application/json';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopiedFormat(type.toUpperCase());
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const currentFeature = FEATURES[activeFeatureIndex];

  return (
    <section id="features" className="py-20 md:py-28 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-stone-50/50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Intro */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Show, Don&apos;t Tell
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
            Every feature serves your autonomy.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300">
            Cadence does not treat your daily life as a booking conveyor belt. Explore how our calm, deliberate tools work below.
          </p>
        </div>

        {/* Feature Navigation Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {FEATURES.map((feat, idx) => {
            const isSelected = idx === activeFeatureIndex;
            return (
              <button
                key={feat.id}
                type="button"
                id={`feature-tab-${feat.id}`}
                onClick={() => setActiveFeatureIndex(idx)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {feat.name}
              </button>
            );
          })}
        </div>

        {/* Interactive Feature Stage */}
        <div className="max-w-5xl mx-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden">
          
          {/* Feature Header bar */}
          <div className="p-6 sm:p-8 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{currentFeature.microHeadline}</span>
            </div>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 font-sans">
              {currentFeature.name}
            </h3>
            <p className="text-base text-neutral-600 dark:text-neutral-300">
              {currentFeature.benefit}
            </p>
          </div>

          {/* Interactive Playground Content */}
          <div className="p-6 sm:p-8 bg-neutral-50/50 dark:bg-neutral-950/50">

            {/* DEMO 1: Smart Booking Links */}
            {currentFeature.id === 'smart-links' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">Shareable Private Link</div>
                    <div className="text-sm font-mono text-neutral-900 dark:text-neutral-100 font-medium">
                      cadence.app/book/elena-30m
                    </div>
                  </div>
                  
                  {/* Controls to test the adaptability */}
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      id="smart-links-toggle-lunch"
                      onClick={() => setLunchProtected(!lunchProtected)}
                      className={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
                        lunchProtected
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-medium'
                          : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'
                      }`}
                    >
                      {lunchProtected ? '✓ Lunch Block Protected' : '+ Shield Lunch'}
                    </button>
                    <button
                      type="button"
                      id="smart-links-toggle-standup"
                      onClick={() => setStandupProtected(!standupProtected)}
                      className={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
                        standupProtected
                          ? 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium'
                          : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'
                      }`}
                    >
                      {standupProtected ? '✓ Recurring Standup Synced' : '+ Sync Standup'}
                    </button>
                  </div>
                </div>

                {/* Adaptive Time Slots View */}
                <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
                  <div className="flex items-center justify-between text-xs text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      Live Guest Availability for Thursday
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      Auto-Adjusts In Real Time
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* 09:00 slot */}
                    {standupProtected ? (
                      <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/30 text-xs opacity-50 flex flex-col justify-between">
                        <span className="font-mono text-neutral-400">09:00 - 09:30</span>
                        <span className="text-[10px] text-neutral-400">Conflict: Standup</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs flex flex-col justify-between">
                        <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium">09:00 - 09:30</span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Available</span>
                      </div>
                    )}

                    {/* 10:30 slot */}
                    <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs flex flex-col justify-between shadow-xs">
                      <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium">10:30 - 11:00</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Available</span>
                    </div>

                    {/* 12:00 slot */}
                    {lunchProtected ? (
                      <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-950 bg-amber-50/40 dark:bg-amber-950/20 text-xs opacity-75 flex flex-col justify-between">
                        <span className="font-mono text-amber-800 dark:text-amber-400">12:00 - 13:00</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-500">Shielded: Lunch</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs flex flex-col justify-between">
                        <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium">12:00 - 12:30</span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Available</span>
                      </div>
                    )}

                    {/* 14:00 slot */}
                    <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs flex flex-col justify-between shadow-xs">
                      <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium">14:00 - 14:30</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Available</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                    Example: When you create a personal lunch block or standup on your personal calendar, Cadence immediately recalculates your public link with zero manual reconfiguration.
                  </p>
                </div>
              </div>
            )}

            {/* DEMO 2: Buffers & Rules */}
            {currentFeature.id === 'buffers-rules' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Slider for buffer duration */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          Automatic Buffer Duration:
                        </span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {bufferDuration} minutes
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[0, 10, 15, 30].map(mins => (
                          <button
                            key={mins}
                            type="button"
                            id={`buffer-mins-${mins}`}
                            onClick={() => setBufferDuration(mins)}
                            className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                              bufferDuration === mins
                                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 font-medium'
                                : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                            }`}
                          >
                            {mins === 0 ? 'Off' : `${mins}m`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Daily cognitive cap */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          Daily Cognitive Cap (Max Calls):
                        </span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {dailyCap} calls max
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[2, 3, 4, 5].map(cap => (
                          <button
                            key={cap}
                            type="button"
                            id={`daily-cap-${cap}`}
                            onClick={() => setDailyCap(cap)}
                            className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                              dailyCap === cap
                                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 font-medium'
                                : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                            }`}
                          >
                            {cap}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day view timeline showing the buffer effect */}
                <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
                  <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 pb-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <span>Timeline Preview with Automated Protection</span>
                    <span className="font-mono text-xs text-neutral-400">
                      Cap: {dailyCap} calls / day
                    </span>
                  </div>

                  {/* Meeting 1 */}
                  <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs flex items-center justify-between">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">10:00 - 10:45 • Client Strategy Call (1/{dailyCap})</span>
                    <span className="text-[10px] font-mono text-neutral-500">Booked</span>
                  </div>

                  {/* Buffer 1 */}
                  {bufferDuration > 0 && (
                    <div className="px-3 py-1.5 rounded border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                      <span>🛡️ 10:45 - {10 + Math.floor((45 + bufferDuration)/60)}:{((45 + bufferDuration)%60).toString().padStart(2, '0')} ({bufferDuration}m breathing room & notes recovery)</span>
                      <span>Shielded</span>
                    </div>
                  )}

                  {/* Meeting 2 */}
                  <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs flex items-center justify-between">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">14:00 - 14:30 • Advisory Check-in (2/{dailyCap})</span>
                    <span className="text-[10px] font-mono text-neutral-500">Booked</span>
                  </div>

                  {/* Buffer 2 */}
                  {bufferDuration > 0 && (
                    <div className="px-3 py-1.5 rounded border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                      <span>🛡️ 14:30 - 14:{30 + bufferDuration} ({bufferDuration}m focus transition)</span>
                      <span>Shielded</span>
                    </div>
                  )}

                  {/* Final block: protected deep work */}
                  <div className="p-2.5 rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 text-xs flex items-center justify-between">
                    <span className="font-medium text-purple-900 dark:text-purple-300">16:00 - 18:00 • Protected Deep Work Block</span>
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">Zero Incursions</span>
                  </div>
                </div>
              </div>
            )}

            {/* DEMO 3: Team Coordination */}
            {currentFeature.id === 'team-coordination' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                    Toggle Teammate Calendar Overlays (Zero-Knowledge Privacy Masks)
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      id="team-toggle-alex"
                      onClick={() => toggleTeammate('alex')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                        selectedTeammates.alex
                          ? 'border-blue-300 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 bg-neutral-50 dark:bg-neutral-900 opacity-60'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Alex (Engineering)</span>
                    </button>

                    <button
                      type="button"
                      id="team-toggle-sam"
                      onClick={() => toggleTeammate('sam')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                        selectedTeammates.sam
                          ? 'border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 bg-neutral-50 dark:bg-neutral-900 opacity-60'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Sam (Product)</span>
                    </button>

                    <button
                      type="button"
                      id="team-toggle-elena"
                      onClick={() => toggleTeammate('elena')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                        selectedTeammates.elena
                          ? 'border-purple-300 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 bg-neutral-50 dark:bg-neutral-900 opacity-60'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>Elena (Design)</span>
                    </button>
                  </div>
                </div>

                {/* Shared Overlay Day Matrix */}
                <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
                  <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 pb-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <span>Merged Consensus Window for Friday</span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      Mutual Green Opening Detected
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between opacity-70">
                      <span className="font-mono">10:00 - 11:00</span>
                      <span className="text-[11px] text-neutral-500">Alex & Elena Busy (Private Time Mask)</span>
                    </div>

                    <div className="p-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between opacity-70">
                      <span className="font-mono">11:30 - 12:30</span>
                      <span className="text-[11px] text-neutral-500">Sam Busy</span>
                    </div>

                    {/* Shared Green Window */}
                    <div className="p-3.5 rounded-lg border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <div>
                          <div className="font-semibold text-emerald-900 dark:text-emerald-100 font-mono text-sm">
                            14:00 - 15:00 (Mutual Consensus Opening)
                          </div>
                          <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                            All {Object.values(selectedTeammates).filter(Boolean).length} selected teammates are simultaneously free
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-medium text-xs">
                        Book All in 1-Click
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DEMO 4: Sync Everywhere */}
            {currentFeature.id === 'sync-everywhere' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="inline-flex p-1 rounded-lg bg-neutral-200/60 dark:bg-neutral-800/60 border border-neutral-300/60 dark:border-neutral-700/60">
                    <button
                      type="button"
                      id="device-tab-desktop"
                      onClick={() => setActiveDevice('desktop')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        activeDevice === 'desktop'
                          ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Desktop Native</span>
                    </button>
                    <button
                      type="button"
                      id="device-tab-mobile"
                      onClick={() => setActiveDevice('mobile')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        activeDevice === 'mobile'
                          ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile Companion</span>
                    </button>
                    <button
                      type="button"
                      id="device-tab-tablet"
                      onClick={() => setActiveDevice('tablet')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        activeDevice === 'tablet'
                          ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                      <span>Tablet View</span>
                    </button>
                  </div>
                </div>

                <div className="max-w-md mx-auto p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>End-to-End Encrypted Sync</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Live Synced
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                    <div className="text-[11px] font-mono text-neutral-400">Current Synchronized Event</div>
                    <input
                      type="text"
                      id="synced-event-input"
                      value={syncedEventTitle}
                      onChange={(e) => setSyncedEventTitle(e.target.value)}
                      className="w-full text-xs font-semibold text-neutral-900 dark:text-neutral-100 bg-transparent border-b border-neutral-300 dark:border-neutral-700 pb-1 focus:outline-hidden focus:border-neutral-900 dark:focus:border-neutral-100"
                    />
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                      <span>14:00 - 14:45</span>
                      <span>Verified on {activeDevice.toUpperCase()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Edit on your workstation or check incoming bookings on your phone. Updates reflect across your devices instantly without handing your calendar credentials to third-party ad networks.
                  </p>
                </div>
              </div>
            )}

            {/* DEMO 5: Open Export */}
            {currentFeature.id === 'open-export' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                    Open Format Interoperability • Never Locked In
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    Publish your schedule as a public link or export your raw data directly to disk anytime:
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      id="export-download-ics-btn"
                      onClick={() => handleExportDownload('ics')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white transition-all active:scale-[0.98]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .ICS Calendar</span>
                    </button>

                    <button
                      type="button"
                      id="export-download-json-btn"
                      onClick={() => handleExportDownload('json')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Export Clean JSON Schema</span>
                    </button>
                  </div>

                  {copiedFormat && (
                    <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-3.5 h-3.5" />
                      <span>Exported {copiedFormat} file directly to your system storage.</span>
                    </div>
                  )}
                </div>

                {/* Live Public Shareable Page Preview */}
                <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
                  <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 pb-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <span>Generated Clean Public Itinerary Page</span>
                    <span className="text-[11px] font-mono text-neutral-400">Zero Configuration</span>
                  </div>

                  <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Public Advisory Hours — Elena Rostova
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      &ldquo;Please select an available 30-minute block that fits your schedule.&rdquo;
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Open slots: 10:30, 14:00, 15:30 CET
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Feature Details List */}
          <div className="p-6 sm:p-8 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-600 dark:text-neutral-400">
            {currentFeature.details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span>{detail}</span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
