import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface AuthProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

const Auth = ({ onBack, onSuccess }: AuthProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  // State tambahan untuk deteksi kalau signup benar-benar berhasil
  const [isSignedUp, setIsSignedUp] = useState(false);

  const handleSignUp = async () => {
    setMessage(null);
    if (!email || !password) {
      return setMessage({
        text: "Email dan password wajib diisi!",
        type: "error",
      });
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      // Trigger layar sukses
      setIsSignedUp(true);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setMessage(null);
    if (!email || !password) {
      return setMessage({
        text: "Email dan password wajib diisi!",
        type: "error",
      });
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage({
        text: "Password salah atau akun tidak ditemukan!",
        type: "error",
      });
    } else {
      onSuccess?.();
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-(--cl-bg) p-4">
      <div className="w-full relative overflow-hidden max-w-md bg-(--cl-surface) rounded-2xl shadow-xl p-8 border border-(--cl-border) min-h-[400px] flex flex-col justify-center transition-all duration-500">
        {isSignedUp ? (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-(--cl-text) mb-2">
              Berhasil Daftar!
            </h2>
            <p className="text-(--cl-text-muted)">
              Cek email lu untuk verifikasi akun!
            </p>
            <button
              onClick={() => setIsSignedUp(false)}
              className="mt-8 text-sm text-(--cl-text-muted) hover:opacity-80 underline"
            >
              Kembali ke Login
            </button>
          </div>
        ) : (
          <>
            {message?.type === "error" && (
              <div className="absolute top-4 left-0 right-0 px-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between w-full p-3 rounded-lg text-sm bg-red-100 text-red-700 border border-red-200 shadow-md">
                  <div className="flex items-center gap-2">
                    {/* Icon Warning */}
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{message.text}</span>
                  </div>

                  {/* Tombol Close */}
                  <button
                    onClick={() => setMessage(null)}
                    className="ml-2 p-1 hover:bg-red-200 rounded-full transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-sm text-(--cl-text-muted) hover:opacity-80 mb-6 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
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
                </svg>{" "}
                Kembali
              </button>
            )}

            <h1 className="text-2xl font-bold text-center mb-2 text-(--cl-text)">
              ComicList
            </h1>
            <p className="text-center text-(--cl-text-muted) text-sm mb-6">
              {mode === "login" ? "Masuk ke akun mu" : "Buat akun baru"}
            </p>

            {/* Mode toggle */}
            <div className="flex rounded-lg overflow-hidden border border-(--cl-border) mb-6">
              <button
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                }}
                className={`flex-1 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-(--cl-primary) text-white" : "bg-(--cl-surface) text-(--cl-text-muted) hover:bg-(--cl-bg)"}`}
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setMode("signup");
                  setMessage(null);
                }}
                className={`flex-1 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-(--cl-primary) text-white" : "bg-(--cl-surface) text-(--cl-text-muted) hover:bg-(--cl-bg)"}`}
              >
                Sign Up
              </button>
            </div>

            <div className="space-y-4">
              {mode === "signup" && (
                <input
                  className="w-full p-3 border bg-(--cl-surface-2) text-(--cl-text) border-(--cl-border) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--cl-primary) text-sm"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              )}
              <input
                className="w-full p-3 border bg-(--cl-surface-2) text-(--cl-text) border-(--cl-border) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--cl-primary) text-sm"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full p-3 border bg-(--cl-surface-2) text-(--cl-text) border-(--cl-border) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--cl-primary) text-sm"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                onClick={mode === "login" ? handleLogin : handleSignUp}
                disabled={loading}
                className="w-full bg-(--cl-primary) text-white py-3 rounded-lg font-semibold hover:bg-(--cl-primary-hover) transition disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : mode === "login"
                    ? "Log In"
                    : "Daftar Sekarang"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
