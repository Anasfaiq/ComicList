import { useEffect, useState, type ReactNode } from "react";
import { fetchFromAniList } from "../lib/anilist";
import { QUERIES_BY_TAB } from "../lib/queries";
import { getAuthor, getBadge, formatScore, getTitle } from "../lib/utils";
import type { Comic, TabId, Tab, NavigateFn } from "../types";
import "../styles/comic.css";

// Tabs Config
const TABS: Tab[] = [
  { id: "trending", label: "Trending Today" },
  { id: "topRated", label: "Top Rated" },
  { id: "newManhwa", label: "New Manhwa" },
  { id: "popularManga", label: "Popular Manga" },
];

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  trending: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-trending-up"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 17l6 -6l4 4l8 -8" />
      <path d="M14 7l7 0l0 7" />
    </svg>
  ),
  topRated: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-star"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" />
    </svg>
  ),
  newManhwa: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-sparkles"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6" />
    </svg>
  ),
  popularManga: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-flame"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.294 -2.333 5.588c0 3.704 3.134 6.706 7 6.706c3.866 0 7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235" />
    </svg>
  ),
};

// Skeleton Card
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-cover" />
    <div className="skeleton-line skeleton-line-title" />
    <div className="skeleton-line skeleton-line-sub" />
    <div className="skeleton-line skeleton-line-sub" style={{ width: "35%" }} />
  </div>
);

// Comic Card
const ComicCard = ({
  comic,
  onClick,
}: {
  comic: Comic;
  onClick: () => void;
}) => {
  const badge = getBadge(comic.countryOfOrigin);
  const title = getTitle(comic.title);
  const score = formatScore(comic.averageScore);
  const author = getAuthor(comic.staff.edges);

  return (
    <div className="comic-card" onClick={onClick}>
      <div className="comic-card-cover">
        <img src={comic.coverImage.large} alt={title} loading="lazy" />
        <span
          className="comic-card-badge"
          style={{ backgroundColor: badge.color }}
        >
          {badge.label}
        </span>
      </div>
      <div className="comic-card-info">
        <p className="comic-card-title" title={title}>
          {title}
        </p>
        <p className="comic-card-author" title={author}>
          {author}
        </p>
        <p className="comic-card-score">⭐ {score}</p>
      </div>
    </div>
  );
};

// Sidebar Static Data
const TOP_CONTRIBUTORS = [
  { rank: 1, name: "MangaExpert42", reviews: 847 },
  { rank: 2, name: "ManhwaFanatic", reviews: 623 },
  { rank: 3, name: "ComicCritic", reviews: 512 },
  { rank: 4, name: "OtakuReviewer", reviews: 489 },
];

const RECENT_REVIEWS = [
  { user: "KoreaLover", title: "Solo Leveling", score: "9.5/10" },
  { user: "ActionFan", title: "One Punch Man", score: "9.0/10" },
];

// Main Component
const HomePage = ({ navigate }: { navigate: NavigateFn }) => {
  const [activeTab, setActiveTab] = useState<TabId>("trending");
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchFromAniList(QUERIES_BY_TAB[activeTab])
      .then((data) => setComics(data.Page.media))
      .catch(() => setError("Gagal ngambil data. Coba refresh."))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6 flex gap-6">
      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0">
        {/* Filter Tabs */}
        <div className="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn${activeTab === tab.id ? " tab-btn--active" : ""}`}
            >
              <span>{TAB_ICONS[tab.id]}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-3xl mb-2">😵</p>
            <p>{error}</p>
          </div>
        )}

        {/* Comic Grid — responsive via comic.css */}
        {!error && (
          <div className="comic-grid">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : comics.map((comic) => (
                  <ComicCard
                    key={comic.id}
                    comic={comic}
                    onClick={() => navigate("detail", comic.id)}
                  />
                ))}
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-4">
        {/* Can't find a title? */}
        <div className="bg-slate-800 text-white rounded-2xl p-5">
          <div className="text-2xl mb-3">+</div>
          <h3 className="font-bold text-base mb-1">Can't find a title?</h3>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
            Help grow our database by adding new manga, manhwa, or manhua.
          </p>
          <button className="w-full bg-white text-slate-900 font-semibold py-2 rounded-lg text-sm hover:bg-slate-100 transition">
            Add to Database
          </button>
        </div>

        {/* Top Contributors */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">
            🏆 Top Contributors
          </h3>
          <div className="space-y-3">
            {TOP_CONTRIBUTORS.map((c) => (
              <div key={c.rank} className="flex items-start gap-3">
                <span className="text-xs text-slate-400 pt-0.5 w-5">
                  #{c.rank}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700 leading-tight">
                    {c.name}
                  </p>
                  <p className="text-xs text-slate-400">{c.reviews} reviews</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">
            💬 Recent Reviews
          </h3>
          <div className="space-y-4">
            {RECENT_REVIEWS.map((r, i) => (
              <div key={i}>
                <p className="text-xs text-slate-400 mb-0.5">
                  {r.user} reviewed
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {r.title}
                </p>
                <p className="text-xs text-amber-500 font-bold">{r.score}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default HomePage;
