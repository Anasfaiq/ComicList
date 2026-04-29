import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { NavigateFn } from "../types";

interface UserProfileProps {
  userId: string;
  session: any;
  navigate: NavigateFn;
}

const UserProfile = ({ userId, session, navigate }: UserProfileProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const [{ data: profileData }, { data: libraryData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", userId)
          .single(),
        supabase
          .from("user_library")
          .select(
            `
            id,
            status,
            comics (
              id,
              external_id,
              title,
              cover_url,
              type
            )
          `,
          )
          .eq("user_id", userId),
      ]);

      setProfile(profileData);
      setLibrary(libraryData || []);
      setLoading(false);
    };

    fetchAll();
  }, [userId]);

  const isOwnProfile = session?.user?.id === userId;

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-8 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-(--cl-surface-2)" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-(--cl-surface-2) rounded" />
            <div className="h-3 w-20 bg-(--cl-surface-2) rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[2/3] bg-(--cl-surface-2) rounded-xl" />
              <div className="h-3 mt-2 bg-(--cl-surface-2) rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-(--cl-text-muted)">
        <p className="text-2xl mb-2">👤</p>
        <p>User tidak ditemukan.</p>
        <button
          onClick={() => navigate("home")}
          className="mt-4 text-sm underline"
        >
          Balik ke home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8 pb-24 lg:pb-8">
      {/* Back */}
      <button
        onClick={() => navigate("home")}
        className="flex items-center gap-1.5 text-sm text-(--cl-text-muted) hover:opacity-80 mb-6 transition"
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
        Back
      </button>

      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-(--cl-surface-2) border-2 border-(--cl-border) shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-(--cl-text) font-bold text-xl uppercase">
              {profile.username?.[0] ?? "?"}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-(--cl-text)">
            {profile.username}
          </h1>
          <p className="text-sm text-(--cl-text-muted)">
            {library.length} komik di reading list
          </p>
        </div>
        {isOwnProfile && (
          <button
            onClick={() => navigate("profile")}
            className="ml-auto px-4 py-2 text-sm border border-(--cl-border) rounded-lg text-(--cl-text-muted) hover:bg-(--cl-surface-2) transition"
          >
            Edit Profil
          </button>
        )}
      </div>

      {/* Library Grid */}
      {library.length === 0 ? (
        <div className="bg-(--cl-surface) border border-(--cl-border) rounded-2xl p-16 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-semibold text-(--cl-text) mb-1">
            {isOwnProfile
              ? "Reading list kamu masih kosong"
              : `${profile.username} belum punya komik di reading list`}
          </p>
          {isOwnProfile && (
            <button
              onClick={() => navigate("home")}
              className="mt-4 px-4 py-2 text-sm bg-(--cl-primary) text-white rounded-lg hover:bg-(--cl-primary-hover) transition"
            >
              Browse Komik
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Status group */}
          {(
            [
              "reading",
              "completed",
              "on_hold",
              "dropped",
              "plan_to_read",
            ] as const
          ).map((status) => {
            const items = library.filter((i) => i.status === status);
            if (items.length === 0) return null;

            const statusLabel: Record<string, string> = {
              reading: "Reading",
              completed: "Completed",
              on_hold: "On Hold",
              dropped: "Dropped",
              plan_to_read: "Plan to Read",
            };

            return (
              <div key={status} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-bold text-(--cl-text) uppercase tracking-wider">
                    {statusLabel[status]}
                  </h2>
                  <span className="text-xs text-(--cl-text-muted) bg-(--cl-surface-2) px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        navigate(
                          "detail",
                          item.comics.external_id || item.comics.id,
                        )
                      }
                      className="cursor-pointer group"
                    >
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-(--cl-surface-2) mb-2">
                        {item.comics.cover_url ? (
                          <img
                            src={item.comics.cover_url}
                            alt={item.comics.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-(--cl-text-muted) text-xs text-center px-2">
                            No Cover
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-(--cl-text) line-clamp-2 leading-snug">
                        {item.comics.title}
                      </p>
                      <p className="text-[10px] text-(--cl-text-muted) mt-0.5 capitalize">
                        {item.comics.type}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default UserProfile;
