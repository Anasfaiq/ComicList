import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { NavigateFn } from "../types";

interface DashboardProps {
  session: any;
  navigate: NavigateFn;
}

const Dashboard = ({ session, navigate }: DashboardProps) => {
  const username =
    session?.user?.user_metadata?.username ?? session?.user?.email ?? "User";

  const [library, setLibrary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const fetchLibrary = async () => {
      setLoading(true);

      const { data, error } = await supabase
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
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Fetch library error:", error);
        setLibrary([]);
      } else {
        setLibrary(data || []);
      }

      setLoading(false);
    };

    fetchLibrary();
  }, [session]);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-(--cl-text) mb-1">
            Reading List
          </h2>
          <p className="text-(--cl-text-muted) text-sm">
            Hi, {username}! Here’s your comic collection.
          </p>
        </div>
        <button
          onClick={() => navigate("home")}
          className="flex items-center gap-1.5 px-4 py-2 bg-(--cl-primary) border border-(--cl-border)
                     rounded-lg text-sm text-white font-medium hover:bg-(--cl-primary-hover) transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={18}
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
          Go to Home
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : library.length === 0 ? (
        /* Empty State */
        <div className="bg-(--cl-surface) border border-(--cl-border) rounded-2xl p-16 text-center">
          <p className="text-5xl mb-4">📚</p>
          <p className="font-semibold text-(--cl-text) mb-2">
            No comics in your reading list yet.
          </p>
          <p className="text-(--cl-text-muted) text-sm mb-6">
            Add your favorite manga or manhwa from the homepage!
          </p>
          <button
            onClick={() => navigate("home")}
            className="px-5 py-2.5 bg-(--cl-surface) text-(--cl-text) rounded-lg text-sm font-semibold
                       hover:bg-(--cl-surface-2) transition"
          >
            Browse Comics
          </button>
        </div>
      ) : (
        /* Grid List */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {library.map((item) => (
            <div
              key={item.id}
              onClick={() =>
                navigate("detail", item.comics.external_id || item.comics.id)
              }
              className="bg-(--cl-surface) border border-(--cl-border) rounded-xl overflow-hidden
                         hover:shadow-lg transition cursor-pointer group"
            >
              <div className="aspect-[2/3] overflow-hidden">
                <img
                  src={item.comics.cover_url}
                  alt={item.comics.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>

              <div className="p-3">
                <p className="text-sm font-semibold text-(--cl-text) line-clamp-2">
                  {item.comics.title}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-(--cl-text-muted)">
                    {item.comics.type.charAt(0).toUpperCase() +
                      item.comics.type.slice(1)}
                  </span>

                  <span className="text-xs px-2 py-0.5 rounded-full bg-(--cl-surface-2) text-(--cl-text-muted)">
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
