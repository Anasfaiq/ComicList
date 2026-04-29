import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchFromAniList } from "../lib/anilist";
import { QUERIES_BY_TAB } from "../lib/queries";
import { getAuthor, getBadge, formatScore, getTitle } from "../lib/utils";
import type { Comic, TabId, Tab, NavigateFn } from "../types";
import AddComicModal from "./AddComicModal";
import "../styles/comic.css";

// Tabs
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

const sidebarIcons: Record<string, React.ReactNode> = {
  thropy: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-trophy"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M8 21l8 0" />
      <path d="M12 17l0 4" />
      <path d="M7 4l10 0" />
      <path d="M17 4v8a5 5 0 0 1 -10 0v-8" />
      <path d="M3 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M17 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    </svg>
  ),
  bubble: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-message-circle"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1" />
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
      <div className="comic-card-cover bg-(--cl-surface-2)">
        <img src={comic.coverImage.large} alt={title} loading="lazy" />
        <span
          className="comic-card-badge"
          style={{ backgroundColor: badge.color }}
        >
          {badge.label}
        </span>
      </div>
      <div className="comic-card-info">
        <p className="comic-card-title text-(--cl-text)" title={title}>
          {title}
        </p>
        <p className="comic-card-author text-(--cl-text-muted)" title={author}>
          {author}
        </p>
        <p className="comic-card-score">⭐ {score}</p>
      </div>
    </div>
  );
};

// Main
interface HomePageProps {
  navigate: NavigateFn;
  session?: any;
}

const HomePage = ({ navigate, session }: HomePageProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("trending");
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadTopContributors();
    loadRecentReviews();
    fetchFromAniList(QUERIES_BY_TAB[activeTab])
      .then((data) => setComics(data.Page.media))
      .catch(() => setError("Gagal ngambil data. Coba refresh."))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const loadTopContributors = async () => {
    const { data, error } = await supabase.from("comments").select("user_id");

    if (error || !data) return;

    // hitung manual (biar fleksibel)
    const countMap: Record<string, number> = {};

    data.forEach((c) => {
      countMap[c.user_id] = (countMap[c.user_id] || 0) + 1;
    });

    const sorted = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const userIds = sorted.map(([id]) => id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

    const result = sorted.map(([id, count], i) => ({
      rank: i + 1,
      id: id,
      name: profiles?.find((p) => p.id === id)?.username ?? "Unknown",
      reviews: count,
    }));

    setTopContributors(result);
  };

  const loadRecentReviews = async () => {
    const { data, error } = await supabase
      .from("ratings")
      .select(
        `
      score,
      created_at,
      user_id,
      profiles!fk_user (username), 
      comics!fk_comic (title)
    `,
      ) // Pakai nama constraint yang ada di foto lu tadi
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Gagal get recent reviews:", error.message);
      return;
    }

    if (!data) return;

    const result = data.map((r: any) => ({
      // Cek apakah r.profiles itu object atau array, biasanya object kalau many-to-one
      user_id: r.user_id,
      user: r.profiles?.username || r.profiles?.[0]?.username || "Unknown",
      title: r.comics?.title || r.comics?.[0]?.title || "Unknown",
      score: `${r.score}/10`,
    }));

    setRecentReviews(result);
  };

  const AccordionSection = ({
    id,
    title,
    icon,
    children,
  }: {
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => {
    const isOpen = openSection === id;

    return (
      <div className="bg-(--cl-bg) border border-(--cl-border) 100 rounded-2xl">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-(--cl-text)">
            {icon}
            <span>{title}</span>
          </div>

          {/* Chevron */}
          <span className="lg:hidden text-(--cl-text-muted)">
            <Chevron isOpen={isOpen} />
          </span>
        </button>

        {/* Animated Content */}
        <div
          className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-96 pb-4" : "max-h-0"
          } lg:max-h-none lg:block`}
        >
          {children}
        </div>
      </div>
    );
  };

  const Chevron = ({ isOpen }: { isOpen: boolean }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
        isOpen ? "rotate-180" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7l-7-7" />
    </svg>
  );

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Main Content  */}
        <div className="flex-1 min-w-0">
          {/* Filter Tabs */}
          <div className="tab-bar flex gap-2 mb-2 overflow-auto scroll-smooth">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn rounded-xl px-4 py-2 flex items-center gap-2 whitespace-nowrap border border-(--cl-border) text-(--cl-text) font-accent font-medium text-sm transition-all cursor-pointer hover:bg-(--cl-surface-2) ${
                  activeTab === tab.id
                    ? "bg-(--cl-primary) text-white hover:text-(--cl-text) border-(--cl-primary)"
                    : "text-(--cl-text-muted) hover:bg-(--cl-surface-2)"
                }`}
              >
                <span>{TAB_ICONS[tab.id]}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="text-center py-16 text-(--cl-text-muted)">
              <p>{error}</p>
            </div>
          )}

          {/* Comic Grid */}
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

        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
          <div className="bg-(--cl-surface) text-(--cl-text) rounded-2xl p-5">
            <div className="text-2xl mb-3">+</div>
            <h3 className="font-bold text-base mb-1">Can't find a title?</h3>
            <p className="text-(--cl-text-muted) text-sm mb-4 leading-relaxed">
              Help grow our database by adding new manga, manhwa, or manhua.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full bg-(--cl-primary) text-white font-semibold py-2 rounded-lg text-sm
                         hover:bg-(--cl-primary-hover) transition"
            >
              Add to Database
            </button>
          </div>

          {/* Top Contributors */}
          <AccordionSection
            id="contributors"
            title="Top Contributors"
            icon={sidebarIcons.thropy}
          >
            <div className="space-y-3">
              {topContributors.map((c) => (
                <div key={c.rank} className="flex items-start gap-3">
                  <span className="text-xs text-(--cl-text-muted) pt-0.5 w-5">
                    #{c.rank}
                  </span>
                  <div>
                    <p
                      className="text-sm font-semibold text-(--cl-text) hover:underline cursor-pointer"
                      onClick={() => navigate("user-profile", undefined, c.id)}
                    >
                      {c.name}
                    </p>
                    <p className="text-xs text-(--cl-text-muted)">
                      {c.reviews} reviews
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* Recent Reviews */}
          <AccordionSection
            id="reviews"
            title="Recent Reviews"
            icon={sidebarIcons.bubble}
          >
            <div className="space-y-4">
              {recentReviews.map((r, i) => (
                <div key={i}>
                  <p
                    className="text-xs text-(--cl-text-muted) mb-0.5 cursor-pointer hover:underline"
                    onClick={() => navigate("user-profile", undefined, r.user_id)}
                  >
                    {r.user} reviewed
                  </p>
                  <p className="text-sm font-semibold text-(--cl-text)">
                    {r.title}
                  </p>
                  <p className="text-xs text-(--cl-text-muted) line-clamp-2">
                    ⭐ {r.score}
                  </p>
                </div>
              ))}
            </div>
          </AccordionSection>
        </aside>
      </div>

      {/* Add Comic Modal */}
      {showAddModal && (
        <AddComicModal
          session={session}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
};

export default HomePage;
