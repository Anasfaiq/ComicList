import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchFromAniList } from "../lib/anilist";
import { DETAIL_QUERY } from "../lib/queries";
import { getAuthor, cleanDescription } from "../lib/utils";
import type { NavigateFn, Comment, RatingRow } from "../types";

// Props 
interface ComicDetailProps {
  comicId: number; // AniList ID
  session: any;
  navigate: NavigateFn;
}

// Helpers 
const STATUS_COLORS: Record<string, string> = {
  RELEASING: "text-green-600 bg-green-50 border-green-200",
  FINISHED: "text-blue-600 bg-blue-50 border-blue-200",
  NOT_YET_RELEASED: "text-orange-600 bg-orange-50 border-orange-200",
  CANCELLED: "text-red-600 bg-red-50 border-red-200",
  HIATUS: "text-yellow-600 bg-yellow-50 border-yellow-200",
};

const TYPE_LABELS: Record<string, string> = {
  KR: "MANHWA",
  CN: "MANHUA",
  JP: "MANGA",
};
const TYPE_COLORS: Record<string, string> = {
  KR: "text-green-600 bg-green-50 border-green-200",
  CN: "text-orange-600 bg-orange-50 border-orange-200",
  JP: "text-blue-600 bg-blue-50 border-blue-200",
};

const timeAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return `${Math.floor(diff / 604800)} weeks ago`;
};

// Star Rating Component 
const StarRating = ({
  value,
  hover,
  onHover,
  onClick,
  readonly = false,
}: {
  value: number;
  hover: number;
  onHover: (n: number) => void;
  onClick: (n: number) => void;
  readonly?: boolean;
}) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 10 }).map((_, i) => {
      const filled = (hover || value) >= i + 1;
      return (
        <button
          key={i}
          disabled={readonly}
          onMouseEnter={() => !readonly && onHover(i + 1)}
          onMouseLeave={() => !readonly && onHover(0)}
          onClick={() => !readonly && onClick(i + 1)}
          className={`text-xl transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}
                     ${filled ? "text-amber-400" : "text-slate-200"}`}
          style={{ background: "none", border: "none", padding: "0 1px" }}
        >
          ★
        </button>
      );
    })}
  </div>
);

// Rating Bar 
const RatingBar = ({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500 w-14 text-right shrink-0">
        {label} stars
      </span>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-slate-400 w-8 text-right shrink-0">{pct}%</span>
    </div>
  );
};

