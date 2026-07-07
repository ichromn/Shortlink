import React, { useState, useEffect } from "react";
import { 
  Key, RefreshCw, Copy, Check, Eye, EyeOff, Terminal, Code, Info, Server, Layers, HelpCircle, AlertCircle
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

interface DeveloperDocProps {
  user: FirebaseUser;
}

export default function DeveloperDoc({ user }: DeveloperDocProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: user.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil profil.");
      setApiKey(data.apiKey);
    } catch (err: any) {
      setError(err.message || "Gagal terhubung ke backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm("Apakah Anda yakin ingin memperbarui Token API Anda? Token lama Anda akan segera tidak valid.")) {
      return;
    }

    setRegenerating(true);
    setError("");
    try {
      const res = await fetch("/api/users/profile/regenerate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui Token API.");
      setApiKey(data.apiKey);
      alert("Token API berhasil diperbarui!");
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui token.");
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const baseUrl = window.location.origin;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent flex items-center justify-center space-x-2">
          <Terminal className="h-8 w-8 text-indigo-600" />
          <span>Integrasi API Developer</span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm text-slate-500">
          Koneksikan PangkasTautan ke aplikasi pihak ketiga, bot obrolan, atau alur kerja otomatisasi Anda menggunakan REST API standar industri kami.
        </p>
      </div>

      {/* API Key Manager Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Key className="h-5 w-5 text-indigo-500" />
              <span>Token API Pengembang Anda</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan Token API ini pada header Authorization di setiap request. Jaga kerahasiaannya!
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Memuat kredensial API Anda...</span>
          </div>
        ) : error ? (
          <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="h-4.5 w-4.5 text-red-500" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow font-mono text-sm">
                <input
                  type={showKey ? "text" : "password"}
                  readOnly
                  value={apiKey}
                  className="w-full pl-4 pr-20 h-11 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 select-all focus:outline-none"
                />
                <div className="absolute right-2 inset-y-0 flex items-center space-x-1">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    title={showKey ? "Sembunyikan" : "Tampilkan"}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={handleCopy}
                    className={`p-1.5 rounded-lg transition-all ${
                      copied 
                        ? "text-emerald-600 bg-emerald-50" 
                        : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    }`}
                    title="Salin Token"
                  >
                    {copied ? <Check className="h-4.5 w-4.5" /> : <Copy className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleRegenerateKey}
                disabled={regenerating}
                className="h-11 px-5 inline-flex items-center justify-center text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition cursor-pointer shrink-0"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
                <span>Perbarui Token</span>
              </button>
            </div>
            
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start space-x-2">
              <Info className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Perhatian Keamanan:</strong> Jangan membagikan Token API ini dalam repository publik atau kode client-side browser yang terekspos langsung. Token ini mewakili hak akses penuh ke riwayat tautan akun Anda.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* API Reference Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Code className="h-5 w-5 text-indigo-500" />
            <span>Dokumentasi API Terintegrasi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gunakan panduan berikut untuk mulai memanggil API pemendek tautan.
          </p>
        </div>

        {/* Global info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 flex items-start space-x-3">
            <Server className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Base URL</span>
              <span className="font-mono text-slate-800 break-all">{baseUrl}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 flex items-start space-x-3">
            <Layers className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Header Autentikasi</span>
              <span className="font-mono text-slate-800 break-all">Authorization: Bearer &lt;TOKEN_API&gt;</span>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-6 pt-4 border-t border-slate-100">
          
          {/* Endpoint 1: Create Link */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                POST
              </span>
              <span className="font-mono text-sm font-bold text-slate-800">/api/links</span>
            </div>
            <p className="text-xs text-slate-600">
              Membuat tautan pendek baru dengan kustomisasi alias dan masa berlaku.
            </p>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Format Request Body (JSON)</span>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`{
  "originalUrl": "https://contoh-url-panjang.com/campaign-ramadhan",
  "alias": "diskon-lebaran",        // Opsional: Kustomisasi alias kata
  "expiresAt": "2026-08-30T12:00:00.000Z", // Opsional: ISO String waktu kedaluwarsa
  "title": "Promosi Flash Sale"     // Opsional: Judul pengelompokan
}`}
              </pre>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contoh Perintah cURL</span>
              <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`curl -X POST "${baseUrl}/api/links" \\
  -H "Authorization: Bearer ${apiKey || "YOUR_API_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "originalUrl": "https://contoh-url-panjang.com/campaign-ramadhan",
    "alias": "diskon-lebaran",
    "title": "Promosi Flash Sale"
  }'`}
              </pre>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Format Response Berhasil (201 Created)</span>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`{
  "id": "diskon-lebaran",
  "originalUrl": "https://contoh-url-panjang.com/campaign-ramadhan",
  "createdAt": "2026-07-06T21:14:00.000Z",
  "expiresAt": null,
  "clicks": 0,
  "userId": "${user.uid}",
  "title": "Promosi Flash Sale",
  "shortUrl": "${baseUrl}/diskon-lebaran"
}`}
              </pre>
            </div>
          </div>

          {/* Endpoint 2: List Links */}
          <div className="space-y-3 pt-6 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                GET
              </span>
              <span className="font-mono text-sm font-bold text-slate-800">/api/links</span>
            </div>
            <p className="text-xs text-slate-600">
              Mengambil semua riwayat daftar tautan pendek yang dibuat oleh akun pengguna ini.
            </p>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contoh Perintah cURL</span>
              <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`curl -X GET "${baseUrl}/api/links" \\
  -H "Authorization: Bearer ${apiKey || "YOUR_API_KEY"}"`}
              </pre>
            </div>
          </div>

          {/* Endpoint 3: Delete Link */}
          <div className="space-y-3 pt-6 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-100">
                DELETE
              </span>
              <span className="font-mono text-sm font-bold text-slate-800">/api/links/:alias</span>
            </div>
            <p className="text-xs text-slate-600">
              Menghapus tautan pendek berdasarkan kata alias yang ditentukan.
            </p>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contoh Perintah cURL</span>
              <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`curl -X DELETE "${baseUrl}/api/links/diskon-lebaran" \\
  -H "Authorization: Bearer ${apiKey || "YOUR_API_KEY"}"`}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
