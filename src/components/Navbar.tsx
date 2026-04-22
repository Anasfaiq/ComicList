import { useEffect, useState } from "react";
import { useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchFromAniList } from "../lib/anilist";

interface NavbarProps {
  onAuthClick?: () => void;
}

const SEARCH_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 10) {
      media(search: $search, type: MANGA, isAdult: false) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
        }
      }
    }
  }
`;

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
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
);

const Navbar = ({ onAuthClick }: NavbarProps) => {
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!query) return;
    if (query.length < 3) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const res = await fetchFromAniList(SEARCH_QUERY, { search: query });
        setResults(res?.Page?.media || []);
      } catch (error) {
        console.error("Error searching AniList:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce: tunggu 500ms setelah user berhenti ketik

    return () => clearTimeout(timeout); // Bersihkan timeout kalau query berubah lagi
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchRef.current) return;

      if (!searchRef.current.contains(event.target as Node)) {
        setResults([]); // nutup dropdown
        setQuery(""); // kosongin query juga biar search bar balik ke placeholder
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="flex items-center gap-8 px-6 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
      {/* Logo */}
      <p className="font-heading text-xl font-bold shrink-0">ComicList</p>

      {/* Search bar — hidden di mobile */}
      <div ref={searchRef} className="relative hidden md:flex flex-1 max-w-xl">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Search Manga, Manhwa, Manhua..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading && <p>Loading...</p>}
        {query && results.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-xl mt-2 max-h-80 overflow-y-auto z-50">
            {results.map((item) => (
              <div key={item.id} className="flex gap-3 p-2 hover:bg-gray-100">
                <img
                  src={item.coverImage.large}
                  className="w-12 h-16 object-cover rounded"
                />
                <p className="text-sm">
                  {item.title.english || item.title.romaji}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex ml-auto items-center gap-2 shrink-0">
        {/* Search icon — mobile only */}
        <button className="md:hidden p-2 text-gray-500 hover:text-gray-700">
          <SearchIcon />
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm font-medium text-slate-600">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-semibold hover:bg-red-100 transition"
            >
              Log Out
            </button>
          </div>
        ) : (
          <>
            {/* Log In — panggil onAuthClick */}
            <span
              onClick={onAuthClick}
              className="hidden sm:block text-sm text-slate-600 font-medium cursor-pointer hover:text-slate-900 transition"
            >
              Log In
            </span>
            {/* Sign Up — panggil onAuthClick juga */}
            <button
              onClick={onAuthClick}
              className="px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
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
