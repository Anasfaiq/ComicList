import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchFromAniList } from "../lib/anilist";
import { DETAIL_QUERY } from "../lib/queries";
import { getAuthor, cleanDescription } from "../lib/utils";
import type { NavigateFn, Comment, RatingRow } from "../types";

interface ComicDetailProps {
  comicId: number | string;
  session: any;
  navigate: NavigateFn;
}

const STATUS_COLORS: Record<string, string> = {
  RELEASING: "text-green-600 bg-green-50 border-green-200",
  releasing: "text-green-600 bg-green-50 border-green-200",
  FINISHED: "text-blue-600 bg-blue-50 border-blue-200",
  finished: "text-blue-600 bg-blue-50 border-blue-200",
  NOT_YET_RELEASED: "text-orange-600 bg-orange-50 border-orange-200",
  CANCELLED: "text-red-600 bg-red-50 border-red-200",
  HIATUS: "text-yellow-600 bg-yellow-50 border-yellow-200",
};

const TYPE_COLORS: Record<string, string> = {
  KR: "text-green-600 bg-green-50 border-green-200",
  manhwa: "text-green-600 bg-green-50 border-green-200",
  CN: "text-orange-600 bg-orange-50 border-orange-200",
  manhua: "text-orange-600 bg-orange-50 border-orange-200",
  JP: "text-blue-600 bg-blue-50 border-blue-200",
  manga: "text-blue-600 bg-blue-50 border-blue-200",
};

interface IconProps {
  size?: number;
  className?: string;
}

const ICONS = [
  {
    name: "like",
    icon: ({ size = 24, className = "" }: IconProps) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" />
      </svg>
    ),
  },
  {
    name: "comment",
    icon: ({ size = 24, className = "" }: IconProps) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M8 9h8" />
        <path d="M8 13h6" />
        <path d="M12.01 18.594l-4.01 2.406v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v5.5" />
        <path d="M16 19h6" />
        <path d="M19 16v6" />
      </svg>
    ),
  },
];

const timeAgo = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
};

const StarRating = ({
  value,
  hover,
  onHover,
  onClick,
}: {
  value: number;
  hover: number;
  onHover: (n: number) => void;
  onClick: (n: number) => void;
}) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 10 }).map((_, i) => (
      <button
        key={i}
        onMouseEnter={() => onHover(i + 1)}
        onMouseLeave={() => onHover(0)}
        onClick={() => onClick(i + 1)}
        className={`text-xl transition-colors cursor-pointer ${(hover || value) >= i + 1 ? "text-amber-400" : "text-slate-200"}`}
        style={{ background: "none", border: "none", padding: "0 1px" }}
      >
        ★
      </button>
    ))}
  </div>
);

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

