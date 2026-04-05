import type { HeroSlide } from "./types";

/** Firestore document IDs are fixed so “Seed hero slides” is idempotent. */
export const DEFAULT_HERO_SLIDES: (Omit<HeroSlide, "id"> & { id: string })[] = [
  {
    id: "hero-seed-welcome",
    imageUrl: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=1200&q=80",
    title: "Welcome offers & fast UPI",
    benefit:
      "Compare trusted partners with clear bonus messaging and India-friendly payment options.",
    ctaUrl: "https://example.com",
    ctaLabel: "Play & sign up",
    sortOrder: 10,
    active: true,
  },
  {
    id: "hero-seed-live",
    imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&q=80",
    title: "Live casino & sports",
    benefit: "Pick operators that match how you play—slots, live tables, or in-play betting.",
    ctaUrl: "https://example.com",
    ctaLabel: "Play & sign up",
    sortOrder: 20,
    active: true,
  },
];
