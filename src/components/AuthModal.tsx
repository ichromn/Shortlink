import React, { useState } from "react";
import { X, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  if (!isOpen) return null;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Silakan isi semua bidang input.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign in
        const credential = await signInWithEmailAndPassword(auth, email, password);
        
        // Fetch or create user profile on login
        await fetch("/api/users/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: credential.user.uid, email: credential.user.email })
        });

        onAuthSuccess();
        onClose();
      } else {
        // Sign up
        if (password.length < 6) {
          setError("Kata sandi harus minimal 6 karakter.");
          setLoading(false);
          return;
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Always register user profile in Firestore backend
        await fetch("/api/users/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: credential.user.uid, email: credential.user.email })
        });

        onAuthSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Alamat email sudah terdaftar.");
      } else if (err.code === "auth/weak-password") {
        setError("Kata sandi terlalu lemah.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Email atau kata sandi salah.");
      } else if (err.code === "auth/invalid-email") {
        setError("Format alamat email tidak valid.");
      } else {
        setError(err.message || "Gagal masuk atau mendaftar.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1.5 hover:bg-slate-50 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {isLogin ? "Masuk ke PangkasTautan" : "Daftar Akun Baru"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isLogin 
              ? "Kelola riwayat, analitik, dan kustomisasi tautan Anda" 
              : "Buat akun untuk melacak performa dan statistik klik tautan secara detail"
            }
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start space-x-2 p-3.5 mb-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 h-11 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 h-11 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition shadow-lg shadow-indigo-100 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{isLogin ? "Masuk" : "Daftar"}</span>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6 text-sm text-slate-500">
          {isLogin ? (
            <p>
              Belum memiliki akun?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition focus:outline-none"
              >
                Daftar sekarang
              </button>
            </p>
          ) : (
            <p>
              Sudah memiliki akun?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition focus:outline-none"
              >
                Masuk di sini
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
