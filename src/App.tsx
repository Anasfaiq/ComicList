import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Dashboard from "./components/Dashboard";
import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import "./App.css";

const App = () => {
  // bikin session
  const [session, setSession] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)

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

  if (session) {
    return <Dashboard session={session} />;
  }

  if (showAuth) {
    return <Auth onBack={() => setShowAuth(false)} />;
  }
  return (
    <div>
      <Navbar onAuthClick={() => setShowAuth(true)} />
      {/* Isi konten landing page lu lainnya */}
    </div>
  );
};

export default App;
