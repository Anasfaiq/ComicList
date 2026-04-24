import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchFromAniList } from "../lib/anilist";
import { SEARCH_QUERY } from "../lib/queries";
import { getAuthor, cleanDescription } from "../lib/utils";

interface AddComicModalProps {
  session: any;
  onClose: () => void;
}

type TabMode = "search" | "manual";

const TYPE_LABELS: Record<string, string> = {
  KR: "manhwa",
  CN: "manhua",
  JP: "manga",
};

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

const GENRE_OPTIONS = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
  "Historical",
  "Psychological",
  "Martial Arts",
  "Isekai",
  "Shounen",
  "Shoujo",
  "Seinen",
  "Josei",
];

// ── Search Tab ──────────────────────────────────────────────────────────────

const SearchTab = ({ session }: { session: any }) => {
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

      const detail = await fetchFromAniList(MINI_DETAIL_QUERY, { id: item.id });
      const m = detail.Media;

      const { error } = await supabase.from("comics").insert({
        title: m.title.english || m.title.romaji,
        synopsis: cleanDescription(m.description, 500),
        cover_url: m.coverImage?.large,
        author: getAuthor(m.staff?.edges || []),
        type: TYPE_LABELS[m.countryOfOrigin] ?? "manga",
        status: m.status ?? "unknown",
        external_id: m.id,
        created_by: session.user.id,
      });

      if (error) {
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
    <div>
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

      {errorMsg && <p className="text-red-500 text-xs mb-3">{errorMsg}</p>}

      {results.length === 0 && !errorMsg && (
        <div className="text-center py-8 text-slate-400 text-sm">
          <p className="text-3xl mb-2">🔍</p>
          <p>Ketik judul komik lalu tekan Enter atau klik Search</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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

      {!session && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
          ⚠️ Kamu harus login untuk menambah komik ke database.
        </p>
      )}
    </div>
  );
};

// ── Manual Upload Tab ────────────────────────────────────────────────────────

const ManualTab = ({
  session,
  onClose,
}: {
  session: any;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [author, setAuthor] = useState("");
  const [type, setType] = useState<"manga" | "manhwa" | "manhua">("manga");
  const [status, setStatus] = useState<"RELEASING" | "FINISHED">("RELEASING");
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverError, setCoverError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCoverError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCoverError("File harus berupa gambar (JPG, PNG, WEBP, dsb).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError("Ukuran file maksimal 5 MB.");
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setCoverError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleGenre = (g: string) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  };

  const addCustomGenre = () => {
    const trimmed = genreInput.trim();
    if (!trimmed || genres.includes(trimmed)) return;
    setGenres((prev) => [...prev, trimmed]);
    setGenreInput("");
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!title.trim()) return setErrorMsg("Judul wajib diisi.");
    if (!author.trim()) return setErrorMsg("Author wajib diisi.");
    if (!session) return setErrorMsg("Kamu harus login.");

    setSubmitting(true);

    try {
      let cover_url: string | null = null;

      // Upload cover ke Supabase Storage jika ada
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const fileName = `manual-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("comic-covers")
          .upload(fileName, coverFile, { upsert: false });

        if (uploadErr)
          throw new Error("Gagal upload cover: " + uploadErr.message);

        const { data: urlData } = supabase.storage
          .from("comic-covers")
          .getPublicUrl(fileName);

        cover_url = urlData.publicUrl;
      }

      const { error: insertErr } = await supabase.from("comics").insert({
        title: title.trim(),
        synopsis: synopsis.trim() || null,
        cover_url,
        author: author.trim(),
        type,
        status,
        created_by: session.user.id,
        // genres bisa lu tambahin kalau ada kolom di table, kalau belum skip dulu
        genres: genres.length > 0 ? genres : null,
      });

      if (insertErr) throw new Error(insertErr.message);

      setSuccessMsg("Komik berhasil ditambahkan! 🎉");

      // Reset form
      setTitle("");
      setSynopsis("");
      setAuthor("");
      setType("manga");
      setStatus("RELEASING");
      setGenres([]);
      setGenreInput("");
      handleRemoveCover();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi error, coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        ⚠️ Kamu harus login untuk menambah komik ke database.
      </p>
    );
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {/* Cover Upload */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Cover (opsional, maks 5 MB)
        </label>

        {coverPreview ? (
          <div className="flex items-start gap-3">
            <div className="relative w-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 aspect-[2/3]">
              <img
                src={coverPreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-xs text-slate-500">{coverFile?.name}</p>
              <p className="text-xs text-slate-400">
                {coverFile
                  ? (coverFile.size / 1024 / 1024).toFixed(2) + " MB"
                  : ""}
              </p>
              <button
                onClick={handleRemoveCover}
                className="text-xs text-red-500 hover:underline text-left"
              >
                Hapus foto
              </button>
            </div>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed
                       border-slate-200 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition"
          >
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
              className="text-slate-400 mb-2"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M15 8h.01" />
              <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z" />
              <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l4 4" />
              <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
            </svg>
            <span className="text-xs text-slate-400">
              Klik untuk upload gambar cover
            </span>
            <span className="text-[10px] text-slate-300 mt-0.5">
              JPG, PNG, WEBP · maks 5 MB
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </label>
        )}
        {coverError && (
          <p className="text-red-500 text-xs mt-1">{coverError}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Judul <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Solo Leveling"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {/* Author */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Author <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Chugong"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {/* Type + Status (side by side) */}
      <div className="flex gap-3">
        {/* Type */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Tipe
          </label>
          <div className="flex gap-1.5">
            {(["manga", "manhwa", "manhua"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition
                  ${
                    type === t
                      ? t === "manga"
                        ? "bg-blue-600 text-white border-blue-600"
                        : t === "manhwa"
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Status
          </label>
          <div className="flex gap-1.5">
            {(
              [
                { value: "RELEASING", label: "Ongoing" },
                { value: "FINISHED", label: "Completed" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition
                  ${
                    status === value
                      ? value === "RELEASING"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-700 text-white border-slate-700"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Synopsis */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Synopsis <span className="text-slate-300">(opsional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Tulis sinopsis singkat tentang komik ini..."
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {/* Genres */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Genre <span className="text-slate-300">(opsional)</span>
        </label>

        {/* Preset Chips */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {GENRE_OPTIONS.map((g) => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition
                ${
                  genres.includes(g)
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Custom genre input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Tambah genre lain..."
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomGenre();
              }
            }}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs
                       focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <button
            onClick={addCustomGenre}
            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold
                       hover:bg-slate-200 transition"
          >
            + Add
          </button>
        </div>

        {/* Selected genres */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {genres.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs
                           font-semibold bg-slate-900 text-white"
              >
                {g}
                <button
                  onClick={() => toggleGenre(g)}
                  className="hover:text-red-300 transition text-[10px] leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ❌ {errorMsg}
        </p>
      )}
      {successMsg && (
        <p className="text-green-600 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          ✅ {successMsg}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold
                   hover:bg-slate-700 transition disabled:opacity-40"
      >
        {submitting ? "Menyimpan..." : "Tambah ke Database"}
      </button>
    </div>
  );
};

// Main Modal 

const AddComicModal = ({ session, onClose }: AddComicModalProps) => {
  const [tab, setTab] = useState<TabMode>("search");

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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setTab("search")}
            className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-2
              ${
                tab === "search"
                  ? "text-slate-900 border-b-2 border-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={15}
              height={15}
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
            Cari dari AniList
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-2
              ${
                tab === "manual"
                  ? "text-slate-900 border-b-2 border-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={15}
              height={15}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 5l0 14" />
              <path d="M5 12l14 0" />
            </svg>
            Upload Manual
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {tab === "search" ? (
            <SearchTab session={session} />
          ) : (
            <ManualTab session={session} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddComicModal;
