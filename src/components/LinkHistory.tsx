import React, { useState } from "react";
import { Link2, Search, ExternalLink, Calendar, Trash2, TrendingUp, QrCode, Copy, Check, Sparkles, Clock, AlertTriangle } from "lucide-react";
import QRCode from "qrcode";
import { ShortLink } from "../types";

interface LinkHistoryProps {
  links: ShortLink[];
  loading: boolean;
  onSelectLink: (alias: string) => void;
  onDeleteLink: (alias: string) => void;
  isGuest: boolean;
}

export default function LinkHistory({
  links,
  loading,
  onSelectLink,
  onDeleteLink,
  isGuest,
}: LinkHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [qrModalLink, setQrModalLink] = useState<ShortLink | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copiedAlias, setCopiedAlias] = useState<string | null>(null);

  const filteredLinks = links.filter((link) => {
    const term = searchTerm.toLowerCase();
    return (
      link.id.toLowerCase().includes(term) ||
      link.originalUrl.toLowerCase().includes(term) ||
      (link.title && link.title.toLowerCase().includes(term))
    );
  });

  const handleCopy = (id: string) => {
    const shortUrl = `${window.location.origin}/${id}`;
    navigator.clipboard.writeText(shortUrl);
    setCopiedAlias(id);
    setTimeout(() => setCopiedAlias(null), 2000);
  };

  const handleOpenQr = async (link: ShortLink) => {
    const shortUrl = `${window.location.origin}/${link.id}`;
    try {
      const dataUrl = await QRCode.toDataURL(link.originalUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#1e1b4b", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      setQrModalLink(link);
    } catch (err) {
      console.error("Gagal membuat QR Code", err);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !qrModalLink) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode_${qrModalLink.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header section with Search bar */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>Riwayat Tautan</span>
            {isGuest && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                Mode Tamu
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isGuest 
              ? "Tautan disimpan lokal di peramban ini" 
              : "Semua tautan yang terhubung dengan akun Anda"
            }
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari alias, judul, atau URL..."
            className="w-full pl-9 pr-3 h-9.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
          <span>Sedang memuat data riwayat...</span>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="p-16 text-center space-y-4">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Link2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">Tidak Ada Tautan Ditemukan</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchTerm 
                ? "Cobalah mencari dengan kata kunci lain atau hapus filter pencarian Anda." 
                : "Anda belum memperpendek tautan apa pun. Mulai perpendek tautan pertama Anda sekarang!"
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/20">
                <th className="py-3.5 px-6">Informasi Tautan</th>
                <th className="py-3.5 px-6">Tautan Pendek</th>
                <th className="py-3.5 px-4 text-center">Status / Masa Berlaku</th>
                <th className="py-3.5 px-4 text-center">Jumlah Klik</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLinks.map((link) => {
                const expired = isExpired(link.expiresAt);
                const shortUrl = `${window.location.origin}/${link.id}`;

                return (
                  <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Title & Original URL */}
                    <td className="py-4 px-6 max-w-xs md:max-w-md">
                      <div className="flex flex-col space-y-0.5">
                        <span className="font-semibold text-slate-800 truncate">
                          {link.title || "Tautan Tanpa Nama"}
                        </span>
                        <a
                          href={link.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-slate-400 hover:text-indigo-600 transition inline-flex items-center space-x-1 truncate max-w-xs"
                        >
                          <span className="truncate">{link.originalUrl}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Dibuat: {new Date(link.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                    </td>

                    {/* Short URL with copy */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-semibold text-indigo-600 select-all">
                          {link.id}
                        </span>
                        <button
                          onClick={() => handleCopy(link.id)}
                          className={`p-1 rounded-md transition-colors ${
                            copiedAlias === link.id
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                          }`}
                          title="Salin tautan"
                        >
                          {copiedAlias === link.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Expiration status */}
                    <td className="py-4 px-4 text-center">
                      {link.expiresAt ? (
                        expired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 border border-red-100">
                            <Clock className="h-3 w-3 mr-1" />
                            Kedaluwarsa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-yellow-50 text-yellow-800 border border-yellow-100" title={new Date(link.expiresAt).toLocaleString()}>
                            <Clock className="h-3 w-3 mr-1" />
                            Aktif s/d {new Date(link.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Selamanya Aktif
                        </span>
                      )}
                    </td>

                    {/* Click Count */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 font-mono font-bold text-slate-800 text-xs">
                        {link.clicks.toLocaleString("id-ID")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Analytics (If registered, or block and tell them to login) */}
                        <button
                          onClick={() => onSelectLink(link.id)}
                          disabled={isGuest}
                          className={`p-1.5 rounded-lg border transition ${
                            isGuest
                              ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                              : "border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-100"
                          }`}
                          title={isGuest ? "Masuk akun untuk melihat grafik analitik real-time" : "Lihat Grafik Analitik"}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </button>

                        {/* QR Code trigger */}
                        <button
                          onClick={() => handleOpenQr(link)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-100 transition"
                          title="Tampilkan QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteLink(link.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition"
                          title="Hapus Tautan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* QR MODAL (Internal layer) */}
      {qrModalLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center border border-slate-100 relative">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              QR Code Tautan
            </h3>
            <p className="text-xs font-mono text-indigo-600 mb-4 select-all">
              {window.location.origin}/{qrModalLink.id}
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 flex items-center justify-center mx-auto max-w-[220px]">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  referrerPolicy="no-referrer"
                  className="h-44 w-44 object-contain"
                />
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadQr}
                className="w-full h-10 inline-flex items-center justify-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer"
              >
                Unduh Gambar
              </button>
              <button
                onClick={() => setQrModalLink(null)}
                className="w-full h-10 inline-flex items-center justify-center text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
