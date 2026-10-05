import { Persona, Feature, FaqItem, CommunityCard } from '../types';

export const HERO_CONTENT = {
  headline: "Own your time.",
  subheadline: "The free and flexible scheduling app that puts you in control, not your calendar.",
  primaryCta: "Get Cadence",
  secondaryCta: "See a live demo",
  badge: "Cadence v1.4 • Free without limits",
  microCopy: [
    "Zero data harvesting",
    "Local-first encryption",
    "Open format exports (.ics, .json)",
    "No credit card required"
  ]
};

export const VALUE_PILLARS = [
  {
    id: "calendar-is-yours",
    number: "01",
    statement: "Your calendar is yours.",
    quote: "Cadence never sells your availability data or shares it with advertisers — not even us.",
    description: "Conventional scheduling software monetizes your busy hours, analyzes your meeting cadence, and rents back access to your own daily life. Cadence treats your calendar as private property. Availability queries happen on your terms, with zero telemetry or behavioral tracking.",
    points: [
      "No third-party trackers or marketing pixels",
      "Direct device-to-calendar sync with zero intermediation",
      "End-to-end encrypted booking signatures"
    ]
  },
  {
    id: "schedule-is-unique",
    number: "02",
    statement: "Your schedule is unique.",
    quote: "With flexible rules, buffers, and booking pages, you shape Cadence to fit how you actually work.",
    description: "Rigid 30-minute booking grids ignore the reality of human cognition. Cadence lets you define custom recovery buffers, daily meeting quotas, asymmetric notice windows, and client-specific links so your calendar accommodates your life, not someone else's.",
    points: [
      "Automated breathing room before and after intense calls",
      "Daily cognitive ceilings (e.g. max 3 external calls/day)",
      "Adaptive hours that honor deep work and lunch rituals"
    ]
  },
  {
    id: "time-should-last",
    number: "03",
    statement: "Your time should last.",
    quote: "Export your bookings and data anytime in open formats — you're never locked in.",
    description: "You should never face vendor lock-in for your own historical timeline. Everything stored in Cadence can be exported instantaneously in transparent, human-readable iCalendar and JSON structures. If you ever leave, your calendar history leaves with you.",
    points: [
      "Full export to standard RFC 5545 (.ics), CSV, and JSON",
      "Compatible with Apple Calendar, Google Calendar, and Outlook",
      "One year of comprehensive booking history preserved per link"
    ]
  }
];

export const PERSONAS: Persona[] = [
  {
    id: "consultant",
    role: "Independent Consultant",
    badge: "Solo Advisory & Practice",
    frustration: "I waste 20 minutes a day on back-and-forth emails just to find a meeting time.",
    desiredOutcome: "A single link that ends the scheduling back-and-forth entirely.",
    cadenceSolution: "Share a private, client-branded link with pre-approved advisory slots that respects existing client retainers and time zone offsets automatically.",
    quote: "Before Cadence, coordinating four client time zones felt like a second full-time job. Now I send one quiet link that honors my 90-minute morning deep work block without fail.",
    workflowHighlight: "Custom buffer rules prevent consecutive strategy sessions from blurring together."
  },
  {
    id: "team-lead",
    role: "Team Lead / Manager",
    badge: "Distributed Engineering & Product",
    frustration: "Coordinating five calendars for one meeting feels like a part-time job.",
    desiredOutcome: "Instant visibility into shared team availability.",
    cadenceSolution: "Overlay multi-stakeholder availability masks to expose collective green windows in seconds, eliminating email polls and calendar Tetris.",
    quote: "Finding a 45-minute window across London, Berlin, and San Francisco used to stall project kickoffs by a week. With Cadence group overlays, we see the shared opening immediately.",
    workflowHighlight: "Group availability overlays show mutual consensus without exposing private personal calendar details."
  },
  {
    id: "creative",
    role: "Freelance Creative",
    badge: "Design, Writing & Creative Direction",
    frustration: "Generic booking tools make my brand look like everyone else's.",
    desiredOutcome: "A booking experience that feels personal, flexible, and fully theirs — not templated.",
    cadenceSolution: "Create custom-crafted booking invitations with bespoke studio typography, calm color palettes, and frictionless guest flows without vendor logos.",
    quote: "Every other tool shoved their neon logo and cookie banner right into my client's face. Cadence looks like an extension of my studio portfolio: calm, refined, and respectful.",
    workflowHighlight: "Clean, unbranded URLs and Markdown-enabled introduction notes for prospective clients."
  }
];

