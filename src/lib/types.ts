import type { Timestamp } from "firebase/firestore";

export type CasinoSite = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  pros: string[];
  rating: number;
  sortOrder: number;
  active: boolean;
  badge?: string;
};

export type AnalyticsEvent = {
  type: "visit" | "click";
  createdAt: Timestamp;
  siteSlug?: string;
  path?: string;
  sessionId?: string;
};

export type BonusLead = {
  name: string;
  email: string;
  phone: string;
  createdAt: Timestamp;
  notes?: string;
};
