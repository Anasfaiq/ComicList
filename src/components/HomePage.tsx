import React, { useEffect, useState } from "react";
import { fetchFromAniList } from "../lib/anilist";

// Types

type TabId = "trending" | "topRated" | "newManhwa" | "popularManga";

interface Comic {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string };
  averageScore: number | null;
  countryOfOrigin: string;
}

// AniList Queries

const buildQuery = (sort: string, country?: string) => `
  query {
    Page(page: 1, perPage: 8) {
      media(
        sort: [${sort}]
        type: MANGA
        ${country ? `countryOfOrigin: ${country}` : ""}
        isAdult: false
      ) {
        id
        title { romaji english }
        coverImage { large }
        averageScore
        countryOfOrigin
      }
    }
  }
`;

const QUERIES: Record<TabId, string> = {
  trending: buildQuery("TRENDING_DESC"),
  topRated: buildQuery("SCORE_DESC"),
  newManhwa: buildQuery("START_DATE_DESC", "KR"),
  popularManga: buildQuery("POPULARITY_DESC", "JP"),
};

// Tabs Config

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "trending",
    label: "Trending Today",
    icon: (
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
  },
  {
    id: "topRated",
    label: "Top Rated",
    icon: (
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
  },
  {
    id: "newManhwa",
    label: "New Manhwa",
    icon: (
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
  },
  {
    id: "popularManga",
    label: "Popular Manga",
    icon: (
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
  },
];

//  Helpers

const getBadge = (country: string): { label: string; color: string } => {
  if (country === "KR") return { label: "Manhwa", color: "bg-green-500" };
  if (country === "CN") return { label: "Manhua", color: "bg-orange-500" };
  return { label: "Manga", color: "bg-blue-500" };
};

//  Skeleton Card

const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-slate-200 rounded-xl aspect-2/3 w-full mb-2" />
    <div className="h-3.5 bg-slate-200 rounded w-3/4 mb-1" />
    <div className="h-3 bg-slate-100 rounded w-1/3" />
  </div>
);

//  Comic Card

const ComicCard = ({ comic }: { comic: Comic }) => {
  const badge = getBadge(comic.countryOfOrigin);
  const title = comic.title.english || comic.title.romaji;
  const score = comic.averageScore
    ? (comic.averageScore / 10).toFixed(1)
    : "N/A";

  return (
    <div className="group cursor-pointer">
      <div className="relative rounded-xl overflow-hidden aspect-2/3 bg-slate-100">
        <img
          src={comic.coverImage.large}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <span
          className={`absolute top-2 right-2 ${badge.color} text-white text-xs font-bold px-2 py-0.5 rounded`}
        >
          {badge.label}
        </span>
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
          {title}
        </p>
        <p className="text-xs text-amber-500 font-medium mt-0.5">
          ⭐ {score}/10
        </p>
      </div>
    </div>
  );
};

//  Sidebar Data (static dulu, nanti bisa dari Supabase)

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

//  Main Component

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<TabId>("trending");
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchFromAniList(QUERIES[activeTab])
      .then((data) => {
        setComics(data.Page.media);
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal ngambil data. Coba refresh.");
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6 flex gap-6">
      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition rounded-lg ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-2xl mb-2">😵</p>
            <p>{error}</p>
          </div>
        )}

        {/* Comic Grid */}
        {!error && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "1rem",
            }}
          >
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : comics.map((comic) => (
                  <ComicCard key={comic.id} comic={comic} />
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
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
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
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            💬 Recent Reviews
          </h3>
          <div className="space-y-4">
            {RECENT_REVIEWS.map((r, i) => (
              <div key={i}>
                <p className="text-xs text-slate-400">{r.user} reviewed</p>
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
