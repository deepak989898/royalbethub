"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Sprout,
} from "lucide-react";
import Link from "next/link";
import { DEFAULT_CASINO_SITES } from "@/lib/default-sites";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import type { AnalyticsEvent, BonusLead, CasinoSite } from "@/lib/types";

type EventRow = AnalyticsEvent & { id: string };

export function AdminDashboard() {
  const [sites, setSites] = useState<CasinoSite[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [leads, setLeads] = useState<(BonusLead & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<CasinoSite>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const sq = query(collection(getDb(), "sites"), orderBy("sortOrder", "asc"));
      const siteSnap = await getDocs(sq);
      const siteRows: CasinoSite[] = [];
      siteSnap.forEach((d) => {
        const data = d.data() as CasinoSite;
        siteRows.push({ ...data, slug: data.slug || d.id });
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
    });
    setModal("add");
  }

  function openEdit(site: CasinoSite) {
    setForm({ ...site, pros: [...site.pros] });
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
    const payload: CasinoSite = {
      slug,
      name: form.name!.trim(),
      tagline: (form.tagline || "").trim(),
      description: (form.description || "").trim(),
      url: form.url!.trim(),
      pros,
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
            <p className="text-sm text-zinc-500">Sites, clicks, visits, bonus leads</p>
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
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/20 text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-zinc-500">
                      No leads yet.
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => (
                    <tr key={l.id} className="border-b border-white/5">
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
                Affiliate URL
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
    </div>
  );
}
