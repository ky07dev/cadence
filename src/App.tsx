/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Platform } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ValuePillars } from './components/ValuePillars';
import { TargetAudience } from './components/TargetAudience';
import { FeaturesShowcase } from './components/FeaturesShowcase';
import { TrustProof } from './components/TrustProof';
import { FAQSection } from './components/FAQSection';
import { ProposalRequestSection } from './components/ProposalRequestSection';
import { ClosingCTA } from './components/ClosingCTA';
import { Footer } from './components/Footer';
import { DownloadModal } from './components/DownloadModal';
import { SupportChatbot } from './components/SupportChatbot';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cadence-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [detectedOS, setDetectedOS] = useState<Platform>('windows');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Path change listener for client-side navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Se a rota for /admin, renderiza o Painel de Administração
  if (currentPath.startsWith('/admin')) {
    return <AdminDashboard />;
  }

  // OS Auto-detection
  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes('mac') || userAgent.includes('darwin')) {
        setDetectedOS('macos');
      } else if (userAgent.includes('linux')) {
        setDetectedOS('linux');
      } else if (userAgent.includes('win')) {
        setDetectedOS('windows');
      } else {
        setDetectedOS('windows'); // Default from PRD
      }
    }
  }, []);

  // Sync dark theme class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cadence-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cadence-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans selection:bg-neutral-800 selection:text-white dark:selection:bg-neutral-200 dark:selection:text-neutral-900">
      {/* Navigation */}
      <Navbar
        isDark={isDark}
        onToggleTheme={toggleTheme}
        detectedOS={detectedOS}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
      />

      {/* Main Content Sections */}
      <main id="main-content">
        {/* 1. Hero Section */}
        <Hero
          detectedOS={detectedOS}
          onChangeOS={setDetectedOS}
          onOpenDownload={() => setIsDownloadModalOpen(true)}
        />

        {/* 2. Core Value Pillars (Ownership Framing) */}
        <ValuePillars />

        {/* 3. Target Audience & Personas */}
        <TargetAudience />

        {/* 4. Core Solutions & Interactive Demos (Show, Don't Tell) */}
        <FeaturesShowcase />

        {/* 5. Trust, Dogfooding, and Architectural Verification */}
        <TrustProof />

        {/* 6. Comprehensive FAQ (10+ Q&As) */}
        <FAQSection />

        {/* 7. Request a Plan Proposal Section */}
        <ProposalRequestSection />

        {/* 8. Final Conversion & Obsidian-style Community Soft Landing */}
        <ClosingCTA
          detectedOS={detectedOS}
          onChangeOS={setDetectedOS}
          onOpenDownload={() => setIsDownloadModalOpen(true)}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Download Modal */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        selectedOS={detectedOS}
        onChangeOS={setDetectedOS}
      />

      {/* Floating AI Support Chatbot */}
      <SupportChatbot />
    </div>
  );
}