// Main Component 
const ComicDetail = ({ comicId, session, navigate }: ComicDetailProps) => {
  const [comic, setComic] = useState<any>(null);
  const [supabaseId, setSupabaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inLibrary, setInLibrary] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);

  // Fetch AniList + Supabase data 
  useEffect(() => {
    setLoading(true);
    fetchFromAniList(DETAIL_QUERY, { id: comicId })
      .then(async (data) => {
        setComic(data.Media);
        const id = await upsertComic(data.Media);
        setSupabaseId(id);
        if (id) {
          await Promise.all([
            loadRatings(id),
            loadComments(id),
            loadUserRating(id),
          ]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [comicId]);

  // Upsert comic to Supabase 
  const upsertComic = async (aniComic: any): Promise<string | null> => {
    // Try to find existing
    const { data: existing } = await supabase
      .from("comics")
      .select("id")
      .eq("external_id", aniComic.id)
      .maybeSingle();

    if (existing?.id) return existing.id;
    if (!session) return null;

    // Insert
    const author = getAuthor(aniComic.staff?.edges || []);
    const typeStr = TYPE_LABELS[aniComic.countryOfOrigin] ?? "MANGA";
    const { data: inserted, error } = await supabase
      .from("comics")
      .insert({
        title: aniComic.title.english || aniComic.title.romaji,
        synopsis: cleanDescription(aniComic.description, 500),
        cover_url: aniComic.coverImage?.large,
        author,
        type: typeStr,
        status: aniComic.status ?? "UNKNOWN",
        external_id: aniComic.id,
        created_by: session.user.id,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }
    return inserted?.id ?? null;
  };

  // Data loaders 
  const loadRatings = async (id: string) => {
    const { data } = await supabase
      .from("ratings")
      .select("score")
      .eq("comic_id", id);
    setRatings(data || []);
  };

  const loadComments = async (id: string) => {
    const { data } = await supabase
      .from("comments")
      .select("id, content, created_at, profiles:user_id(username, avatar_url)")
      .eq("comic_id", id)
      .order("created_at", { ascending: false });
    setComments((data as unknown as Comment[]) || []);
  };

  const loadUserRating = async (id: string) => {
    if (!session) return;
    const { data } = await supabase
      .from("ratings")
      .select("score")
      .eq("comic_id", id)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (data) setUserRating(data.score);
  };

  // Actions 
  const handleRate = async (score: number) => {
    if (!session) {
      navigate("auth");
      return;
    }
    if (!supabaseId) return;

    const prev = userRating;
    setUserRating(score);

    const { error } = await supabase
      .from("ratings")
      .upsert(
        { user_id: session.user.id, comic_id: supabaseId, score },
        { onConflict: "user_id,comic_id" },
      );
    if (error) {
      setUserRating(prev);
      alert("Gagal menyimpan rating.");
      return;
    }
    loadRatings(supabaseId);
  };

  const handleComment = async () => {
    if (!session) {
      navigate("auth");
      return;
    }
    if (!supabaseId || !commentText.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      user_id: session.user.id,
      comic_id: supabaseId,
      content: commentText.trim(),
    });
    if (!error) {
      setCommentText("");
      loadComments(supabaseId);
    }
    setSubmitting(false);
  };

  const handleAddToLibrary = async () => {
    if (!session) {
      navigate("auth");
      return;
    }
    setLibraryLoading(true);
    // Placeholder — kalau nanti ada user_library table bisa diimplementasi
    setTimeout(() => {
      setInLibrary(true);
      setLibraryLoading(false);
    }, 600);
  };

  // Computed values 
  const totalVotes = ratings.length;
  const avgScore = totalVotes
    ? (ratings.reduce((s, r) => s + r.score, 0) / totalVotes).toFixed(1)
    : comic?.averageScore
      ? (comic.averageScore / 10).toFixed(1)
      : null;

  const ratingDist: Record<number, number> = {};
  for (let i = 1; i <= 10; i++) ratingDist[i] = 0;
  ratings.forEach((r) => {
    ratingDist[r.score] = (ratingDist[r.score] || 0) + 1;
  });

  // Loading state 
  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-8 flex gap-8 animate-pulse">
        <div className="w-72 shrink-0">
          <div className="bg-slate-200 rounded-2xl aspect-[2/3]" />
        </div>
        <div className="flex-1 space-y-4 pt-4">
          <div className="h-8 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-32 bg-slate-100 rounded" />
          <div className="h-4 bg-slate-100 rounded" />
          <div className="h-4 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-2xl mb-2">😵</p>
        <p>Gagal memuat komik.</p>
        <button
          onClick={() => navigate("home")}
          className="mt-4 text-sm underline"
        >
          Balik ke home
        </button>
      </div>
    );
  }

  const typeLabel = TYPE_LABELS[comic.countryOfOrigin] ?? "MANGA";
  const typeColor = TYPE_COLORS[comic.countryOfOrigin] ?? TYPE_COLORS["JP"];
  const statusColor =
    STATUS_COLORS[comic.status] ??
    "text-slate-500 bg-slate-50 border-slate-200";
  const statusLabel =
    comic.status === "RELEASING" ? "ONGOING" : (comic.status ?? "UNKNOWN");
  const author = getAuthor(comic.staff?.edges || []);
  const description = cleanDescription(comic.description, 800);
  const cover = comic.coverImage?.extraLarge || comic.coverImage?.large;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6">
      {/* Back to Browse */}
      <button
        onClick={() => navigate("home")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition"
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
          <path d="M15 6l-6 6l6 6" />
        </svg>
        Back to Browse
      </button>

      <div className="flex gap-8 items-start">
        {/* ── Left Column (Sticky) ── */}
        <div className="w-64 shrink-0 sticky top-20 space-y-4">
          {/* Cover */}
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src={cover}
              alt={comic.title.english || comic.title.romaji}
              className="w-full object-cover"
            />
          </div>

          {/* Rate This */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Rate This
            </p>
            <StarRating
              value={userRating}
              hover={hoverRating}
              onHover={setHoverRating}
              onClick={handleRate}
            />
            {userRating > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                Rating kamu:{" "}
                <span className="text-amber-500 font-semibold">
                  {userRating}/10
                </span>
              </p>
            )}
          </div>

          {/* Add to Library */}
          <button
            onClick={handleAddToLibrary}
            disabled={libraryLoading || inLibrary}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm
                       font-semibold border transition
                       ${
                         inLibrary
                           ? "bg-green-50 text-green-600 border-green-200"
                           : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                       }`}
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
              <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
              <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
              <path d="M3 6v13" />
              <path d="M12 6v13" />
              <path d="M21 6v13" />
            </svg>
            {inLibrary
              ? "Added to Library ✓"
              : libraryLoading
                ? "Adding..."
                : "Add to Library"}
          </button>

          {/* Write a Review */}
          <button
            onClick={() => document.getElementById("review-input")?.focus()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm
                       font-semibold border border-slate-200 bg-white text-slate-700
                       hover:bg-slate-50 transition"
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
              <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
              <path d="M13.5 6.5l4 4" />
            </svg>
            Write a Review
          </button>
        </div>

        {/* ── Right Column ── */}
        <div className="flex-1 min-w-0">
          {/* Title + Meta */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-heading">
            {comic.title.english || comic.title.romaji}
          </h1>

          <div className="flex items-center gap-4 flex-wrap mb-6">
            <span className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">Author:</span>{" "}
              {author}
            </span>
            {comic.status && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor}`}
              >
                {statusLabel}
              </span>
            )}
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${typeColor}`}
            >
              {typeLabel}
            </span>
          </div>

          {/* Rating Distribution Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 flex gap-6">
            {/* Big Score */}
            <div className="text-center shrink-0 pr-6 border-r border-slate-100">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-amber-400 text-2xl">★</span>
                <span className="text-4xl font-bold text-slate-800">
                  {avgScore ?? "—"}
                </span>
                <span className="text-slate-400 text-lg self-end mb-1">
                  /10
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {totalVotes > 0
                  ? `${totalVotes.toLocaleString()} ${totalVotes === 1 ? "vote" : "votes"}`
                  : `Based on AniList data`}
              </p>
            </div>

            {/* Bar Chart */}
            <div className="flex-1 space-y-2">
              {[10, 9, 8, 7, 6].map((star) => (
                <RatingBar
                  key={star}
                  label={String(star)}
                  count={ratingDist[star] || 0}
                  total={totalVotes}
                />
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Synopsis</h2>
            <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
              {description}
            </p>
          </section>

          {/* Genres */}
          {comic.genres?.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-slate-800 mb-3">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {comic.genres.map((g: string) => (
                  <span
                    key={g}
                    className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full
                               border border-slate-200 hover:bg-slate-200 transition cursor-pointer"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Community Reviews */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Community Reviews
              </h2>
              <span className="text-sm text-slate-400">
                Showing {comments.length}{" "}
                {comments.length === 1 ? "review" : "reviews"}
              </span>
            </div>

            {/* Comment Input */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4">
              <div className="flex gap-3">
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center
                               text-slate-400 font-bold text-sm shrink-0"
                >
                  {session ? session.user.email?.[0]?.toUpperCase() : "?"}
                </div>
                <div className="flex-1">
                  <textarea
                    id="review-input"
                    rows={2}
                    placeholder={
                      session
                        ? "Leave a comment or write a review..."
                        : "Login dulu untuk menulis review..."
                    }
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={!session}
                    className="w-full text-sm text-slate-700 placeholder-slate-400 border-none
                               outline-none resize-none bg-transparent"
                  />
                </div>
              </div>

              {/* Divider + Post button */}
              <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center">
                {!session && (
                  <button
                    onClick={() => navigate("auth")}
                    className="text-xs text-indigo-500 hover:underline"
                  >
                    Login untuk review →
                  </button>
                )}
                <div className="ml-auto">
                  <button
                    onClick={handleComment}
                    disabled={!session || !commentText.trim() || submitting}
                    className="px-4 py-1.5 bg-slate-800 text-white text-sm font-semibold
                               rounded-lg hover:bg-slate-700 transition disabled:opacity-40"
                  >
                    {submitting ? "Posting..." : "Post Review"}
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Belum ada review. Jadilah yang pertama! 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-slate-100 rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full bg-slate-700 text-white font-bold
                                     text-sm flex items-center justify-center shrink-0"
                      >
                        {c.profiles?.username?.[0]?.toUpperCase() ?? "?"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="font-semibold text-slate-800 text-sm">
                              {c.profiles?.username ?? "Anonymous"}
                            </span>
                            <span className="text-slate-400 text-xs ml-2">
                              {timeAgo(c.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {c.content}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-3">
                          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={14}
                              height={14}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path
                                stroke="none"
                                d="M0 0h24v24H0z"
                                fill="none"
                              />
                              <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" />
                            </svg>
                            Like
                          </button>
                          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={14}
                              height={14}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path
                                stroke="none"
                                d="M0 0h24v24H0z"
                                fill="none"
                              />
                              <path d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1" />
                            </svg>
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ComicDetail;
