import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import type { Page } from "./types";
import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import Dashboard from "./components/Dashboard";
import ComicDetail from "./components/ComicDetail";
import Profile from "./components/Profile";
import "./App.css";

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedComicId, setSelectedComicId] = useState<
    number | string | null
  >(null);
  const currentPageRef = useRef<Page>("home");

  const navigate = (page: Page, comicId?: number | string) => {
    setCurrentPage(page);
    currentPageRef.current = page;
    if (comicId !== undefined) setSelectedComicId(comicId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && currentPageRef.current === "dashboard") {
        navigate("home");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (currentPage === "auth") {
    return (
      <Auth
        onBack={() => navigate("home")}
        onSuccess={() => navigate("home")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar session={session} currentPage={currentPage} navigate={navigate} />

      {currentPage === "home" && (
        <HomePage navigate={navigate} session={session} />
      )}

      {currentPage === "detail" && selectedComicId && (
        <ComicDetail
          comicId={selectedComicId}
          session={session}
          navigate={navigate}
        />
      )}

      {currentPage === "dashboard" && session && (
        <Dashboard session={session} navigate={navigate} />
      )}

      {currentPage === "profile" && session && (
        <Profile session={session} navigate={navigate} />
      )}

      {currentPage === "dashboard" && !session && (
        <div className="text-center py-20">
          <p className="text-slate-500 mb-4">Sesi kamu udah habis.</p>
          <button
            onClick={() => navigate("auth")}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold"
          >
            Log In
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