export const FEATURES: Feature[] = [
  {
    id: "smart-links",
    name: "Smart Booking Links",
    microHeadline: "Create a link that adapts to you.",
    benefit: "Share one link that shows real-time availability, so no one double-books your time again.",
    demoType: "booking-links",
    details: [
      "Real-time conflict detection across multiple connected calendars",
      "Automated block shielding around lunches, recurring standups, and commutes",
      "Dynamic duration picker (e.g. 15m quick sync or 50m deep dive)"
    ]
  },
  {
    id: "buffers-rules",
    name: "Buffers & Rules",
    microHeadline: "Protect your focus time.",
    benefit: "Set rules so meetings never stack back-to-back or eat into deep work.",
    demoType: "buffers",
    details: [
      "Auto-inserted 10, 15, or 30-minute transitions between calls",
      "Hard boundaries: automatically halt bookings once daily threshold is reached",
      "Notice horizon: prevent anyone from booking within 4, 12, or 24 hours"
    ]
  },
  {
    id: "team-coordination",
    name: "Team Coordination",
    microHeadline: "Find the moment that works for everyone.",
    benefit: "Overlay teammates' calendars to spot shared openings instantly.",
    demoType: "team-coordination",
    details: [
      "Privacy-first overlay: see when peers are free without reading their private event titles",
      "Smart consensus detector finds the widest mutual green slot",
      "Round-robin or all-hands meeting dispatching in one touch"
    ]
  },
  {
    id: "sync-everywhere",
    name: "Sync Everywhere",
    microHeadline: "Access your schedule on any device, secured end-to-end.",
    benefit: "One calendar, always up to date, wherever you are.",
    demoType: "sync-everywhere",
    details: [
      "Native desktop client for Windows, macOS, and Linux",
      "PWA and offline-capable web companion for mobile and tablets",
      "Zero central telemetry; credentials never pass through Cadence analytics"
    ]
  },
  {
    id: "open-export",
    name: "Open Export",
    microHeadline: "Turn your schedule into a shareable page.",
    benefit: "Publish a public itinerary or availability page in one click — fast, clean, no configuration.",
    demoType: "open-export",
    details: [
      "Instant one-click publish for client itineraries or office hours",
      "Direct download of universal .ics calendar files",
      "Raw JSON and CSV outputs for custom automations and personal databases"
    ]
  }
];

