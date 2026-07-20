import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import PendingApprovalPage from "@/pages/PendingApprovalPage";
import {
  MagnifyingGlass,
  MapPin,
  Buildings,
  Boat,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useT();
  const [tab, setTab] = useState("ceramics");
  const [query, setQuery] = useState("");
  const [ceramics, setCeramics] = useState([]);
  const [yards, setYards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.status !== "approved" && user?.role !== "admin") return;
    (async () => {
      setLoading(true);
      try {
        const [c, y] = await Promise.all([api.get("/ceramics"), api.get("/yards")]);
        setCeramics(c.data);
        setYards(y.data);
      } catch (e) {
        toast.error(formatApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filteredCeramics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ceramics;
    return ceramics.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [ceramics, query]);

  const filteredYards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return yards;
    return yards.filter(
      (y) =>
        y.name.toLowerCase().includes(q) ||
        y.port.toLowerCase().includes(q)
    );
  }, [yards, query]);

  if (user && user.status !== "approved" && user.role !== "admin") {
    return <PendingApprovalPage />;
  }

  const total = tab === "ceramics" ? filteredCeramics.length : filteredYards.length;
  const resultsText =
    total === 1 ? t("dashboard.results", { n: total }) : t("dashboard.results.plural", { n: total });

  const TABS = [
    { key: "ceramics", label: t("dashboard.tab.ceramics"), icon: Buildings },
    { key: "yards", label: t("dashboard.tab.yards"), icon: Boat },
  ];

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="label-eyebrow text-blue-600 mb-2">{t("dashboard.eyebrow")}</div>
          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-slate-900 max-w-3xl">
            {t("dashboard.title")}
          </h1>
          <p className="text-slate-500 mt-3 max-w-2xl text-sm sm:text-base">
            {t("dashboard.subtitle")}
          </p>
        </div>
      </section>

      <div
        className="sticky top-14 z-30 bg-white border-b border-slate-200"
        data-testid="dashboard-controls"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1 flex items-center h-11 px-3 rounded-full border border-slate-300 bg-white focus-within:border-slate-900 transition-colors">
            <MagnifyingGlass size={18} weight="bold" className="text-slate-400 mr-2" />
            <input
              data-testid="dashboard-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === "ceramics"
                  ? t("dashboard.search.ceramics")
                  : t("dashboard.search.yards")
              }
              className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400"
            />
            {query && (
              <button
                data-testid="dashboard-search-clear"
                onClick={() => setQuery("")}
                className="text-xs text-slate-500 hover:text-slate-900 px-2"
              >
                {t("dashboard.search.clear")}
              </button>
            )}
          </div>
          <div
            className="flex items-center gap-1 p-1 rounded-full bg-slate-100"
            role="tablist"
          >
            {TABS.map((tab_) => {
              const Icon = tab_.icon;
              const active = tab === tab_.key;
              return (
                <button
                  key={tab_.key}
                  data-testid={`dashboard-tab-${tab_.key}`}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(tab_.key)}
                  className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon size={14} weight="bold" />
                  {tab_.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="label-eyebrow">
            {tab === "ceramics"
              ? t("dashboard.section.ceramics")
              : t("dashboard.section.yards")}
          </div>
          <div className="text-xs font-mono-jp text-slate-500" data-testid="dashboard-result-count">
            {loading ? t("dashboard.loading") : resultsText}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 label-eyebrow">
            {t("dashboard.loading")}
          </div>
        ) : tab === "ceramics" ? (
          <ul className="divide-y divide-slate-200 border-t border-slate-200">
            {filteredCeramics.map((c) => (
              <li
                key={c.id}
                data-testid={`ceramic-row-${c.id}`}
                className="row-line py-4 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-display font-bold text-slate-900 text-lg truncate">
                    {c.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 mr-2 label-eyebrow text-[0.65rem]">
                      {c.category}
                    </span>
                    {t("dashboard.location")}
                  </div>
                </div>
                <div className="flex gap-2 self-start sm:self-center">
                  <a
                    data-testid={`ceramic-map-link-${c.id}`}
                    href={c.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
                  >
                    <MapPin size={14} weight="bold" />
                    {t("dashboard.maps")}
                    <ArrowUpRight size={12} weight="bold" />
                  </a>
                </div>
              </li>
            ))}
            {filteredCeramics.length === 0 && (
              <li className="py-12 text-center text-slate-400 label-eyebrow">
                {t("dashboard.empty")}
              </li>
            )}
          </ul>
        ) : (
          <ul className="divide-y divide-slate-200 border-t border-slate-200">
            {filteredYards.map((y) => (
              <li
                key={y.id}
                data-testid={`yard-row-${y.id}`}
                className="row-line py-4 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-display font-bold text-slate-900 text-lg truncate">
                    {y.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full label-eyebrow text-[0.65rem] ${
                        y.port === "Mundra"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}
                    >
                      {t("dashboard.port", { port: y.port })}
                    </span>
                    {t("dashboard.yardType")}
                  </div>
                </div>
                <div className="flex gap-2 self-start sm:self-center">
                  <a
                    data-testid={`yard-map-link-${y.id}`}
                    href={y.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
                  >
                    <MapPin size={14} weight="bold" />
                    {t("dashboard.maps")}
                    <ArrowUpRight size={12} weight="bold" />
                  </a>
                </div>
              </li>
            ))}
            {filteredYards.length === 0 && (
              <li className="py-12 text-center text-slate-400 label-eyebrow">
                {t("dashboard.empty")}
              </li>
            )}
          </ul>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-xs text-slate-400 font-mono-jp">
        {t("dashboard.footer", { name: user?.name })}
      </footer>
    </div>
  );
}
