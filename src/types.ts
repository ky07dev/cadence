export type Platform = 'windows' | 'macos' | 'linux' | 'web';

export interface Persona {
  id: string;
  role: string;
  badge: string;
  frustration: string;
  desiredOutcome: string;
  cadenceSolution: string;
  quote: string;
  workflowHighlight: string;
}

export interface Feature {
  id: string;
  name: string;
  benefit: string;
  microHeadline: string;
  demoType: 'booking-links' | 'buffers' | 'team-coordination' | 'sync-everywhere' | 'open-export';
  details: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
  category: 'privacy' | 'product' | 'compatibility' | 'pricing';
}

export interface CommunityCard {
  title: string;
  destination: string;
  valueStatement: string;
  iconName: string;
  meta: string;
}
