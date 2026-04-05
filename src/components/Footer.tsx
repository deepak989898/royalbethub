import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#08060c] py-10 text-sm text-zinc-500">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="max-w-3xl leading-relaxed text-zinc-400">
          <strong className="text-zinc-300">18+ only.</strong> Gambling can be addictive.
          Play responsibly. Royal Bet Hub compares operator offers and may earn a commission
          when you sign up through our links. Offers, terms, and availability vary by region
          and operator—always read the site&apos;s terms before depositing.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/admin/login" className="hover:text-amber-400">
            Admin login
          </Link>
        </div>
        <p className="mt-8 text-xs text-zinc-600">
          © {new Date().getFullYear()} Royal Bet Hub. For affiliate partners only.
        </p>
      </div>
    </footer>
  );
}
