import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const Navbar = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSignUp = () => {
    
  }

  return (
    <nav className="flex items-center gap-8 px-4 py-3 border-b border-slate-100 ">
      {/* Logo */}
      <p className="font-heading text-xl font-bold shrink-0">ComicList</p>

      {/* Search - hidden di mobile, muncul di md+ */}
      <div className="relative hidden md:flex flex-1 max-w-xl">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
            <path d="M21 21l-6 -6" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search Manga, Manhwa, Manhua..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {/* Right side */}
      <div className="flex ml-auto items-center gap-2 shrink-0">
        {/* Search icon only - mobile */}
        <button className="md:hidden p-2 text-gray-500 hover:text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
            <path d="M21 21l-6 -6" />
          </svg>
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm font-medium text-slate-600">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-semibold hover:bg-red-100 transition"
            >
              Log Out
            </button>
          </div>
        ) : (
          <>
            <span className="hidden sm:block text-sm text-slate-600 font-medium cursor-pointer">
              Log In
            </span>
            <button
              className="px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
              onClick={handleSignUp}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
