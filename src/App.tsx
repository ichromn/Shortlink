import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "./lib/firebase";
import { ShortLink } from "./types";

// Import custom sub-components
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import ShortenerForm from "./components/ShortenerForm";
import LinkHistory from "./components/LinkHistory";
import AnalyticsPanel from "./components/AnalyticsPanel";
import DeveloperDoc from "./components/DeveloperDoc";

// Lucide Icons for overall wrapper
import { Link2, Sparkles, AlertTriangle, ShieldCheck, Github, ExternalLink, RefreshCw } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<"shortener" | "dashboard" | "developer">("shortener");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [userLinks, setUserLinks] = useState<ShortLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [selectedAlias, setSelectedAlias] = useState<string | null>(null);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
      
      // If user logs out, go back to shortener
      if (!firebaseUser) {
        if (activeTab === "dashboard" || activeTab === "developer") {
          setActiveTab("shortener");
        }
        setSelectedAlias(null);
      }
    });

    return () => unsubscribe();
  }, [activeTab]);

  // Fetch Links based on login state
  const fetchLinks = async () => {
    setLoadingLinks(true);
    try {
      if (user) {
        // Logged in user -> Fetch from API
        const response = await fetch(`/api/links?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setUserLinks(data);
        } else {
          console.error("Gagal memuat tautan user.");
        }
      } else {
        // Guest user -> Fetch from localStorage
        const local = localStorage.getItem("guest_links");
        if (local) {
          setUserLinks(JSON.parse(local));
        } else {
          setUserLinks([]);
        }
      }
    } catch (err) {
      console.error("Gagal melakukan penarikan daftar tautan:", err);
    } finally {
      setLoadingLinks(false);
    }
  };

  // Re-fetch links when login state changes or user logs in/out
  useEffect(() => {
    if (authChecked) {
      fetchLinks();
    }
  }, [user, authChecked]);

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari akun?")) {
      await signOut(auth);
      setUserLinks([]);
      localStorage.removeItem("guest_links"); // Optionally clear, or let them keep.
    }
  };

  const handleLinkCreated = (newLink: ShortLink) => {
    // Add the new link to the top of our local state immediately
    setUserLinks((prev) => [newLink, ...prev]);
  };

  const handleDeleteLink = async (alias: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tautan pendek "${alias}"? Tindakan ini permanen.`)) {
      return;
    }

    try {
      if (user) {
        // Authenticated deletion
        const response = await fetch(`/api/links/${alias}?userId=${user.uid}`, {
          method: "DELETE"
        });
        if (response.ok) {
          setUserLinks((prev) => prev.filter((link) => link.id !== alias));
          if (selectedAlias === alias) setSelectedAlias(null);
        } else {
          const errData = await response.json();
          alert(errData.error || "Gagal menghapus tautan.");
        }
      } else {
        // Guest deletion
        const updated = userLinks.filter((link) => link.id !== alias);
        setUserLinks(updated);
        localStorage.setItem("guest_links", JSON.stringify(updated));
        if (selectedAlias === alias) setSelectedAlias(null);
      }
    } catch (err) {
      console.error("Gagal menghapus tautan:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Loading global auth status */}
        {!authChecked ? (
          <div className="py-24 text-center">
            <div className="h-10 w-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-slate-500">Menyelaraskan sesi aman Anda...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* View Switching */}
            {activeTab === "shortener" && (
              <div className="space-y-12">
                {/* 1. Main Shortener Form */}
                <ShortenerForm
                  user={user}
                  onLinkCreated={handleLinkCreated}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />

                {/* 2. Short Link History directly under it for quick access */}
                <div className="border-t border-slate-200/60 pt-10">
                  <div className="max-w-3xl mx-auto space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">
                      Tautan Anda Baru-baru Ini
                    </h3>
                    <LinkHistory
                      links={userLinks}
                      loading={loadingLinks}
                      onSelectLink={(alias) => {
                        setSelectedAlias(alias);
                        setActiveTab("dashboard");
                      }}
                      onDeleteLink={handleDeleteLink}
                      isGuest={!user}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {selectedAlias ? (
                  // Deep Analytics Panel
                  <AnalyticsPanel
                    alias={selectedAlias}
                    onClose={() => setSelectedAlias(null)}
                  />
                ) : (
                  // General history/dashboard list
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
                          Dasbor Analitik Real-Time
                        </h1>
                        <p className="text-sm text-slate-500">
                          Pantau dan kelola performa lalu lintas dari setiap tautan bermerek Anda.
                        </p>
                      </div>
                      <button
                        onClick={fetchLinks}
                        className="inline-flex items-center space-x-1 px-3.5 h-9 text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Muat Ulang</span>
                      </button>
                    </div>

                    <LinkHistory
                      links={userLinks}
                      loading={loadingLinks}
                      onSelectLink={(alias) => setSelectedAlias(alias)}
                      onDeleteLink={handleDeleteLink}
                      isGuest={!user}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "developer" && user && (
              <DeveloperDoc user={user} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white">
              <Link2 className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-slate-700">PangkasTautan © 2026</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center text-slate-400">
              <ShieldCheck className="h-4 w-4 mr-1 text-indigo-500" />
              <span>Sertifikasi Enkripsi SSL</span>
            </span>
            <span>•</span>
            <span>Bebas Pelacak Iklan</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal Container */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={fetchLinks}
      />
    </div>
  );
}
