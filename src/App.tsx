import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Dashboard from "./components/Dashboard";
import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import "./App.css";

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Cek session pas pertama kali buka
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Pantau perubahan auth (login / logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Kalau udah login → Dashboard
  if (session) {
    return <Dashboard session={session} />;
  }

  // Kalau klik Log In / Sign Up → halaman Auth
  if (showAuth) {
    return <Auth onBack={() => setShowAuth(false)} />;
  }

  // Default → Landing page (bisa dilihat tanpa login)
  return (
    <div className="min-h-screen bg-slate-50 px-5 sm:px-10 md:px-20 lg:px-40">
      <Navbar onAuthClick={() => setShowAuth(true)} />
      <HomePage />
    </div>
  );
};

export default App;
