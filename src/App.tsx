import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./App.css";
import Auth from "./components/Auth";

const App = () => {
  // bikin session
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // cek status pas aplikasi pertama kali dibuka
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // pantau perubahan (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Header ala Figma lu */}
      <nav className="flex justify-between items-center p-4 border-b border-slate-100">
        <h1 className="text-xl font-bold font-mono">ComicList</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-medium">
            Wazzup, {session.user.email}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition"
          >
            Log Out
          </button>
        </div>
      </nav>

      <main className="p-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">
          Your Reading List
        </h2>
        <p className="text-slate-500">
          Lu udah login. Sekarang aplikasi siap buat narik data
          manhwa dari database!
        </p>

        {/* Nanti di sini kita render list komiknya */}
      </main>
    </div>
  );
};

export default App;
