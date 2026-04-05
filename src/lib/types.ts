import type { Timestamp } from "firebase/firestore";

export type CasinoSite = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  pros: string[];
  /** Optional cons for review pages */
  cons?: string[];
  /** e.g. UPI, NetBanking — one per admin line */
  paymentMethods?: string[];
  /** Longer bonus copy for review / bonus pages */
  bonusDetails?: string;
  welcomeOffer?: string;
  noDepositNote?: string;
  /** Shown on cards when set */
  promoCode?: string;
  /** Geo filter: IN = India-focused listing; empty = show everywhere */
  regions?: string[];
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

/** Homepage hero carousel slide (Firestore `hero_slides`). */
export type HeroSlide = {
  id: string;
  imageUrl: string;
  title: string;
  benefit: string;
  ctaUrl: string;
  ctaLabel: string;
  sortOrder: number;
  active: boolean;
};

export type BonusLead = {
  name: string;
  email: string;
  phone: string;
  siteSlug?: string;
  siteName?: string;
  createdAt: Timestamp;
  notes?: string;
};
