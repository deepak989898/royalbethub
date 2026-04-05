import type { HeroSlide } from "./types";

export function normalizeHeroSlide(data: Record<string, unknown>, docId: string): HeroSlide {
  const label = data.ctaLabel;
  return {
    id: docId,
    imageUrl: String(data.imageUrl ?? ""),
    title: String(data.title ?? ""),
    benefit: String(data.benefit ?? ""),
    ctaUrl: String(data.ctaUrl ?? ""),
    ctaLabel: typeof label === "string" && label.trim() ? label.trim() : "Play & sign up",
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : Number(data.sortOrder) || 0,
    active: data.active !== false,
  };
}
