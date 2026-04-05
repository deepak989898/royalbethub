"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  BarChart3,
  ExternalLink,
  Images,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Sprout,
} from "lucide-react";
import Link from "next/link";
import { DEFAULT_CASINO_SITES } from "@/lib/default-sites";
import { DEFAULT_HERO_SLIDES } from "@/lib/default-hero-slides";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { normalizeCasinoSite } from "@/lib/casino-utils";
import { normalizeHeroSlide } from "@/lib/hero-utils";
import type { AnalyticsEvent, BonusLead, CasinoSite, HeroSlide } from "@/lib/types";

type EventRow = AnalyticsEvent & { id: string };

export function AdminDashboard() {
  const [sites, setSites] = useState<CasinoSite[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [leads, setLeads] = useState<(BonusLead & { id: string })[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedingHero, setSeedingHero] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<CasinoSite>>({});
  const [heroModal, setHeroModal] = useState(false);
  const [heroEditingId, setHeroEditingId] = useState<string | null>(null);
  const [heroForm, setHeroForm] = useState<Partial<HeroSlide>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const sq = query(collection(getDb(), "sites"), orderBy("sortOrder", "asc"));
      const siteSnap = await getDocs(sq);
      const siteRows: CasinoSite[] = [];
      siteSnap.forEach((d) => {
        siteRows.push(normalizeCasinoSite(d.data() as Record<string, unknown>, d.id));
      });
      setSites(siteRows);

      const eq = query(
        collection(getDb(), "analytics_events"),
        orderBy("createdAt", "desc"),
        limit(400)
      );
      const evSnap = await getDocs(eq);
      const evRows: EventRow[] = [];
      evSnap.forEach((d) => {
        evRows.push({ id: d.id, ...(d.data() as AnalyticsEvent) });
      });
      setEvents(evRows);

      const lq = query(collection(getDb(), "bonus_leads"), orderBy("createdAt", "desc"), limit(200));
      const lSnap = await getDocs(lq);
      const lRows: (BonusLead & { id: string })[] = [];
      lSnap.forEach((d) => {
        lRows.push({ id: d.id, ...(d.data() as BonusLead) });
      });
      setLeads(lRows);

      const hq = query(collection(getDb(), "hero_slides"), orderBy("sortOrder", "asc"));
      const hSnap = await getDocs(hq);
      const hRows: HeroSlide[] = [];
      hSnap.forEach((d) => {
        hRows.push(normalizeHeroSlide(d.data() as Record<string, unknown>, d.id));
      });
      setHeroSlides(hRows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const visits = events.filter((e) => e.type === "visit").length;
    const clicks = events.filter((e) => e.type === "click").length;
    const bySite: Record<string, number> = {};
    events.forEach((e) => {
      if (e.type === "click" && e.siteSlug) {
        bySite[e.siteSlug] = (bySite[e.siteSlug] || 0) + 1;
      }
    });
    return { visits, clicks, bySite };
  }, [events]);

  async function handleSeed() {
    if (!confirm("Create or overwrite default casino documents by slug?")) return;
    setSeeding(true);
    try {
      const batch = writeBatch(getDb());
      for (const s of DEFAULT_CASINO_SITES) {
        const ref = doc(getDb(), "sites", s.slug);
        batch.set(ref, { ...s });
      }
      await batch.commit();
      await refresh();
    } finally {
      setSeeding(false);
    }
  }

  async function handleSeedHero() {
    if (!confirm("Create or overwrite default hero slides (fixed IDs)?")) return;
    setSeedingHero(true);
    try {
      const batch = writeBatch(getDb());
      for (const s of DEFAULT_HERO_SLIDES) {
        const ref = doc(getDb(), "hero_slides", s.id);
        batch.set(ref, {
          imageUrl: s.imageUrl,
          title: s.title,
          benefit: s.benefit,
          ctaUrl: s.ctaUrl,
          ctaLabel: s.ctaLabel,
          sortOrder: s.sortOrder,
          active: s.active,
        });
      }
      await batch.commit();
      await refresh();
    } finally {
      setSeedingHero(false);
    }
  }

  function openHeroAdd() {
    setHeroEditingId(null);
    setHeroForm({
      imageUrl: "https://",
      title: "",
      benefit: "",
      ctaUrl: "https://",
      ctaLabel: "Play & sign up",
      sortOrder: (heroSlides[heroSlides.length - 1]?.sortOrder ?? 0) + 10,
      active: true,
    });
    setHeroModal(true);
  }

  function openHeroEdit(s: HeroSlide) {
    setHeroEditingId(s.id);
    setHeroForm({ ...s });
    setHeroModal(true);
  }

  async function saveHero() {
    const imageUrl = (heroForm.imageUrl || "").trim();
    const title = (heroForm.title || "").trim();
    const benefit = (heroForm.benefit || "").trim();
    const ctaUrl = (heroForm.ctaUrl || "").trim();
    const ctaLabel = (heroForm.ctaLabel || "Play & sign up").trim();
    if (!imageUrl || !title || !ctaUrl) {
      alert("Image URL, title, and CTA URL are required.");
      return;
    }
    const payload = {
      imageUrl,
      title,
      benefit,
      ctaUrl,
      ctaLabel,
      sortOrder: Number(heroForm.sortOrder) || 0,
      active: Boolean(heroForm.active),
    };
    if (heroEditingId) {
      await setDoc(doc(getDb(), "hero_slides", heroEditingId), payload);
    } else {
      await addDoc(collection(getDb(), "hero_slides"), payload);
    }
    setHeroModal(false);
    await refresh();
  }

  async function removeHero(id: string) {
    if (!confirm("Delete this hero slide?")) return;
    await deleteDoc(doc(getDb(), "hero_slides", id));
    await refresh();
  }

  function openAdd() {
    setForm({
      slug: "",
      name: "",
      tagline: "",
      description: "",
      url: "https://",
      pros: [],
      rating: 4.5,
      sortOrder: (sites[sites.length - 1]?.sortOrder ?? 0) + 10,
      active: true,
      badge: "",
      cons: [],
      paymentMethods: [],
      bonusDetails: "",
      welcomeOffer: "",
      noDepositNote: "",
      promoCode: "",
      regions: ["IN"],
    });
    setModal("add");
  }

  function openEdit(site: CasinoSite) {
    setForm({
      ...site,
      pros: [...site.pros],
      cons: [...(site.cons ?? [])],
      paymentMethods: [...(site.paymentMethods ?? [])],
      regions: [...(site.regions ?? [])],
    });
    setModal("edit");
  }

  async function saveSite() {
    const slug = (form.slug || "").trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug || !form.name || !form.url) {
      alert("Slug, name, and URL are required.");
      return;
    }
    const prosText = Array.isArray(form.pros)
      ? form.pros.join("\n")
      : String(form.pros || "");
    const pros = prosText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const consLines = (Array.isArray(form.cons) ? form.cons.join("\n") : String(form.cons || ""))
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const payLines = (
      Array.isArray(form.paymentMethods)
        ? form.paymentMethods.join("\n")
        : String(form.paymentMethods || "")
    )
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const regionsRaw = String(form.regions || "")
      .split(/[\n,]+/)
      .map((x) => x.trim().toUpperCase())
      .filter(Boolean);
    const payload: CasinoSite = {
      slug,
      name: form.name!.trim(),
      tagline: (form.tagline || "").trim(),
      description: (form.description || "").trim(),
      url: form.url!.trim(),
      pros,
      cons: consLines.length ? consLines : undefined,
      paymentMethods: payLines.length ? payLines : undefined,
      bonusDetails: (form.bonusDetails || "").trim() || undefined,
      welcomeOffer: (form.welcomeOffer || "").trim() || undefined,
      noDepositNote: (form.noDepositNote || "").trim() || undefined,
      promoCode: (form.promoCode || "").trim() || undefined,
      regions: regionsRaw.length ? regionsRaw : undefined,
      rating: Number(form.rating) || 4,
      sortOrder: Number(form.sortOrder) || 0,
      active: Boolean(form.active),
      badge: (form.badge || "").trim() || undefined,
    };
    await setDoc(doc(getDb(), "sites", slug), payload);
    setModal(null);
    await refresh();
  }

  async function removeSite(slug: string) {
    if (!confirm(`Delete "${slug}"?`)) return;
    await deleteDoc(doc(getDb(), "sites", slug));
    await refresh();
  }

  async function logout() {
    await signOut(getFirebaseAuth());
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-[#0c0a12] text-zinc-200">
      <header className="border-b border-white/10 bg-black/30 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Royal Bet Hub — Admin</h1>
            <p className="text-sm text-zinc-500">Sites, hero slider, clicks, bonus leads</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
            >
              View site
            </Link>
            <button
              type="button"
              onClick={() => void handleSeedHero()}
              disabled={seedingHero}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600/80 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-50"
            >
              {seedingHero ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Images className="h-4 w-4" />
              )}
              Seed hero slides
            </button>
            <button
              type="button"
              onClick={() => void handleSeed()}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/80 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sprout className="h-4 w-4" />}
              Seed default casinos
            </button>
            <button
              type="button"
              onClick={() => openAdd()}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-[#1a1005] hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              Add site
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            Overview
          </h2>
          {loading ? (
            <p className="mt-4 text-zinc-500">Loading…</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-zinc-500">Page visits (recent window)</p>
                <p className="mt-1 text-3xl font-bold text-white">{stats.visits}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-zinc-500">Outbound clicks</p>
                <p className="mt-1 text-3xl font-bold text-amber-400">{stats.clicks}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-zinc-500">Bonus leads</p>
                <p className="mt-1 text-3xl font-bold text-emerald-400">{leads.length}</p>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Images className="h-5 w-5 text-violet-400" />
              Homepage hero slider
            </h2>
            <button
              type="button"
              onClick={() => openHeroAdd()}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-400"
            >
              <Plus className="h-4 w-4" />
              Add slide
            </button>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Image URL, headline, benefit text, and CTA URL. Shown at top of homepage; CTA opens in a
            new tab. Swipe on mobile.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/20 text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">CTA URL</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {heroSlides.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-zinc-500">
                      No slides. Use Seed hero slides or Add slide.
                    </td>
                  </tr>
                ) : (
                  heroSlides.map((h) => (
                    <tr key={h.id} className="border-b border-white/5">
                      <td className="px-4 py-3 font-medium text-white">{h.title}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-xs text-amber-200/80">
                        <a href={h.ctaUrl} target="_blank" rel="noreferrer" className="hover:underline">
                          {h.ctaUrl}
                        </a>
                      </td>
                      <td className="px-4 py-3">{h.sortOrder}</td>
                      <td className="px-4 py-3">{h.active ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openHeroEdit(h)}
                            className="rounded p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeHero(h.id)}
                            className="rounded p-2 text-red-400/80 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Clicks by partner (in loaded events)</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/20 text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(stats.bySite).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-zinc-500">
                      No clicks recorded yet.
                    </td>
                  </tr>
                ) : (
                  Object.entries(stats.bySite)
                    .sort((a, b) => b[1] - a[1])
                    .map(([slug, n]) => (
                      <tr key={slug} className="border-b border-white/5">
                        <td className="px-4 py-3 font-mono text-amber-200/90">{slug}</td>
                        <td className="px-4 py-3">{n}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Casino listings</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/20 text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">URL</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.slug} className="border-b border-white/5">
                    <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{s.slug}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-xs text-amber-200/80">
                      <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">
                        {s.url}
                      </a>
                    </td>
                    <td className="px-4 py-3">{s.active ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <a
                          href={`/go/${s.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                          title="Test redirect"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="rounded p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeSite(s.slug)}
                          className="rounded p-2 text-red-400/80 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Recent events</h2>
          <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-white/10 bg-[#12101a] text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Site</th>
                  <th className="px-3 py-2">Path</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 80).map((e) => (
                  <tr key={e.id} className="border-b border-white/5">
                    <td className="px-3 py-2">{e.type}</td>
                    <td className="px-3 py-2 font-mono text-amber-200/80">{e.siteSlug ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-500">{e.path ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-500">
                      {e.createdAt?.toDate
                        ? e.createdAt.toDate().toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Bonus lead submissions</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/20 text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Partner</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-zinc-500">
                      No leads yet.
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => (
                    <tr key={l.id} className="border-b border-white/5">
                      <td className="px-4 py-3 text-xs text-amber-200/90">
                        {l.siteName ? (
                          <>
                            {l.siteName}
                            {l.siteSlug ? (
                              <span className="mt-0.5 block font-mono text-zinc-500">{l.siteSlug}</span>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">{l.name}</td>
                      <td className="px-4 py-3">{l.email}</td>
                      <td className="px-4 py-3">{l.phone}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {l.createdAt?.toDate ? l.createdAt.toDate().toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#12101a] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-white">
              {modal === "add" ? "Add casino" : "Edit casino"}
            </h3>
            <div className="mt-4 space-y-3">
              <label className="block text-xs text-zinc-500">
                Slug (URL id, lowercase)
                <input
                  disabled={modal === "edit"}
                  value={form.slug || ""}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white disabled:opacity-60"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Name
                <input
                  value={form.name || ""}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Tagline
                <input
                  value={form.tagline || ""}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Description
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Partner / destination URL
                <input
                  value={form.url || ""}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Pros (one per line)
                <textarea
                  value={Array.isArray(form.pros) ? form.pros.join("\n") : ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pros: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
                    }))
                  }
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Cons (one per line, optional)
                <textarea
                  value={Array.isArray(form.cons) ? form.cons.join("\n") : ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      cons: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
                    }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Payment methods (one per line)
                <textarea
                  value={
                    Array.isArray(form.paymentMethods) ? form.paymentMethods.join("\n") : ""
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      paymentMethods: e.target.value
                        .split("\n")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    }))
                  }
                  rows={3}
                  placeholder={"UPI\nNetBanking\nCards"}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Welcome offer (short)
                <input
                  value={form.welcomeOffer || ""}
                  onChange={(e) => setForm((f) => ({ ...f, welcomeOffer: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                No-deposit note (optional)
                <input
                  value={form.noDepositNote || ""}
                  onChange={(e) => setForm((f) => ({ ...f, noDepositNote: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Bonus details (longer, optional)
                <textarea
                  value={form.bonusDetails || ""}
                  onChange={(e) => setForm((f) => ({ ...f, bonusDetails: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Promo code (optional)
                <input
                  value={form.promoCode || ""}
                  onChange={(e) => setForm((f) => ({ ...f, promoCode: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Regions (comma-separated, e.g. IN,ALL)
                <input
                  value={
                    Array.isArray(form.regions) ? form.regions.join(",") : String(form.regions || "")
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      regions: e.target.value
                        .split(/[,]+/)
                        .map((x) => x.trim().toUpperCase())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="IN"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-zinc-500">
                  Rating
                  <input
                    type="number"
                    step="0.1"
                    value={form.rating ?? 4}
                    onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block text-xs text-zinc-500">
                  Sort order
                  <input
                    type="number"
                    value={form.sortOrder ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={Boolean(form.active)}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Active (shown on homepage)
              </label>
              <label className="block text-xs text-zinc-500">
                Badge (optional)
                <input
                  value={form.badge || ""}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  placeholder="Popular, Sports, …"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveSite()}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[#1a1005] hover:bg-amber-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {heroModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#12101a] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-white">
              {heroEditingId ? "Edit hero slide" : "Add hero slide"}
            </h3>
            <div className="mt-4 space-y-3">
              <label className="block text-xs text-zinc-500">
                Image URL (full https URL)
                <input
                  value={heroForm.imageUrl || ""}
                  onChange={(e) => setHeroForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  placeholder="https://…"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Headline (title)
                <input
                  value={heroForm.title || ""}
                  onChange={(e) => setHeroForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Benefit / subtitle
                <textarea
                  value={heroForm.benefit || ""}
                  onChange={(e) => setHeroForm((f) => ({ ...f, benefit: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                CTA opens in new tab (destination URL)
                <input
                  value={heroForm.ctaUrl || ""}
                  onChange={(e) => setHeroForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  placeholder="https://…"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Button label
                <input
                  value={heroForm.ctaLabel || ""}
                  onChange={(e) => setHeroForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  placeholder="Play & sign up"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Sort order (lower first)
                <input
                  type="number"
                  value={heroForm.sortOrder ?? 0}
                  onChange={(e) =>
                    setHeroForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={Boolean(heroForm.active)}
                  onChange={(e) => setHeroForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Active (shown on homepage)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHeroModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveHero()}
                className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
