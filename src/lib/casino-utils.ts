import type { CasinoSite } from "./types";

/** Normalize Firestore doc into a full CasinoSite with safe arrays. */
export function normalizeCasinoSite(data: Record<string, unknown>, docId: string): CasinoSite {
  const pros = Array.isArray(data.pros) ? (data.pros as string[]) : [];
  const cons = Array.isArray(data.cons) ? (data.cons as string[]) : undefined;
  const paymentMethods = Array.isArray(data.paymentMethods)
    ? (data.paymentMethods as string[])
    : undefined;
  const regions = Array.isArray(data.regions) ? (data.regions as string[]) : undefined;

  return {
    slug: (typeof data.slug === "string" ? data.slug : docId) || docId,
    name: String(data.name ?? ""),
    tagline: String(data.tagline ?? ""),
    description: String(data.description ?? ""),
    url: String(data.url ?? ""),
    pros,
    cons,
    paymentMethods,
    bonusDetails: typeof data.bonusDetails === "string" ? data.bonusDetails : undefined,
    welcomeOffer: typeof data.welcomeOffer === "string" ? data.welcomeOffer : undefined,
    noDepositNote: typeof data.noDepositNote === "string" ? data.noDepositNote : undefined,
    promoCode: typeof data.promoCode === "string" ? data.promoCode : undefined,
    regions,
    rating: typeof data.rating === "number" ? data.rating : Number(data.rating) || 0,
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : Number(data.sortOrder) || 0,
    active: data.active !== false,
    badge: typeof data.badge === "string" ? data.badge : undefined,
  };
}

/**
 * For India-focused hub: show sites with no regions set, or IN / ALL / GLOBAL.
 */
export function filterCasinosForIndia(sites: CasinoSite[]): CasinoSite[] {
  return sites.filter((s) => {
    const r = s.regions;
    if (!r || r.length === 0) return true;
    return r.some((x) => ["IN", "INDIA", "ALL", "GLOBAL"].includes(String(x).toUpperCase()));
  });
}
