import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Article" };
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
        <Link href="/blog" className="text-amber-600 hover:underline dark:text-amber-400">
          Blog
        </Link>{" "}
        · {post.publishedAt}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
        {post.title}
      </h1>
      <p className="mt-4 text-lg text-[var(--text-secondary)]">{post.description}</p>
      <div className="mt-10 max-w-none space-y-8 text-[var(--text-secondary)]">
        {post.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{s.heading}</h2>
            {s.paragraphs.map((para, i) => (
              <p key={i} className="mt-3 leading-relaxed">
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>
      <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-6 text-sm text-[var(--text-secondary)] dark:bg-black/30">
        <p>
          Compare current partner offers on the{" "}
          <Link href="/" className="text-amber-600 hover:underline dark:text-amber-400">
            homepage
          </Link>{" "}
          and read our{" "}
          <Link href="/legal-warning" className="text-amber-600 hover:underline dark:text-amber-400">
            India legal warning
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
