import type { NavigateFn } from "../types";

interface DashboardProps {
  session: any;
  navigate: NavigateFn;
}

const Dashboard = ({ session, navigate }: DashboardProps) => {
  const username =
    session?.user?.user_metadata?.username ?? session?.user?.email ?? "User";

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">
            Reading List
          </h2>
          <p className="text-slate-500 text-sm">
            Hai, {username}! Ini koleksi komik lu.
          </p>
        </div>
        <button
          onClick={() => navigate("home")}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200
                     rounded-lg text-sm text-slate-600 font-medium hover:bg-slate-50 transition"
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
            <path d="M15 6l-6 6l6 6" />
          </svg>
          Ke Home
        </button>
      </div>

      {/* Placeholder */}
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
        <p className="text-5xl mb-4">📚</p>
        <p className="font-semibold text-slate-700 mb-2">
          Belum ada komik di reading list lu
        </p>
        <p className="text-slate-400 text-sm mb-6">
          Tambah manga atau manhwa favorit lu dari halaman utama!
        </p>
        <button
          onClick={() => navigate("home")}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold
                     hover:bg-slate-700 transition"
        >
          Browse Komik
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