export const TRUST_FACTS = [
  {
    metric: "100%",
    label: "Local availability ownership",
    sublabel: "Your calendar credentials and event descriptions stay on your hardware"
  },
  {
    metric: "0",
    label: "Third-party trackers or ads",
    sublabel: "No Google Analytics, no Facebook Pixels, no surveillance cookies"
  },
  {
    metric: "1 Year",
    label: "Booking archive guaranteed",
    sublabel: "Comprehensive booking logs preserved for every active link"
  },
  {
    metric: "100%",
    label: "Dogfooded daily",
    sublabel: "Our own engineering and support team books every single call through Cadence"
  }
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Why is Cadence completely free?",
    answer: "Cadence follows the sustainable local-first model pioneered by tools like Obsidian. The core application runs directly on your device and coordinates availability without massive, expensive centralized server overhead. In the future, we will offer optional encrypted team relay sync services and enterprise governance licenses for large organizations, but the desktop application, individual booking pages, and core scheduling tools will remain free forever.",
    category: "pricing"
  },
  {
    question: "How does Cadence protect my calendar privacy?",
    answer: "Unlike traditional scheduling platforms that store your entire calendar history on their cloud databases to build advertising graphs, Cadence computes available time slots client-side. When a guest views your booking page, they only see anonymous open blocks. Event titles, attendee lists, meeting notes, and private descriptions are never transmitted or saved on our servers.",
    category: "privacy"
  },
  {
    question: "What calendar providers can I connect?",
    answer: "Cadence connects seamlessly with Google Calendar (Workspace & Gmail), Apple iCloud Calendar, Microsoft Outlook / Office 365, and any standard CalDAV or Fastmail server. You can connect multiple personal and work accounts simultaneously to avoid double-bookings without merging your private calendars.",
    category: "compatibility"
  },
  {
    question: "How do automated buffers work in practice?",
    answer: "You can specify default buffer windows (e.g. 15 minutes before and after any meeting) in your global rules or link-specific preferences. When Cadence calculates open slots, it automatically injects that buffer around existing events. If you have a standup ending at 10:00 AM, Cadence will not offer a slot until 10:15 AM at the earliest.",
    category: "product"
  },
  {
    question: "What formats can I export my data in?",
    answer: "You can export all booking records, confirmed meetings, client intake notes, and rules anytime in RFC 5545 standard iCalendar (.ics), structured JSON, or spreadsheet-ready CSV. You own every byte and can archive or migrate your scheduling data whenever you choose.",
    category: "privacy"
  },
  {
    question: "How does team coordination work without leaking private calendars?",
    answer: "Cadence uses cryptographic zero-knowledge time masks. When teammates share availability with each other, only the binary state of 'free' or 'busy' for specific time intervals is combined. Team leads can see when everyone is mutually open without seeing doctors' appointments, 1-on-1 topics, or personal errands.",
    category: "product"
  },
  {
    question: "Does Cadence work when I am offline?",
    answer: "Yes. Because Cadence is built local-first, you can view your schedule, adjust availability rules, configure buffers, and prepare booking link templates without an internet connection. Changes sync quietly the moment your device reconnects.",
    category: "product"
  },
  {
    question: "Can I handle multiple time zones accurately?",
    answer: "Yes. When someone visits your booking link, Cadence automatically detects their local time zone, translates your available slots instantly, and allows them to switch time zones on the fly. Both parties receive calendar invites configured in their respective local times with daylight saving adjustments.",
    category: "compatibility"
  },
  {
    question: "Can I customize the look of my public booking page?",
    answer: "Absolutely. You can customize your bio, avatar, headline, session descriptions, questions asked upon booking, and choose between refined light and dark typography themes. Your booking page remains uncluttered, professional, and free of Cadence marketing banners.",
    category: "product"
  },
  {
    question: "How do I install Cadence on my computer?",
    answer: "Cadence is available as a lightweight native application for Windows (64-bit & ARM), macOS (Apple Silicon & Intel), and Linux (.AppImage, .deb). You can also run the web companion in any modern browser without installation.",
    category: "compatibility"
  },
  {
    question: "Can I limit how many meetings I have per day?",
    answer: "Yes. The 'Daily Cognitive Cap' rule lets you set a hard limit (e.g., maximum 3 calls per day, or 120 total minutes of external meetings). Once that threshold is reached, your public booking link automatically marks the rest of that day as unavailable, preserving your focus time.",
    category: "product"
  },
  {
    question: "What happens if someone needs to reschedule or cancel?",
    answer: "Every confirmation email includes a direct, one-click reschedule and cancellation link. When a guest chooses a new time, the old event is gracefully removed from your calendar, the buffer rules are recalculated, and both parties receive updated calendar invitations with zero manual intervention.",
    category: "product"
  }
];

export const COMMUNITY_CARDS: CommunityCard[] = [
  {
    title: "Join the community",
    destination: "Discord",
    valueStatement: "Connect with 18,000+ people shaping deliberate, respectful calendar workflows and daily focus practices.",
    iconName: "MessageSquare",
    meta: "18.4k active members • #ergonomics & #showcase"
  },
  {
    title: "Feature requests & discussion",
    destination: "Community Forum",
    valueStatement: "Vote on public roadmap ideas, propose plugin architectures, and discuss scheduling ergonomics directly with core maintainers.",
    iconName: "Compass",
    meta: "Public roadmap • Weekly release notes"
  },
  {
    title: "Build on our API",
    destination: "Developer docs",
    valueStatement: "Integrate your local scripts, custom CRM triggers, and CLI utilities using our open JSON schemas and CalDAV extensions.",
    iconName: "Code2",
    meta: "RFC 5545 compliant • Local REST & Webhooks"
  }
];
