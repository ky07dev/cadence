import React, { useState } from 'react';
import { X, Download, ShieldCheck, Laptop, Check, Terminal, ExternalLink } from 'lucide-react';
import { Platform } from '../types';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOS: Platform;
  onChangeOS: (os: Platform) => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  selectedOS,
  onChangeOS,
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const downloadInfo: Record<Platform, { name: string; file: string; size: string; notes: string; command?: string }> = {
    windows: {
      name: 'Cadence for Windows',
      file: 'Cadence-Setup-1.4.0-x64.exe',
      size: '68.4 MB',
      notes: 'Supports Windows 10 & 11 (x64 and ARM64). Standard installer or portable zip.',
      command: 'winget install cadence.app'
    },
    macos: {
      name: 'Cadence for macOS',
      file: 'Cadence-1.4.0-Universal.dmg',
      size: '72.1 MB',
      notes: 'Universal binary optimized for Apple Silicon (M1/M2/M3/M4) & Intel Macs.',
      command: 'brew install --cask cadence'
    },
    linux: {
      name: 'Cadence for Linux',
      file: 'Cadence-1.4.0.AppImage',
      size: '64.2 MB',
      notes: 'Available as standalone AppImage, Debian package (.deb), or Flatpak.',
      command: 'flatpak install flathub app.cadence.Cadence'
    },
    web: {
      name: 'Cadence Web Companion',
      file: 'Web App (PWA)',
      size: 'Instant',
      notes: 'Runs directly in modern browsers (Chrome, Safari, Firefox, Edge) with local storage sync.'
    }
  };

  const current = downloadInfo[selectedOS];

  const handleDownload = () => {
    setDownloadStarted(true);
    // Trigger simulated direct file download
    const dummyContent = `Cadence Local-First Scheduling Engine v1.4.0\nPlatform: ${selectedOS}\nSha256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069\nDirect CalDAV & RFC 5545 local sync engine initialized.`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = current.file.endsWith('.dmg') || current.file.endsWith('.exe') || current.file.endsWith('.AppImage') 
      ? current.file 
      : 'cadence-setup.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="download-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="download-modal-container"
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden transition-all text-neutral-900 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
              Direct Package Distribution • Free & Unrestricted
            </span>
          </div>
          <button
            type="button"
            id="close-download-modal-btn"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 font-sans">
              {current.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Cadence v1.4.0 • Zero signup required • 100% Local-First
            </p>
          </div>

          {/* Platform Switcher */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            {(['windows', 'macos', 'linux', 'web'] as Platform[]).map((os) => (
              <button
                key={os}
                type="button"
                id={`modal-os-tab-${os}`}
                onClick={() => {
                  onChangeOS(os);
                  setDownloadStarted(false);
                }}
                className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  selectedOS === os
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {os === 'macos' ? 'macOS' : os}
              </button>
            ))}
          </div>

          {/* Package details */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Target File:</span>
              <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">{current.file}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Package Size:</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300">{current.size}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Security Checksum:</span>
              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">SHA-256 Verified ✓</span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              {current.notes}
            </p>
          </div>

          {/* Terminal Command if applicable */}
          {current.command && (
            <div className="p-3 rounded-lg bg-neutral-900 text-neutral-200 font-mono text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto">
                <Terminal className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{current.command}</span>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="space-y-3">
            <button
              type="button"
              id="confirm-package-download-btn"
              onClick={handleDownload}
              className="w-full py-3.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-white active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{downloadStarted ? 'Download Initialized' : `Download for ${selectedOS === 'macos' ? 'macOS' : selectedOS.toUpperCase()}`}</span>
            </button>

            {downloadStarted && (
              <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Download started. Run the installer to configure your local CalDAV keys.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
