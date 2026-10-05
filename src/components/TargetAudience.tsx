import React, { useState } from 'react';
import { Briefcase, Users, Palette, ArrowRight, CheckCircle2, AlertCircle, Quote } from 'lucide-react';
import { PERSONAS } from '../data/content';
import { Persona } from '../types';

export const TargetAudience: React.FC = () => {
  const [activePersonaId, setActivePersonaId] = useState<string>('consultant');

  const getPersonaIcon = (id: string) => {
    switch (id) {
      case 'consultant':
        return <Briefcase className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />;
      case 'team-lead':
        return <Users className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />;
      case 'creative':
        return <Palette className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />;
      default:
        return <Briefcase className="w-5 h-5" />;
    }
  };

  const activePersona = PERSONAS.find(p => p.id === activePersonaId) || PERSONAS[0];

  return (
    <section id="personas" className="py-20 md:py-28 border-t border-neutral-200/80 dark:border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Intro */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Target Personas
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
            Designed for those who run on their own time.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300">
            Cadence eliminates friction without forcing you into an off-the-shelf, surveillance-driven booking template.
          </p>
        </div>

        {/* Persona Selector Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-xl bg-neutral-200/60 dark:bg-neutral-800/60 border border-neutral-300/60 dark:border-neutral-700/60">
            {PERSONAS.map((persona) => {
              const isActive = persona.id === activePersonaId;
              return (
                <button
                  key={persona.id}
                  type="button"
                  id={`persona-tab-${persona.id}`}
                  onClick={() => setActivePersonaId(persona.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {getPersonaIcon(persona.id)}
                  <span className="hidden sm:inline">{persona.role}</span>
                  <span className="sm:hidden">{persona.role.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Spotlight of Selected Persona */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left overview */}
            <div className="md:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="inline-block text-[11px] font-mono px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                  {activePersona.badge}
                </span>
                <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 font-sans">
                  {activePersona.role}
                </h3>
              </div>

              {/* Pain Point vs Desired Outcome */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>The Frustration</span>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 font-medium">
                    &ldquo;{activePersona.frustration}&rdquo;
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>The Desired Outcome</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-medium">
                    {activePersona.desiredOutcome}
                  </p>
                </div>
              </div>

              {/* Cadence Solution */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  How Cadence Solves This
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {activePersona.cadenceSolution}
                </p>
              </div>
            </div>

            {/* Right: Thoughtful Use Case Card & Concrete Quote */}
            <div className="md:col-span-6 space-y-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/60 p-6">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  Daily Workflow Reality
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  Verified Pattern
                </span>
              </div>

              <blockquote className="space-y-3">
                <Quote className="w-6 h-6 text-neutral-300 dark:text-neutral-700" />
                <p className="text-sm text-neutral-700 dark:text-neutral-200 italic leading-relaxed">
                  &ldquo;{activePersona.quote}&rdquo;
                </p>
              </blockquote>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="text-[11px] font-mono uppercase text-neutral-400">Cadence Feature Ergonomics</div>
                <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                  <span>{activePersona.workflowHighlight}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3 Persona Cards Grid for rapid scanning */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          {PERSONAS.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                p.id === activePersonaId
                  ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50/80 dark:bg-neutral-800/50 shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/30 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
              onClick={() => setActivePersonaId(p.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  {getPersonaIcon(p.id)}
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  {p.badge.split('&')[0]}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                {p.role}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                {p.desiredOutcome}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
