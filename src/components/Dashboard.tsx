import Navbar from "./Navbar";

interface DashboardProps {
  session: any;
}

const Dashboard = ({ session }: DashboardProps) => {
  return (
    <div>
      {/* Navbar di dalam Dashboard nggak butuh onAuthClick
          karena user udah login — Navbar auto-detect via Supabase */}
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-1 text-slate-800">
          Your Reading List
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Selamat datang,{" "}
          {session?.user?.user_metadata?.username || session?.user?.email}!
        </p>

        {/* Placeholder — nanti isi dengan list komik user */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-semibold text-slate-600">
            Belum ada komik di list lu
          </p>
          <p className="text-sm mt-1">
            Mulai tambah manga atau manhwa favorit lu!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
