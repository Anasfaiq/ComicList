import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface AuthProps {
  onBack?: () => void;
}

const Auth = ({ onBack }: AuthProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleSignUp = async () => {
    if (!email || !password) return alert("Email dan password wajib diisi!");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) alert(error.message);
    else alert("Cek email lu untuk verifikasi akun!");
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) return alert("Email dan password wajib diisi!");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6 transition"
          >
            ← Kembali
          </button>
        )}

        <h1 className="text-2xl font-bold text-center mb-2 text-slate-800">
          ComicList
        </h1>
        <p className="text-center text-slate-500 text-sm mb-6">
          {mode === "login" ? "Masuk ke akun lu" : "Buat akun baru"}
        </p>

        {/* Mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-slate-200 mb-6">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="space-y-4">
          {mode === "signup" && (
            <input
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}
          <input
            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={mode === "login" ? handleLogin : handleSignUp}
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-700 transition disabled:opacity-50"
          >
            {loading ? "Loading..." : mode === "login" ? "Log In" : "Daftar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
