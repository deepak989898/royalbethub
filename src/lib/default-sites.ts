import type { CasinoSite } from "./types";

/** Initial rows for “Seed casinos” in admin — replace example.com URLs in production. */
export const DEFAULT_CASINO_SITES: Omit<CasinoSite, never>[] = [
  {
    slug: "instamatch365",
    name: "InstaMatch 365",
    tagline: "Fast onboarding & India-focused promos",
    description:
      "Strong pick if you want a streamlined lobby and frequent cricket and casino promos aimed at Indian players.",
    url: "https://instamatch365.com/",
    pros: [
      "Mobile-first experience",
      "Clear bonus messaging",
      "Solid game variety for casual play",
    ],
    cons: ["Promo rules change often—re-read T&Cs before each deposit.", "Not all games count equally toward wagering."],
    paymentMethods: ["UPI (where supported)", "Cards", "NetBanking", "Popular Indian wallets (verify live)"],
    welcomeOffer: "Typical welcome match on first deposit — confirm on official site.",
    noDepositNote: "Rare; if shown publicly, expect strict verification and win caps.",
    bonusDetails:
      "Compare rollover, minimum odds (sports), and excluded games. RoyalBetHub does not set operator rules.",
    promoCode: "RBH-INSTA",
    regions: ["IN"],
    rating: 4.6,
    sortOrder: 10,
    active: true,
    badge: "Popular",
  },
  {
    slug: "khelo24match",
    name: "Khelo24Match",
    tagline: "Slots, live tables & crash-style games",
    description:
      "Good fit when you want a broad catalogue—live casino, slots, and quick games—in one wallet.",
    url: "https://khelo24match777.com/",
    pros: ["Large game library", "Live and RNG options", "App download promos"],
    regions: ["IN"],
    rating: 4.5,
    sortOrder: 20,
    active: true,
  },
  {
    slug: "bet365",
    name: "Bet365",
    tagline: "Sportsbook depth + in-play",
    description:
      "Best known for sports and in-play markets worldwide; casino is available where permitted. Always check local rules.",
    url: "https://www.bet365.com/",
    pros: ["Deep sports coverage", "Trusted global brand", "Strong live betting"],
    regions: ["IN", "ALL"],
    rating: 4.8,
    sortOrder: 30,
    active: true,
    badge: "Sports",
  },
  {
    slug: "royal-panda",
    name: "Royal Panda",
    tagline: "Casino-first with rewards",
    description:
      "Casino-oriented experience with regular campaigns; compare welcome terms before you deposit.",
    url: "https://royalpanda.com/",
    pros: ["Casino & live focus", "Reward-style promos", "Straightforward site UX"],
    regions: ["IN", "ALL"],
    rating: 4.4,
    sortOrder: 40,
    active: true,
  },
  {
    slug: "jeetcity-sample",
    name: "JeetCity (sample)",
    tagline: "Replace this URL with your real partner link",
    description:
      "Placeholder listing so you can practise admin edits. Point the URL to your tracked affiliate link.",
    url: "https://example.com/jeetcity-affiliate",
    pros: ["Editable in admin", "Use your tracking params", "Hide when not needed"],
    regions: ["IN"],
    rating: 4.2,
    sortOrder: 50,
    active: true,
  },
  {
    slug: "parimatch-sample",
    name: "Parimatch (sample)",
    tagline: "Second placeholder — swap for a live offer",
    description:
      "Use admin to change name, copy, and URL. Disable the row if you are not promoting this brand.",
    url: "https://example.com/parimatch-affiliate",
    pros: ["Quick comparison slot on your hub", "Full CRUD from admin"],
    regions: ["IN"],
    rating: 4.3,
    sortOrder: 60,
    active: true,
  },
];
