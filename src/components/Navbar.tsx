import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchFromAniList } from "../lib/anilist";
import { SEARCH_QUERY } from "../lib/queries";
import type { NavigateFn, Page } from "../types";
import logo from "../assets/ComicList-logoFix.svg";
import { DarkMode } from "./DarkMode";

interface NavbarProps {
  session: any;
  currentPage: Page;
  navigate: NavigateFn;
}

// Unified result type buat gabungin AniList + Supabase
interface SearchResult {
  id: number | string;
  title: { english: string | null; romaji: string };
  coverImage: { large: string };
  countryOfOrigin: string;
  _isManual?: boolean;
}

const Navbar = ({ session, currentPage, navigate }: NavbarProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { isDarkMode, toggleTheme } = DarkMode();

  useEffect(() => {
    if (!session?.user?.id) return;

    const getAvatar = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", session.user.id)
        .single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    getAvatar();

    const channel = supabase
      .channel(`public:profiles:id=eq.${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${session.user.id}`,
        },
        (payload) => {
          if (payload.new) setAvatarUrl(payload.new.avatar_url);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Dual search: AniList + Supabase manual comics
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const start = Date.now();

        // 1. Search AniList
        const anilistPromise = fetchFromAniList(SEARCH_QUERY, { search: query })
          .then((data) => (data?.Page?.media || []) as SearchResult[])
          .catch(() => [] as SearchResult[]);

        // 2. Search Supabase — komik manual (external_id null)
        const supabasePromise = supabase
          .from("comics")
          .select("id, title, cover_url, type, external_id")
          .ilike("title", `%${query}%`)
          .is("external_id", null)
          .limit(5)
          .then(({ data }) => {
            if (!data) return [] as SearchResult[];
            return data.map(
              (c): SearchResult => ({
                id: c.id,
                title: { english: c.title, romaji: c.title },
                coverImage: { large: c.cover_url || "" },
                countryOfOrigin:
                  c.type === "manhwa"
                    ? "KR"
                    : c.type === "manhua"
                      ? "CN"
                      : "JP",
                _isManual: true,
              }),
            );
          });

        const [anilistResults, supabaseResults] = await Promise.all([
          anilistPromise,
          supabasePromise,
        ]);

        setResults([...anilistResults, ...supabaseResults]);
        const elapsed = Date.now() - start;
        const delay = Math.max(0, 300 - elapsed);
        setTimeout(() => setSearching(false), delay);
      } catch {
        setResults([]);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults([]);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setShowDropdown(false);
    await supabase.auth.signOut();
  };

  const go = (page: Page) => {
    setShowDropdown(false);
    navigate(page);
  };

  const handleResultClick = (item: SearchResult) => {
    setResults([]);
    setQuery("");
    navigate("detail", Number(item.id));
  };

  const initial = session?.user?.email?.[0]?.toUpperCase() ?? "?";
  const username =
    session?.user?.user_metadata?.username ?? session?.user?.email ?? "";

  const badgeLabel = (country: string) =>
    country === "KR" ? "Manhwa" : country === "CN" ? "Manhua" : "Manga";

  const MENU_ITEMS: { label: string; page: Page; icon: React.ReactNode }[] = [
    {
      label: "Home",
      page: "home",
      icon: (
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
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
          <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
          <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
        </svg>
      ),
    },
    {
      label: "Reading List",
      page: "dashboard",
      icon: (
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
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
          <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
          <path d="M3 6l0 13" />
          <path d="M12 6l0 13" />
          <path d="M21 6l0 13" />
        </svg>
      ),
    },
    {
      label: "Profile",
      page: "profile",
      icon: (
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
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M9 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
        </svg>
      ),
    },
  ];

  const logoutIcon = (
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
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
      <path d="M9 12h12l-3 -3" />
      <path d="M18 15l3 -3" />
    </svg>
  );

  const moonIcon = (
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
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" />
    </svg>
  );

  const sunIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
      <path d="M12 5l0 -2" />
      <path d="M17 7l1.4 -1.4" />
      <path d="M19 12l2 0" />
      <path d="M17 17l1.4 1.4" />
      <path d="M12 19l0 2" />
      <path d="M7 17l-1.4 1.4" />
      <path d="M6 12l-2 0" />
      <path d="M7 7l-1.4 -1.4" />
    </svg>
  );

  const SkeletonItem = () => (
    <div className="flex items-center gap-3 w-full p-2.5 animate-pulse">
      <div className="w-10 h-14 bg-(--cl-surface-2) rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-(--cl-surface-2) rounded w-3/4" />
        <div className="h-2 bg-(--cl-surface) rounded w-1/3" />
      </div>
    </div>
  );

  return (
    <>
      <nav className="flex items-center gap-4 px-4 md:px-10 lg:px-20 xl:px-40 py-3 border-b border-(--cl-border) bg-(--cl-surface) text-(--cl-text) sticky top-0 z-50">
        {/* Logo */}
        <p
          className="font-heading text-xl font-bold shrink-0 cursor-pointer flex items-center gap-2"
          onClick={() => navigate("home")}
        >
          <img src={logo} alt="ComicList Logo" className="h-16 w-auto" />
          <span className="lg:block hidden">ComicList</span>
        </p>

        {/* Search */}
        <div ref={searchRef} className="relative flex-1 max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--cl-text-muted) pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
              <path d="M21 21l-6 -6" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search Manga, Manhwa, Manhua..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full lg:w-full md:w-full pl-9 pr-4 py-2.5 border border-(--cl-border) rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-(--cl-border)"
          />

          {(results.length > 0 || searching) && (
            <div
              className="absolute top-full left-0 w-full bg-(--cl-surface) shadow-xl rounded-xl mt-2
                          max-h-80 overflow-y-auto z-50 border border-(--cl-border)"
            >
              {searching && (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonItem key={i} />
                  ))}
                </>
              )}
              {results.map((item) => (
                <button
                  key={`${item._isManual ? "manual" : "al"}-${item.id}`}
                  onClick={() => handleResultClick(item)}
                  className="flex items-center gap-3 w-full p-2.5 hover:bg-(--cl-bg) transition text-left"
                >
                  {item.coverImage.large ? (
                    <img
                      src={item.coverImage.large}
                      className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                      alt=""
                    />
                  ) : (
                    <div className="w-10 h-14 rounded-lg bg-(--cl-surface) flex-shrink-0 flex items-center justify-center text-(--cl-text-muted) text-xs">
                      No img
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-(--cl-text) truncate">
                      {item.title.english || item.title.romaji}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-(--cl-text-muted)">
                        {badgeLabel(item.countryOfOrigin)}
                      </span>
                      {item._isManual && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                          Manual
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {session ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowDropdown((v) => !v)}
                title={username}
                className={`w-9 h-9 rounded-full overflow-hidden bg-(--cl-surface) text-(--cl-text) font-bold text-sm
                   flex items-center justify-center border-2 transition
                   ${showDropdown ? "border-indigo-400" : "border-transparent"}`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initial
                )}
              </button>

              {showDropdown && (
                <div
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-52 bg-(--cl-surface)
                     rounded-xl shadow-xl border border-(--cl-border) overflow-hidden z-50"
                >
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-(--cl-border) bg-(--cl-surface-2)">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-(--cl-surface) shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-(--cl-text-muted)">
                          {initial}
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-(--cl-text-muted) uppercase font-bold tracking-wider">
                        Logged in
                      </p>
                      <p className="text-sm font-semibold text-(--cl-text) truncate">
                        {username}
                      </p>
                    </div>
                  </div>

                  {/* Desktop menu */}
                  <div className="hidden lg:block">
                    {MENU_ITEMS.map(({ label, page, icon }) => (
                      <button
                        key={page}
                        onClick={() => go(page)}
                        className={`w-full text-left px-4 py-2 text-sm transition hover:bg-(--cl-primary-hover) flex items-center gap-3
      ${currentPage === page ? "text-white bg-(--cl-primary) font-semibold" : "text-(--cl-text-muted) hover:text-white"}`}
                      >
                        <span className="flex items-center opacity-70">
                          {icon}
                        </span>
                        <span>{label}</span>
                      </button>
                    ))}

                    {/* Divider */}
                    <div className="my-1 border-t border-(--cl-border)" />

                    {/* Actions: theme toggle + logout */}
                    <div className="px-3 py-2 flex flex-col gap-1">
                      <button
                        className="theme-toggle w-full"
                        onClick={toggleTheme}
                        data-active={isDarkMode}
                      >
                        <div className="toggle-track">
                          <div className="toggle-thumb">
                            {isDarkMode ? moonIcon : sunIcon}
                          </div>
                        </div>
                        <span className="toggle-label">
                          {isDarkMode ? "Dark Mode" : "Light Mode"}
                        </span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition flex items-center gap-3"
                      >
                        <span className="opacity-70">{logoutIcon}</span>
                        <span className="font-medium">Log Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span
                onClick={() => navigate("auth")}
                className="text-sm text-(--cl-text-muted) whitespace-nowrap font-medium cursor-pointer hover:opacity-80 transition hidden sm:block"
              >
                Log In
              </span>
              <button
                onClick={() => navigate("auth")}
                className="px-4 py-2 bg-(--cl-primary) text-white whitespace-nowrap rounded-lg text-sm font-semibold hover:bg-(--cl-primary-hover) transition"
              >
                Sign Up
              </button>
              <button
                className="theme-toggle-icon hover:bg-(--cl-primary-hover) hover:text-white"
                onClick={toggleTheme}
                data-active={isDarkMode}
              >
                <div className="toggle-thumb-standalone">
                  {isDarkMode ? moonIcon : sunIcon}
                </div>
              </button>
            </div>
          )}
        </div>
      </nav>

      {session && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-(--cl-surface) border-t border-(--cl-border) lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.09)] ">
          <div className="flex justify-around items-center h-14">
            {MENU_ITEMS.map(({ label, page, icon }) => {
              const active = currentPage === page;

              return (
                <button
                  key={page}
                  onClick={() => navigate(page)}
                  className={`flex flex-col items-center justify-center text-xs ${
                    active ? "text-(--cl-text)" : "text-(--cl-text-muted)"
                  }`}
                >
                  <div className={`${active ? "scale-110" : ""} transition`}>
                    {icon}
                  </div>
                  <span className="mt-0.5">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
