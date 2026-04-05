import { Quote } from "lucide-react";

const ITEMS = [
  {
    name: "Rahul",
    city: "Pune",
    text: "Clear comparisons helped me pick a site with UPI deposits and faster KYC than my last app.",
  },
  {
    name: "Ananya",
    city: "Bengaluru",
    text: "I like that they explain pros/cons instead of only flashing bonus numbers.",
  },
  {
    name: "Vikram",
    city: "Jaipur",
    text: "Opening partners in a new tab makes it easy to compare two welcome offers side by side.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-16 sm:px-6 dark:bg-black/20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Reader feedback
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-[var(--text-tertiary)]">
          Illustrative testimonials for social proof layout—replace with verified reviews as you grow.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {ITEMS.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-left shadow-sm dark:bg-white/[0.03] dark:shadow-none"
            >
              <Quote className="h-8 w-8 text-amber-600/70 dark:text-amber-500/60" aria-hidden />
              <blockquote className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-xs font-medium text-[var(--text-tertiary)]">
                — {t.name}, {t.city}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
