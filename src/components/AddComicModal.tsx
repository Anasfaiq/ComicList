import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchFromAniList } from "../lib/anilist";
import { SEARCH_QUERY } from "../lib/queries";
import { getAuthor, cleanDescription } from "../lib/utils";

interface AddComicModalProps {
  session: any;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  KR: "MANHWA",
  CN: "MANHUA",
  JP: "MANGA",
};

// Fetch detail sebelum insert (perlu description + staff)
const MINI_DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: MANGA) {
      id
      title { romaji english }
      coverImage { large }
      description(asHtml: false)
      countryOfOrigin
      status
      staff(perPage: 5) {
        edges {
          role
          node { name { full } }
        }
      }
    }
  }
`;

const AddComicModal = ({ session, onClose }: AddComicModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setErrorMsg("");
    try {
      const data = await fetchFromAniList(SEARCH_QUERY, { search: query });
      const media = data?.Page?.media || [];
      setResults(media);
      if (media.length === 0)
        setErrorMsg("Gak ada hasil. Coba kata kunci lain.");
    } catch {
      setErrorMsg("Gagal search. Coba lagi.");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (item: any) => {
    if (!session) return;
    setSavingId(item.id);
    setErrorMsg("");

    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from("comics")
        .select("id")
        .eq("external_id", item.id)
        .maybeSingle();

      if (existing?.id) {
        setSavedIds((prev) => new Set([...prev, item.id]));
        setSavingId(null);
        return;
      }

      // Fetch full details from AniList
      const detail = await fetchFromAniList(MINI_DETAIL_QUERY, { id: item.id });
      const m = detail.Media;

      const { error } = await supabase.from("comics").insert({
        title: m.title.english || m.title.romaji,
        synopsis: cleanDescription(m.description, 500),
        cover_url: m.coverImage?.large,
        author: getAuthor(m.staff?.edges || []),
        type: TYPE_LABELS[m.countryOfOrigin] ?? "MANGA",
        status: m.status ?? "UNKNOWN",
        external_id: m.id,
        created_by: session.user.id,
      });

      if (error) {
        // If duplicate (race condition), still mark as saved
        if (error.code === "23505") {
          setSavedIds((prev) => new Set([...prev, item.id]));
        } else {
          setErrorMsg("Gagal menambah: " + error.message);
        }
      } else {
        setSavedIds((prev) => new Set([...prev, item.id]));
      }
    } catch {
      setErrorMsg("Terjadi error, coba lagi.");
    }

    setSavingId(null);
  };

  const badgeLabel = (country: string) =>
    country === "KR" ? "Manhwa" : country === "CN" ? "Manhua" : "Manga";
  const badgeColor = (country: string) =>
    country === "KR" ? "#22c55e" : country === "CN" ? "#f97316" : "#3b82f6";

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base">
            Add Comic to Database
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400
                       hover:bg-slate-100 hover:text-slate-600 transition text-lg font-light"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Search input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Cari judul manga, manhwa, manhua..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-300"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold
                         hover:bg-slate-700 transition disabled:opacity-40"
            >
              {searching ? (
                <svg
                  className="animate-spin w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                "Search"
              )}
            </button>
          </div>

          {/* Error */}
          {errorMsg && <p className="text-red-500 text-xs mb-3">{errorMsg}</p>}

          {/* Hint sebelum search */}
          {results.length === 0 && !errorMsg && (
            <div className="text-center py-8 text-slate-400 text-sm">
              <p className="text-3xl mb-2">🔍</p>
              <p>Ketik judul komik lalu tekan Enter atau klik Search</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {results.map((item) => {
                const isSaved = savedIds.has(item.id);
                const isSaving = savingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                  >
                    <img
                      src={item.coverImage.large}
                      className="w-10 h-14 object-cover rounded-lg shrink-0"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item.title.english || item.title.romaji}
                      </p>
                      <span
                        className="inline-block text-white text-xs font-bold px-1.5 py-0.5 rounded mt-0.5"
                        style={{
                          backgroundColor: badgeColor(item.countryOfOrigin),
                        }}
                      >
                        {badgeLabel(item.countryOfOrigin)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAdd(item)}
                      disabled={isSaved || isSaving || !session}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition
                        ${
                          isSaved
                            ? "bg-green-50 text-green-600 border border-green-200"
                            : "bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-40"
                        }`}
                    >
                      {isSaving ? "..." : isSaved ? "Added ✓" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Not logged in warning */}
          {!session && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
              ⚠️ Kamu harus login untuk menambah komik ke database.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddComicModal;
