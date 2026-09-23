import React, { useState } from 'react';
import { Clock, Download, Moon, Sun, Menu, X, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Platform } from '../types';
import { LiveDemoButton } from './LiveDemoButton';

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  detectedOS: Platform;
  onOpenDownload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDark,
  onToggleTheme,
  detectedOS,
  onOpenDownload,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getOsLabel = (os: Platform) => {
    switch (os) {
      case 'macos': return 'macOS';
      case 'linux': return 'Linux';
      case 'windows': return 'Windows';
      case 'web': return 'Web';
    }
  };

  const navLinks = [
    { label: 'Philosophy', href: '#philosophy' },
    { label: 'For You', href: '#personas' },
    { label: 'Features', href: '#features' },
    { label: 'Dogfooding', href: '#proof' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Community', href: '#community' },
  ];

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 w-full backdrop-blur-md transition-colors duration-300 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-stone-50/90 dark:bg-neutral-950/90"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <a
          href="#"
          id="brand-logo-link"
          className="flex items-center gap-2.5 text-neutral-900 dark:text-neutral-100 group transition-opacity hover:opacity-90"
        >
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-stone-50 dark:text-neutral-950 shadow-xs">
            <Clock className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg tracking-tight font-sans text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5">
              Cadence
              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                v1.4
              </span>
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav id="desktop-nav" aria-label="Main Navigation" className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              id={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Live demo button */}
          <LiveDemoButton
            label="Live Demo"
            variant="outline"
            className="text-xs px-3 py-1.5 h-8 border-transparent hover:border-neutral-200 dark:hover:border-neutral-800"
          />

          {/* Theme Toggle */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Primary CTA */}
          <button
            type="button"
            id="nav-get-cadence-btn"
            onClick={onOpenDownload}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white shadow-xs transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Get Cadence</span>
            <span className="opacity-60 text-[11px] font-normal">({getOsLabel(detectedOS)})</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            id="mobile-theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-md text-neutral-600 dark:text-neutral-400"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-md text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="sm:hidden border-b border-neutral-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 px-4 pt-3 pb-5 space-y-3"
        >
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium py-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
            <div onClick={() => setMobileMenuOpen(false)}>
              <LiveDemoButton
                label="See a Live Demo"
                variant="secondary"
                className="w-full text-center text-sm font-medium py-2 rounded-md justify-center"
              />
            </div>
            <button
              type="button"
              id="mobile-get-cadence-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDownload();
              }}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950"
            >
              <Download className="w-4 h-4" />
              Get Cadence for {getOsLabel(detectedOS)}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
