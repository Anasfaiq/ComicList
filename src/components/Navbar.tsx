import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchFromAniList } from "../lib/anilist";
import { SEARCH_QUERY } from "../lib/queries";
import type { NavigateFn, Page } from "../types";
import logo from "../assets/ComicList-logoFix.svg";

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
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
      } finally {
        setSearching(false);
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
    navigate("detail", item.id);
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

  const SkeletonItem = () => (
    <div className="flex items-center gap-3 w-full p-2.5 animate-pulse">
      <div className="w-10 h-14 bg-slate-200 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-2 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
  );

  return (
    <>
      <nav className="flex items-center gap-4 px-4 md:px-10 lg:px-20 xl:px-40 py-3 border-b border-slate-100 bg-white sticky top-0 z-50">
        {showMobileSearch && (
          <div className="fixed inset-0 bg-white z-[60] p-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setShowMobileSearch(false)}>
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
                  className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-left"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M5 12l14 0" />
                  <path d="M5 12l6 6" />
                  <path d="M5 12l6 -6" />
                </svg>
              </button>
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {searching
                ? Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonItem key={i} />
                  ))
                : results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleResultClick(item);
                        setShowMobileSearch(false);
                      }}
                      className="flex items-center gap-3 w-full p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <img
                        src={item.coverImage.large}
                        className="w-10 h-14 object-cover rounded"
                      />
                      <p className="text-sm text-left">
                        {item.title.english || item.title.romaji}
                      </p>
                    </button>
                  ))}
            </div>
          </div>
        )}
        {/* Logo */}
        <p
          className="font-heading text-xl font-bold shrink-0 cursor-pointer flex items-center gap-2"
          onClick={() => navigate("home")}
        >
          <img src={logo} alt="ComicList Logo" className="h-16 w-auto" />
          <span>ComicList</span>
        </p>

        {/* Search */}
        <div
          ref={searchRef}
          className="relative flex-1 max-w-xl hidden lg:block"
        >
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-slate-300"
          />

          {(results.length > 0 || searching) && (
            <div
              className="absolute top-full left-0 w-full bg-white shadow-xl rounded-xl mt-2
                          max-h-80 overflow-y-auto z-50 border border-slate-100"
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
                  className="flex items-center gap-3 w-full p-2.5 hover:bg-slate-50 transition text-left"
                >
                  {item.coverImage.large ? (
                    <img
                      src={item.coverImage.large}
                      className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                      alt=""
                    />
                  ) : (
                    <div className="w-10 h-14 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-300 text-xs">
                      No img
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {item.title.english || item.title.romaji}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-400">
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
          {/* Mobile Search Button */}
          <button
            onClick={() => setShowMobileSearch(true)}
            className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
          >
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
          </button>

          {session ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowDropdown((v) => !v)}
                title={username}
                className={`w-9 h-9 rounded-full overflow-hidden bg-slate-900 text-white font-bold text-sm
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
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-52 bg-white
                     rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {initial}
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Logged in
                      </p>
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {username}
                      </p>
                    </div>
                  </div>

                  {/* Desktop menu */}
                  <div className="py-1 hidden lg:block">
                    {MENU_ITEMS.map(({ label, page, icon }) => (
                      <button
                        key={page}
                        onClick={() => go(page)}
                        className={`w-full text-left px-4 py-2 text-sm transition hover:bg-slate-100 flex items-center gap-3
                        ${currentPage === page ? "text-indigo-600 bg-indigo-50 font-semibold" : "text-slate-600"}`}
                      >
                        <span className="flex items-center opacity-70">
                          {icon}
                        </span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Mobile logout only */}
                  <div className="py-1 lg:hidden">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition flex items-center gap-3"
                    >
                      <span className="opacity-70">{logoutIcon}</span>
                      <span className="font-medium">Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <span
                onClick={() => navigate("auth")}
                className="text-sm text-slate-600 font-medium cursor-pointer hover:text-slate-900 transition hidden sm:block"
              >
                Log In
              </span>
              <button
                onClick={() => navigate("auth")}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {session && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.09)] ">
          <div className="flex justify-around items-center h-14">
            {MENU_ITEMS.map(({ label, page, icon }) => {
              const active = currentPage === page;

              return (
                <button
                  key={page}
                  onClick={() => navigate(page)}
                  className={`flex flex-col items-center justify-center text-xs ${
                    active ? "text-indigo-600" : "text-slate-400"
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
