import React, { useState, useEffect } from "react";
import { 
  X, RefreshCw, Download, ArrowLeft, TrendingUp, Calendar, Globe, Monitor, Share2, Database, HelpCircle 
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  BarChart, Bar, Cell, PieChart, Pie 
} from "recharts";
import { ClickStats, ShortLink } from "../types";

interface AnalyticsPanelProps {
  alias: string;
  onClose: () => void;
}

interface AnalyticsData {
  link: ShortLink & { shortUrl: string };
  summary: {
    totalClicks: number;
    dailyClicks: { date: string; clicks: number }[];
    browserStats: { name: string; clicks: number }[];
    osStats: { name: string; clicks: number }[];
    deviceStats: { name: string; clicks: number }[];
    refererStats: { name: string; clicks: number }[];
    rawClicks: any[];
  };
}

const COLORS = ["#4f46e5", "#10b981", "#8b5cf6", "#06b6d4", "#f59e0b", "#f43f5e", "#64748b"];

export default function AnalyticsPanel({ alias, onClose }: AnalyticsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/analytics/${alias}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memuat analitik.");
      setData(result);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data analitik.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [alias]);

  const handleExportCSV = () => {
    if (!data || !data.summary.rawClicks || data.summary.rawClicks.length === 0) {
      alert("Tidak ada data klik untuk diekspor.");
      return;
    }

    // Header definition
    const headers = ["ID Klik", "Waktu Kunjungan (UTC)", "Peramban (Browser)", "Sistem Operasi (OS)", "Perangkat", "Rujukan (Referer)"];
    
    // Generate CSV rows
    const rows = data.summary.rawClicks.map(click => [
      click.id,
      click.timestamp,
      click.browser || "Lainnya",
      click.os || "Lainnya",
      click.device || "Desktop",
      click.referer || "Langsung / Direct"
    ]);

    // Build CSV Content
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Download flow
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `analitik_klik_${alias}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-16 text-center bg-white rounded-2xl shadow-xl border border-slate-100 min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Menghubungkan ke server untuk memantau trafik real-time...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-10 bg-white rounded-2xl shadow-xl border border-slate-100 text-center space-y-6">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100">
          <X className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Gagal Memuat Analitik</h3>
          <p className="text-sm text-slate-500 mt-1">{error || "Terjadi kesalahan sistem."}</p>
        </div>
        <button
          onClick={() => fetchAnalytics()}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { link, summary } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button and quick link metadata */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="space-y-1">
          <button
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-2 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Riwayat</span>
          </button>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Analitik: {link.title || link.id}</span>
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400 pt-1">
            <span className="font-mono">Tautan Pendek: {window.location.origin}/{link.id}</span>
            <span>•</span>
            <span className="truncate max-w-xs md:max-w-md">Asli: {link.originalUrl}</span>
          </div>
        </div>

        {/* Refresh and CSV download */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="h-10 px-4 inline-flex items-center justify-center text-xs font-bold bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 text-slate-200 transition disabled:opacity-50 cursor-pointer"
            title="Perbarui data secara real-time"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            <span>{refreshing ? "Memperbarui..." : "Perbarui"}</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="h-10 px-4 inline-flex items-center justify-center text-xs font-bold bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-900/15 transition cursor-pointer"
          >
            <Download className="h-4 w-4 mr-1.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Grid: 4 Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 flex items-center space-x-4">
          <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Klik</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{summary.totalClicks}</span>
          </div>
        </div>

        {/* Expiry state */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 flex items-center space-x-4">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Masa Berlaku</span>
            <span className="text-sm font-bold text-slate-800">
              {link.expiresAt 
                ? (new Date() > new Date(link.expiresAt) ? "Kedaluwarsa" : "Aktif s/d " + new Date(link.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }))
                : "Selamanya Aktif"
              }
            </span>
          </div>
        </div>

        {/* Top Browser */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 flex items-center space-x-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Browser Terbanyak</span>
            <span className="text-sm font-bold text-slate-800 truncate max-w-[120px] block">
              {summary.browserStats.length > 0 
                ? `${summary.browserStats[0].name} (${Math.round((summary.browserStats[0].clicks / summary.totalClicks) * 100)}%)` 
                : "Belum Ada"
              }
            </span>
          </div>
        </div>

        {/* Top Referer */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 flex items-center space-x-4">
          <div className="h-11 w-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Rujukan Utama</span>
            <span className="text-sm font-bold text-slate-800 truncate max-w-[120px] block">
              {summary.refererStats.length > 0 
                ? `${summary.refererStats[0].name}` 
                : "Belum Ada"
              }
            </span>
          </div>
        </div>
      </div>

      {/* Primary Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Click Trend Line Chart (Takes 2 Cols) */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 md:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider text-slate-400">Tren Grafik Klik (Real-time)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Grafik garis tren volume kunjungan harian.</p>
          </div>
          <div className="h-68 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.dailyClicks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "10px", border: "none", color: "#fff" }} />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }} 
                  dot={{ stroke: "#4f46e5", strokeWidth: 2, r: 4, fill: "#fff" }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution (Pie Chart) */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider text-slate-400">Distribusi Perangkat</h3>
            <p className="text-xs text-slate-500 mt-0.5">Persentase jenis perangkat pengunjung.</p>
          </div>
          
          {summary.deviceStats.length > 0 ? (
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.deviceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="clicks"
                  >
                    {summary.deviceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">Belum ada data perangkat</div>
          )}

          {/* Color Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs pt-2">
            {summary.deviceStats.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="font-medium text-slate-600">{entry.name}: {entry.clicks}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referer Traffic Source (Bar Chart) */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider text-slate-400">Sumber Rujukan (Referer)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Asal link referal rujukan pengunjung.</p>
          </div>
          
          {summary.refererStats.length > 0 ? (
            <div className="h-56 w-full font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.refererStats} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }} />
                  <Bar dataKey="clicks" radius={[0, 4, 4, 0]}>
                    {summary.refererStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">Belum ada data rujukan</div>
          )}
        </div>

        {/* OS & Browser breakdown lists */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 space-y-4 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* OS Stats */}
            <div className="space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center text-slate-400">
                  <Monitor className="h-4 w-4 mr-1.5 text-indigo-500" />
                  <span>Sistem Operasi</span>
                </h4>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {summary.osStats.length > 0 ? (
                  summary.osStats.map((stat, index) => {
                    const pct = Math.round((stat.clicks / summary.totalClicks) * 100);
                    return (
                      <div key={stat.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{stat.name}</span>
                          <span>{stat.clicks} klik ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada data OS</p>
                )}
              </div>
            </div>

            {/* Browser Stats */}
            <div className="space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center text-slate-400">
                  <Globe className="h-4 w-4 mr-1.5 text-emerald-500" />
                  <span>Peramban (Browser)</span>
                </h4>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {summary.browserStats.length > 0 ? (
                  summary.browserStats.map((stat, index) => {
                    const pct = Math.round((stat.clicks / summary.totalClicks) * 100);
                    return (
                      <div key={stat.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{stat.name}</span>
                          <span>{stat.clicks} klik ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada data browser</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Raw Recent Logs Table */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider text-slate-400">Log Aktivitas Pengunjung Terbaru</h3>
          <p className="text-xs text-slate-500 mt-0.5">Catatan aktivitas kunjungan secara real-time.</p>
        </div>
        
        {summary.rawClicks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Belum ada aktivitas klik terekam untuk tautan ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/20">
                  <th className="py-3 px-6">Waktu Kunjungan (Lokal)</th>
                  <th className="py-3 px-4">Perangkat</th>
                  <th className="py-3 px-4">Browser</th>
                  <th className="py-3 px-4">OS</th>
                  <th className="py-3 px-6">Sumber Referal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
                {summary.rawClicks.slice().reverse().slice(0, 10).map((click, index) => {
                  return (
                    <tr key={click.id || index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-6 font-sans text-slate-800 font-medium">
                        {new Date(click.timestamp).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                          click.device === "Mobile" ? "bg-orange-50 text-orange-700" :
                          click.device === "Tablet" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {click.device || "Desktop"}
                        </span>
                      </td>
                      <td className="py-3 px-4">{click.browser || "Lainnya"}</td>
                      <td className="py-3 px-4">{click.os || "Lainnya"}</td>
                      <td className="py-3 px-6 text-slate-500 truncate max-w-xs">{click.referer || "Langsung"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {summary.rawClicks.length > 10 && (
              <div className="p-3 text-center border-t border-slate-100 bg-slate-50/30 text-[10px] font-semibold text-slate-400">
                Menampilkan 10 dari {summary.totalClicks} aktivitas klik terbaru. Ekspor CSV untuk mengambil semua log lengkap.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
