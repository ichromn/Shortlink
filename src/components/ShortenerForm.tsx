import React, { useState, useEffect } from "react";
import { Link2, Sparkles, Key, Calendar, RefreshCw, Copy, Check, QrCode, ArrowRight, Clock, ChevronDown, ChevronUp, AlertCircle, HelpCircle } from "lucide-react";
import QRCode from "qrcode";
import { User as FirebaseUser } from "firebase/auth";
import { ShortLink } from "../types";

interface ShortenerFormProps {
  user: FirebaseUser | null;
  onLinkCreated: (link: ShortLink) => void;
  onOpenAuth: () => void;
}

export default function ShortenerForm({ user, onLinkCreated, onOpenAuth }: ShortenerFormProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [title, setTitle] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successLink, setSuccessLink] = useState<ShortLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // Clean form states
  const resetForm = () => {
    setOriginalUrl("");
    setAlias("");
    setTitle("");
    setExpiresAt("");
    setEnableExpiry(false);
    setError("");
  };

  // Generate QR code whenever a success link is populated
  useEffect(() => {
    if (successLink) {
      QRCode.toDataURL(successLink.originalUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#1e1b4b", // Deep indigo
          light: "#ffffff"
        }
      })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error("Gagal membuat QR Code:", err));
    }
  }, [successLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccessLink(null);
    setCopied(false);

    if (!originalUrl) {
      setError("Silakan masukkan tautan asli.");
      setLoading(false);
      return;
    }

    const payload = {
      originalUrl,
      alias: alias ? alias.trim() : undefined,
      title: title ? title.trim() : undefined,
      expiresAt: enableExpiry && expiresAt ? expiresAt : undefined,
      userId: user ? user.uid : "guest"
    };

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memperpendek tautan.");
      }

      setSuccessLink(data);
      onLinkCreated(data);

      // Save to guest list in localStorage if not logged in
      if (!user) {
        const localLinks = localStorage.getItem("guest_links");
        const list = localLinks ? JSON.parse(localLinks) : [];
        list.unshift(data);
        localStorage.setItem("guest_links", JSON.stringify(list));
      }
    } catch (err: any) {
      setError(err.message || "Koneksi ke server gagal.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!successLink) return;
    const shortUrl = `${window.location.origin}/${successLink.id}`;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrCode = () => {
    if (!qrCodeUrl || !successLink) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qrcode_${successLink.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Set minimum date for expiration to current time
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Must expire at least 5 minutes from now
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Title block */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          Perpendek Tautan Anda Secara Instan
        </h1>
        <p className="max-w-xl mx-auto text-base text-slate-500">
          Buat tautan yang lebih pendek, profesional, bermerek, lengkap dengan masa kedaluwarsa otomatis dan analisis performa klik.
        </p>
      </div>

      {/* Main Form Box */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Masukkan Tautan Asli (Panjang)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400">
                <Link2 className="h-5.5 w-5.5" />
              </span>
              <input
                type="text"
                required
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://contoh-url-panjang-anda.com/banyak-parameter-pelacak-disini..."
                className="w-full pl-12 pr-4 h-13 text-sm sm:text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-inner"
              />
            </div>
          </div>

          {/* Toggle Advanced Option */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center space-x-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer focus:outline-none"
          >
            <span>Pengaturan Lanjutan</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Advanced Section */}
          {showAdvanced && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4 animate-slide-down">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custom Alias */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                    <span>Kustomisasi Alias</span>
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(Opsional)</span>
                  </label>
                  <div className="flex h-11">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-xs font-mono text-slate-500 select-none">
                      {window.location.host}/
                    </span>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="diskon-ramadhan"
                      className="w-full px-3 h-11 text-sm bg-white border border-slate-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Hanya huruf, angka, tanda hubung (-) & garis bawah (_).
                  </span>
                </div>

                {/* Deskripsi/Judul Tautan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                    <span>Nama Tautan / Catatan</span>
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Promosi Kampanye FB"
                    className="w-full px-3 h-11 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Memudahkan Anda mencari atau mengelompokkan tautan.
                  </span>
                </div>
              </div>

              {/* Automatic Expiry */}
              <div className="pt-2 border-t border-slate-200/50">
                <div className="flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    id="expiry_checkbox"
                    checked={enableExpiry}
                    onChange={(e) => setEnableExpiry(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <label htmlFor="expiry_checkbox" className="text-sm font-semibold text-slate-800 cursor-pointer select-none">
                    Atur Masa Berlaku Tautan (Kedaluwarsa Otomatis)
                  </label>
                </div>
                
                {enableExpiry && (
                  <div className="mt-3 pl-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Pilih Waktu Kedaluwarsa
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                          <Calendar className="h-4 w-4" />
                        </span>
                        <input
                          type="datetime-local"
                          required={enableExpiry}
                          min={getMinDateTime()}
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="w-full pl-9 pr-3 h-10 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-slate-400 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/40">
                      <Clock className="h-4 w-4 text-indigo-500 mr-2 shrink-0" />
                      <span>
                        Setelah waktu terpilih terlewati, pengunjung tautan pendek akan secara otomatis dialihkan ke halaman kedaluwarsa sistem.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start space-x-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-99 transition shadow-md shadow-indigo-100 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                <span>Memproses Tautan...</span>
              </>
            ) : (
              <>
                <span>Singkatkan Sekarang</span>
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Success Box / Dynamic QR Block */}
      {successLink && (
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-indigo-500/10 space-y-6 animate-scale-up">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <Sparkles className="h-5 w-5 shrink-0 animate-pulse" />
            <span>Hore! Tautan Berhasil Dipendekkan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Short URL / Controls */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Judul/Nama Tautan
                </span>
                <p className="text-sm font-semibold text-slate-200">
                  {successLink.title || "Tautan Tanpa Nama"}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Tautan Pendek Anda
                </span>
                <div className="flex bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 items-center justify-between">
                  <span className="font-mono text-indigo-400 font-semibold select-all break-all pr-2">
                    {window.location.origin}/{successLink.id}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition active:scale-95"
                    title="Salin Tautan"
                  >
                    {copied ? <Check className="h-4.5 w-4.5" /> : <Copy className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Tautan Asal
                </span>
                <p className="text-xs text-slate-300 font-mono break-all line-clamp-2">
                  {successLink.originalUrl}
                </p>
              </div>

              {successLink.expiresAt && (
                <div className="flex items-center space-x-2 text-xs text-yellow-500 bg-yellow-500/10 p-2.5 border border-yellow-500/20 rounded-xl">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>
                    Berlaku sampai: <strong>{new Date(successLink.expiresAt).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* QR Code Segment */}
            <div className="md:col-span-5 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6 space-y-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Generator QR Code
              </span>
              {qrCodeUrl ? (
                <div className="bg-white p-3.5 rounded-xl shadow-lg border border-slate-100 flex items-center justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code untuk tautan pendek"
                    referrerPolicy="no-referrer"
                    className="h-36 w-36 object-contain"
                  />
                </div>
              ) : (
                <div className="h-36 w-36 bg-slate-800 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-500">
                  Membuat QR...
                </div>
              )}
              <button
                onClick={downloadQrCode}
                className="inline-flex items-center space-x-1.5 px-4 h-9 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>Unduh QR Code</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Warning */}
      {!user && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start space-x-2">
            <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Anda membuat tautan sebagai Tamu.</strong> Tautan akan tersimpan di browser Anda, tetapi Anda tidak bisa melihat analitik grafik mendalam atau melacak kunjungan dari perangkat lain.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="shrink-0 h-9 px-4 inline-flex items-center justify-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
          >
            Masuk / Daftar Akun
          </button>
        </div>
      )}
    </div>
  );
}