const CommentItem = ({
  comment,
  replies,
  onReply,
  onLike,
  onDelete,
  onUpdate,
  session,
  editingId,
  setEditingId,
  editText,
  setEditText,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (id: string) => void;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editText: string;
  setEditText: (text: string) => void;
  session: any;
}) => {
  const [showReplies, setShowReplies] = useState(true);
  const LikeIcon = ICONS.find((i) => i.name === "like")?.icon;
  const ReplyIcon = ICONS.find((i) => i.name === "comment")?.icon;

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-inner bg-slate-200">
            {comment.profiles?.avatar_url ? (
              <img
                src={comment.profiles.avatar_url}
                alt={comment.profiles.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white bg-indigo-600 font-bold">
                {comment.profiles?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-slate-800 text-sm">
                {comment.profiles?.username ?? "Anonymous"}
              </span>
              <span className="text-slate-400 text-[11px]">
                {timeAgo(comment.created_at)}
              </span>
            </div>
            {editingId === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full text-sm border rounded-lg p-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdate(comment.id, editText)}
                    className="text-xs text-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditText("");
                    }}
                    className="text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 text-sm leading-relaxed">
                {comment.content}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={() => onLike(comment.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition"
              >
                {LikeIcon && <LikeIcon size={16} />}
                <span>{comment.like_count}</span>
              </button>
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition"
              >
                {ReplyIcon && <ReplyIcon size={16} />}
                <span>Reply</span>
              </button>
              {replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-[11px] font-bold text-indigo-500 hover:text-indigo-700 ml-auto"
                >
                  {showReplies
                    ? "Hide Replies"
                    : `Show ${replies.length} Replies`}
                </button>
              )}
              {session?.user?.id === comment.profiles?.id && (
                <>
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditText(comment.content);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReplies && replies.length > 0 && (
        <div className="ml-10 pl-4 border-l-2 border-slate-200 space-y-3">
          {replies.map((r) => (
            <div
              key={r.id}
              className="bg-slate-50 border border-slate-100 rounded-xl p-3 shadow-sm"
            >
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-slate-200">
                  {r.profiles?.avatar_url ? (
                    <img
                      src={r.profiles.avatar_url}
                      alt={r.profiles.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white bg-slate-400 text-[10px]">
                      {r.profiles?.username?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-slate-700 text-[11px]">
                      {r.profiles?.username}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {timeAgo(r.created_at)}
                    </span>
                  </div>
                  {editingId === r.id ? (
                    <div className="space-y-1">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-xs border rounded-lg p-1"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdate(r.id, editText)}
                          className="text-[10px] text-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditText("");
                          }}
                          className="text-[10px] text-slate-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {r.content}
                    </p>
                  )}
                  <button
                    onClick={() => onLike(r.id)}
                    className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 hover:text-indigo-600"
                  >
                    {LikeIcon && (
                      <LikeIcon size={14} className="inline-block" />
                    )}
                    <span>{r.like_count}</span>
                  </button>
                  {session?.user?.id === r.profiles?.id && (
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => {
                          setEditingId(r.id);
                          setEditText(r.content);
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="text-[10px] text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────

const ComicDetail = ({ comicId, session, navigate }: ComicDetailProps) => {
  const [comic, setComic] = useState<any>(null);
  const [supabaseId, setSupabaseId] = useState<string | null>(null);
  const [isManual, setIsManual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inLibrary, setInLibrary] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    setLoading(true);
    setUserRating(0);
    setInLibrary(false);
    setIsManual(false);

    const isUUID = typeof comicId === "string" && comicId.includes("-");

    if (isUUID) {
      // Komik manual — langsung ambil dari Supabase
      loadManualComic(comicId as string);
    } else {
      // Komik AniList — fetch dari API dulu
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
              checkLibrary(id),
            ]);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [comicId]);

  // Load komik manual dari Supabase
  const loadManualComic = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("comics")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) throw new Error("Komik tidak ditemukan");

      // Format supaya struktur sama kayak AniList comic object
      setComic({
        title: { english: data.title, romaji: data.title },
        coverImage: { large: data.cover_url, extraLarge: data.cover_url },
        description: data.synopsis,
        status: data.status,
        genres: data.genres || [],
        countryOfOrigin:
          data.type === "manhwa" ? "KR" : data.type === "manhua" ? "CN" : "JP",
        _type: data.type, // simpan type asli
        staff: {
          edges: data.author
            ? [{ role: "Story & Art", node: { name: { full: data.author } } }]
            : [],
        },
        averageScore: null,
      });

      setSupabaseId(id);
      setIsManual(true);

      await Promise.all([
        loadRatings(id),
        loadComments(id),
        loadUserRating(id),
        checkLibrary(id),
      ]);
    } catch (err) {
      console.error(err);
      setComic(null);
    } finally {
      setLoading(false);
    }
  };

  // Realtime listeners
  useEffect(() => {
    if (!supabaseId) return;

    const commentChannel = supabase
      .channel("live-comments")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `comic_id=eq.${supabaseId}`,
        },
        () => loadComments(supabaseId),
      )
      .subscribe();

    const ratingChannel = supabase
      .channel("live-ratings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ratings",
          filter: `comic_id=eq.${supabaseId}`,
        },
        () => loadRatings(supabaseId),
      )
      .subscribe();

    const likeChannel = supabase
      .channel("live-likes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment_likes" },
        () => loadComments(supabaseId),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentChannel);
      supabase.removeChannel(ratingChannel);
      supabase.removeChannel(likeChannel);
    };
  }, [supabaseId]);

  const upsertComic = async (m: any): Promise<string | null> => {
    const { data: existing } = await supabase
      .from("comics")
      .select("id")
      .eq("external_id", m.id)
      .maybeSingle();
    if (existing?.id) return existing.id;
    if (!session) return null;

    const TYPE_LABELS: Record<string, string> = {
      KR: "manhwa",
      CN: "manhua",
      JP: "manga",
    };

    const { data: inserted, error } = await supabase
      .from("comics")
      .insert({
        title: m.title.english || m.title.romaji,
        synopsis: cleanDescription(m.description, 500),
        cover_url: m.coverImage?.large,
        author: getAuthor(m.staff?.edges || []),
        type: TYPE_LABELS[m.countryOfOrigin] ?? "manga",
        status: m.status ?? "UNKNOWN",
        external_id: m.id,
        created_by: session.user.id,
      })
      .select("id")
      .maybeSingle();

    if (error?.code === "23505") {
      const { data: refetch } = await supabase
        .from("comics")
        .select("id")
        .eq("external_id", m.id)
        .maybeSingle();
      return refetch?.id ?? null;
    }
    if (error) {
      console.error("upsertComic:", error);
      return null;
    }
    return inserted?.id ?? null;
  };

  const loadRatings = async (id: string) => {
    const { data } = await supabase
      .from("ratings")
      .select("score")
      .eq("comic_id", id);
    setRatings(data || []);
  };

  const loadComments = async (id: string) => {
    const { data: raw, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id, parent_id")
      .eq("comic_id", id)
      .order("created_at", { ascending: false });

    if (error || !raw) {
      setComments([]);
      return;
    }

    const { data: likes } = await supabase
      .from("comment_likes")
      .select("comment_id");
    const likeMap: Record<string, number> = {};
    likes?.forEach((l) => {
      likeMap[l.comment_id] = (likeMap[l.comment_id] || 0) + 1;
    });

    const userIds = [...new Set(raw.map((c) => c.user_id))];
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const merged: Comment[] = raw.map((c) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      parent_id: c.parent_id,
      profiles: profs?.find((p) => p.id === c.user_id) ?? {
        id: c.user_id,
        username: "Anonymous",
        avatar_url: null,
      },
      like_count: likeMap[c.id] || 0,
    }));
    setComments(merged);
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

  const checkLibrary = async (id: string) => {
    if (!session) return;
    const { data } = await supabase
      .from("user_library")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("comic_id", id)
      .maybeSingle();
    setInLibrary(!!data);
  };

  const ensureSupabaseId = async (): Promise<string | null> => {
    if (supabaseId) return supabaseId;
    if (!session || !comic) return null;
    const id = await upsertComic(comic);
    if (id) setSupabaseId(id);
    return id;
  };

  const handleRate = async (score: number) => {
    if (!session) {
      navigate("auth");
      return;
    }
    const id = await ensureSupabaseId();
    if (!id) {
      alert("Gagal menyimpan, coba lagi.");
      return;
    }

    const prev = userRating;
    setUserRating(score);

    const { data: existing } = await supabase
      .from("ratings")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("comic_id", id)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("ratings")
        .update({ score })
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase
        .from("ratings")
        .insert({ user_id: session.user.id, comic_id: id, score }));
    }

    if (error) {
      setUserRating(prev);
      alert("Gagal menyimpan rating: " + error.message);
      return;
    }
    loadRatings(id);
  };

  const handleDeleteRating = async () => {
    if (!session || !supabaseId) return;
    const { error } = await supabase
      .from("ratings")
      .delete()
      .eq("user_id", session.user.id)
      .eq("comic_id", supabaseId);
    if (!error) {
      setUserRating(0);
      loadRatings(supabaseId);
    } else alert("Gagal hapus rating: " + error.message);
  };

  const handleComment = async () => {
    if (!session) {
      navigate("auth");
      return;
    }
    if (!commentText.trim()) return;
    const id = await ensureSupabaseId();
    if (!id) {
      alert("Gagal menyimpan, coba lagi.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      user_id: session.user.id,
      comic_id: id,
      content: commentText.trim(),
      parent_id: replyTo,
    });
    if (!error) {
      setCommentText("");
      setReplyTo(null);
      loadComments(id);
    } else alert("Gagal post review: " + error.message);
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!session) return navigate("auth");
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", session.user.id);
    if (!error) loadComments(supabaseId!);
    else alert("Gagal hapus comment: " + error.message);
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    if (!session) return;
    const { error } = await supabase
      .from("comments")
      .update({ content: editText })
      .eq("id", commentId)
      .eq("user_id", session.user.id);
    if (!error) {
      setEditingId(null);
      setEditText("");
      loadComments(supabaseId!);
    } else alert("Gagal update comment: " + error.message);
  };

  const handleReplyClick = (id: string) => {
    setReplyTo(id);
    document.getElementById("review-input")?.focus();
  };

  const handleLike = async (commentId: string) => {
    if (!session) return navigate("auth");
    const { data: existing } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("comment_id", commentId)
      .maybeSingle();

    if (existing) {
      await supabase.from("comment_likes").delete().eq("id", existing.id);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, like_count: Math.max((c.like_count || 1) - 1, 0) }
            : c,
        ),
      );
    } else {
      await supabase
        .from("comment_likes")
        .insert({ user_id: session.user.id, comment_id: commentId });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, like_count: (c.like_count || 0) + 1 }
            : c,
        ),
      );
    }
  };

  const handleToggleLibrary = async () => {
    if (!session) {
      navigate("auth");
      return;
    }
    const id = await ensureSupabaseId();
    if (!id) {
      alert("Gagal menyimpan, coba lagi.");
      return;
    }

    setLibraryLoading(true);
    if (inLibrary) {
      const { error } = await supabase
        .from("user_library")
        .delete()
        .eq("user_id", session.user.id)
        .eq("comic_id", id);
      if (!error) setInLibrary(false);
      else alert("Gagal hapus dari library: " + error.message);
    } else {
      const { error } = await supabase
        .from("user_library")
        .upsert(
          { user_id: session.user.id, comic_id: id, status: "reading" },
          { onConflict: "user_id,comic_id" },
        );
      if (!error) setInLibrary(true);
      else alert("Gagal menambah ke library: " + error.message);
    }
    setLibraryLoading(false);
  };

  // Computed
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

  const parentComments = comments.filter((c) => !c.parent_id);
  const replyMap: Record<string, Comment[]> = {};
  comments.forEach((c) => {
    if (c.parent_id) {
      if (!replyMap[c.parent_id]) replyMap[c.parent_id] = [];
      replyMap[c.parent_id].push(c);
    }
  });

  if (loading)
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-8 flex gap-8 animate-pulse">
        <div className="w-64 shrink-0">
          <div className="bg-slate-200 rounded-2xl aspect-[2/3]" />
        </div>
        <div className="flex-1 space-y-4 pt-4">
          <div className="h-8 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-32 bg-slate-100 rounded" />
        </div>
      </div>
    );

  if (!comic)
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

  // Resolve display values — handle both AniList & manual comic shapes
  const displayTitle =
    comic.title?.english || comic.title?.romaji || "Untitled";
  const displayAuthor = getAuthor(comic.staff?.edges || []);
  const displayType =
    comic._type ||
    (comic.countryOfOrigin === "KR"
      ? "manhwa"
      : comic.countryOfOrigin === "CN"
        ? "manhua"
        : "manga");
  const displayStatus = comic.status ?? "UNKNOWN";
  const statusColor =
    STATUS_COLORS[displayStatus] ??
    "text-slate-500 bg-slate-50 border-slate-200";
  const statusLabel =
    displayStatus === "RELEASING" || displayStatus === "releasing"
      ? "ONGOING"
      : displayStatus.toUpperCase();
  const typeColor =
    TYPE_COLORS[comic.countryOfOrigin] ??
    TYPE_COLORS[displayType] ??
    TYPE_COLORS["manga"];
  const description = isManual
    ? comic.description || "Tidak ada sinopsis."
    : cleanDescription(comic.description, 800);
  const cover = comic.coverImage?.extraLarge || comic.coverImage?.large;
  const genres: string[] = comic.genres || [];

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6">
      {/* Back */}
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

      {/* Manual badge */}
      {isManual && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-xs font-semibold text-purple-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={12}
            height={12}
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
          Uploaded Manual
        </div>
      )}

      <div className="flex gap-8 items-start">
        {/* Left Column */}
        <div className="w-64 shrink-0 sticky top-20 space-y-4">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            {cover ? (
              <img
                src={cover}
                alt={displayTitle}
                className="w-full object-cover"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-slate-100 flex items-center justify-center text-slate-300 text-sm">
                No Cover
              </div>
            )}
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
            {!session && (
              <p className="text-xs text-slate-400 mt-2">
                <button
                  onClick={() => navigate("auth")}
                  className="text-indigo-500 hover:underline"
                >
                  Login
                </button>{" "}
                untuk rating
              </p>
            )}
            {userRating > 0 && (
              <button
                onClick={handleDeleteRating}
                className="text-xs text-red-500 hover:underline mt-2"
              >
                Hapus rating
              </button>
            )}
          </div>

          {/* Add to Library */}
          <button
            onClick={handleToggleLibrary}
            disabled={libraryLoading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200
              ${
                inLibrary
                  ? "bg-red-50 text-red-600 border-red-200 md:bg-green-50 md:text-green-600 md:border-green-200 md:hover:bg-red-50 md:hover:text-red-600 md:hover:border-red-200"
                  : "bg-green-50 text-green-600 border-green-200 md:bg-white md:text-slate-700 md:border-slate-200 md:hover:bg-green-50 md:hover:text-green-600 md:hover:border-green-200"
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
            {libraryLoading
              ? "Processing..."
              : inLibrary
                ? "Remove from Library"
                : "Add to Library"}
          </button>

          {/* Write a Review */}
          <button
            onClick={() => document.getElementById("review-input")?.focus()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-all duration-200"
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

        {/* Right Column */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-heading">
            {displayTitle}
          </h1>
          <div className="flex items-center gap-4 flex-wrap mb-6">
            <span className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">Author:</span>{" "}
              {displayAuthor}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor}`}
            >
              {statusLabel}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${typeColor}`}
            >
              {displayType.toUpperCase()}
            </span>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 flex gap-6">
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
                  : "Belum ada votes"}
              </p>
            </div>
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
          {Array.isArray(comic?.genres) && comic.genres.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-slate-800 mb-3">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {comic.genres.map((g: string) => (
                  <span
                    key={g}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-medium rounded-full transition-all"
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

            <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">
                  {session ? session.user.email?.[0]?.toUpperCase() : "?"}
                </div>
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
                  className="flex-1 text-sm text-slate-700 placeholder-slate-400 border-none outline-none resize-none bg-transparent"
                />
              </div>
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
                    className="px-4 py-1.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition disabled:opacity-40"
                  >
                    {submitting ? "Posting..." : "Post Review"}
                  </button>
                </div>
              </div>
            </div>

            {comments.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Belum ada review. Jadilah yang pertama! 🎉
              </div>
            ) : (
              <div className="space-y-6">
                {parentComments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    replies={replyMap[c.id] || []}
                    onReply={handleReplyClick}
                    onLike={handleLike}
                    onDelete={handleDeleteComment}
                    onUpdate={handleUpdateComment}
                    session={session}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    editText={editText}
                    setEditText={setEditText}
                  />
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
