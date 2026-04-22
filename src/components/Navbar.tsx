import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchFromAniList } from "../lib/anilist";
import { SEARCH_QUERY } from "../lib/queries";
import type { NavigateFn, Page } from "../types";

interface NavbarProps {
  session: any;
  currentPage: Page;
  navigate: NavigateFn;
}

const Navbar = ({ session, currentPage, navigate }: NavbarProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Search debounce ────────────────────────────────────────────────────────
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const data = await fetchFromAniList(SEARCH_QUERY, { search: query });
        setResults(data?.Page?.media || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  // ── Close search on outside click ─────────────────────────────────────────
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

  // ── Close avatar dropdown on outside click ────────────────────────────────
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

  const initial = session?.user?.email?.[0]?.toUpperCase() ?? "?";
  const username =
    session?.user?.user_metadata?.username ?? session?.user?.email ?? "";

  const handleResultClick = (id: number) => {
    setResults([]);
    setQuery("");
    navigate("detail", id);
  };

  const MENU_ITEMS: {
    label: string;
    page: Page;
    icon: React.ReactNode;
  }[] = [
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
          className="icon icon-tabler icons-tabler-outline icon-tabler-home"
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
          className="icon icon-tabler icons-tabler-outline icon-tabler-book"
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
      className="icon icon-tabler icons-tabler-outline icon-tabler-logout"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
      <path d="M9 12h12l-3 -3" />
      <path d="M18 15l3 -3" />
    </svg>
  );

  return (
    <nav className="flex items-center gap-6 px-6 md:px-15 lg:px-30 xl:px-60 py-3 border-b border-slate-100 bg-white sticky top-0 z-50">
      {/* Logo */}
      <p
        className="font-heading text-xl font-bold shrink-0 cursor-pointer"
        onClick={() => navigate("home")}
      >
        ComicList
      </p>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-xl hidden md:block">
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

        {/* Search results dropdown */}
        {(results.length > 0 || searching) && (
          <div
            className="absolute top-full left-0 w-full bg-white shadow-xl rounded-xl mt-2
                          max-h-80 overflow-y-auto z-50 border border-slate-100"
          >
            {searching && (
              <p className="text-center text-slate-400 text-sm py-4">
                Mencari...
              </p>
            )}
            {results.map((item) => {
              const badge =
                item.countryOfOrigin === "KR"
                  ? "Manhwa"
                  : item.countryOfOrigin === "CN"
                    ? "Manhua"
                    : "Manga";
              return (
                <button
                  key={item.id}
                  onClick={() => handleResultClick(item.id)}
                  className="flex items-center gap-3 w-full p-2.5 hover:bg-slate-50 transition text-left"
                >
                  <img
                    src={item.coverImage.large}
                    className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                    alt=""
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {item.title.english || item.title.romaji}
                    </p>
                    <span className="text-xs text-slate-400">{badge}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {session ? (
          /* ── Avatar + Dropdown ── */
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowDropdown((v) => !v)}
              title={username}
              className={`w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-sm
                         flex items-center justify-center border-2 transition
                         ${showDropdown ? "border-indigo-400" : "border-transparent"}`}
            >
              {initial}
            </button>

            {showDropdown && (
              <div
                className="absolute right-0 top-[calc(100%+0.5rem)] w-52 bg-white
                              rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-400 mb-0.5">Logged in as</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {username}
                  </p>
                </div>

                {MENU_ITEMS.map(({ label, page, icon }) => (
                  <button
                    key={page}
                    onClick={() => go(page)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-slate-100 flex items-center gap-2
                               ${currentPage === page ? "text-slate-950 bg-slate-100 font-semibold" : "text-slate-600"}`}
                  >
                    <span className="flex items-center">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}

                <div className="h-px bg-slate-100" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition flex items-center gap-2"
                >
                  <span>{logoutIcon}</span>
                  <span> Log Out</span>
                </button>
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
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold
                         hover:bg-slate-700 transition"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
