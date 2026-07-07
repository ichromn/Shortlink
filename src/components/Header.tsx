import React from "react";
import { Link2, User, LogOut, LogIn, Terminal, History, TrendingUp } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

interface HeaderProps {
  user: FirebaseUser | null;
  activeTab: "shortener" | "dashboard" | "developer";
  setActiveTab: (tab: "shortener" | "dashboard" | "developer") => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Header({
  user,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div 
          className="flex cursor-pointer items-center space-x-2.5"
          onClick={() => setActiveTab("shortener")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200">
            <Link2 className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              PangkasTautan
            </span>
            <span className="hidden text-[10px] font-medium text-slate-400 sm:block">
              Shortlink & Analitik Real-Time
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("shortener")}
            className={`flex items-center space-x-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "shortener"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Link2 className="h-4 w-4" />
            <span>Pendekkan URL</span>
          </button>
          
          <button
            onClick={() => {
              if (user) {
                setActiveTab("dashboard");
              } else {
                onOpenAuth();
              }
            }}
            className={`flex items-center space-x-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "dashboard"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Dasbor & Riwayat</span>
          </button>

          <button
            onClick={() => {
              if (user) {
                setActiveTab("developer");
              } else {
                onOpenAuth();
              }
            }}
            className={`flex items-center space-x-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "developer"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Integrasi API</span>
          </button>
        </nav>

        {/* User Auth Info / Controls */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-sm font-medium text-slate-800 break-all max-w-[150px] truncate">
                  {user.email}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Terhubung
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-inner uppercase">
                {user.email ? user.email.charAt(0) : "U"}
              </div>
              <button
                onClick={onLogout}
                className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-red-600 transition-all duration-200"
                title="Keluar Akun"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center space-x-1.5 px-4 h-10 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-98 shadow-md shadow-indigo-100 transition-all duration-150"
            >
              <LogIn className="h-4 w-4" />
              <span>Masuk / Daftar</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav indicator */}
      <div className="flex md:hidden border-t border-slate-100 bg-slate-50 px-4 py-2 justify-around">
        <button
          onClick={() => setActiveTab("shortener")}
          className={`flex flex-col items-center space-y-0.5 text-[11px] font-medium transition-colors ${
            activeTab === "shortener" ? "text-indigo-600" : "text-slate-500"
          }`}
        >
          <Link2 className="h-5 w-5" />
          <span>Pendekkan</span>
        </button>
        <button
          onClick={() => {
            if (user) {
              setActiveTab("dashboard");
            } else {
              onOpenAuth();
            }
          }}
          className={`flex flex-col items-center space-y-0.5 text-[11px] font-medium transition-colors ${
            activeTab === "dashboard" ? "text-indigo-600" : "text-slate-500"
          }`}
        >
          <TrendingUp className="h-5 w-5" />
          <span>Dasbor</span>
        </button>
        <button
          onClick={() => {
            if (user) {
              setActiveTab("developer");
            } else {
              onOpenAuth();
            }
          }}
          className={`flex flex-col items-center space-y-0.5 text-[11px] font-medium transition-colors ${
            activeTab === "developer" ? "text-indigo-600" : "text-slate-500"
          }`}
        >
          <Terminal className="h-5 w-5" />
          <span>API</span>
        </button>
      </div>
    </header>
  );
}
