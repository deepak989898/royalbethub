export type BlogSection = { heading: string; paragraphs: string[] };

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  keywords: string[];
  sections: BlogSection[];
};

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "best-casino-apps-india",
    title: "Best casino apps in India (2026): what to compare before you install",
    description:
      "How to compare licensed-style offshore apps, payments like UPI, and bonus terms—without mistaking editorial picks for legal advice.",
    publishedAt: "2026-04-01",
    keywords: [
      "best casino apps in India",
      "online casino app India",
      "real money casino app",
    ],
    sections: [
      {
        heading: "Why “best” depends on how you play",
        paragraphs: [
          "Some players want deep sportsbooks; others want live Andar Bahar or slots. Royal Bet Hub lists partners with short, honest summaries so you can match product fit—not hype.",
          "Always verify whether a brand accepts players from your state and whether their wallet methods (UPI, bank transfer, cards) work for you before depositing.",
        ],
      },
      {
        heading: "Safety checklist (18+)",
        paragraphs: [
          "Use strong passwords, enable two-factor authentication where offered, and never share OTPs.",
          "Gambling laws in India are state-dependent. This article is informational; we do not operate games or accept wagers.",
        ],
      },
    ],
  },
  {
    slug: "how-to-withdraw-money-online-betting-india",
    title: "How to withdraw money from online betting & casino sites in India",
    description:
      "Typical KYC steps, processing times, and why withdrawals are often slower than deposits—plus red flags to avoid.",
    publishedAt: "2026-04-02",
    keywords: [
      "how to withdraw money online betting India",
      "casino withdrawal India",
      "KYC betting site",
    ],
    sections: [
      {
        heading: "The usual flow",
        paragraphs: [
          "Most operators require identity verification (KYC) before the first withdrawal. Expect requests for PAN/Aadhaar-style documents depending on the brand’s policy.",
          "Withdrawals can take from minutes to several business days depending on method (bank, e-wallet) and internal review queues.",
        ],
      },
      {
        heading: "Trust signals",
        paragraphs: [
          "Clear terms, published limits, and responsive support correlate with fewer payout disputes—but no outcome is guaranteed.",
          "Some outbound links are commercial or tracked; always read the operator's terms before you play.",
        ],
      },
    ],
  },
  {
    slug: "is-online-betting-legal-india",
    title: "Is online betting legal in India? State rules & affiliate sites explained",
    description:
      "A plain-language overview of why legality varies by state, what affiliate hubs do, and how we disclose age and risk.",
    publishedAt: "2026-04-03",
    keywords: [
      "is online betting legal in India",
      "gambling laws India by state",
      "affiliate gambling India",
    ],
    sections: [
      {
        heading: "State-dependent laws",
        paragraphs: [
          "India does not have one single national rule for every real-money game. Some states restrict or prohibit certain formats; others are less explicit. You should read current local guidance or consult a qualified professional if unsure.",
          "Royal Bet Hub does not run gambling products. We publish comparisons and links to third-party operators.",
        ],
      },
      {
        heading: "Affiliate promotion & gray areas",
        paragraphs: [
          "Affiliate marketing is common worldwide. Responsible affiliates disclose relationships, avoid promises of winnings, and enforce 18+ positioning—as we do in our legal pages.",
        ],
      },
    ],
  },
  {
    slug: "1xbet-review-india",
    title: "1xBet review (India angle): markets, apps, and what to verify first",
    description:
      "Editorial-style checklist for researching 1xBet—or any large sportsbook—before signup: payments, support, and bonus fine print.",
    publishedAt: "2026-04-04",
    keywords: ["1xbet review India", "1xbet India", "1xbet bonus terms"],
    sections: [
      {
        heading: "What readers usually compare",
        paragraphs: [
          "Sports depth, live betting latency, casino catalogue size, and local deposit methods are the top practical questions for Indian users.",
          "Bonus percentages are easy to market; wagering requirements and game weightings decide real value—read the operator T&Cs.",
        ],
      },
      {
        heading: "Our role",
        paragraphs: [
          "Royal Bet Hub may link to partners with tracking parameters. We do not guarantee odds, bonuses, or account approval.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
