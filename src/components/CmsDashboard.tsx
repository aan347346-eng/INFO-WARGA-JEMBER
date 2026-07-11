import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { 
  LayoutDashboard, FileText, UserCheck, Settings, PenTool, Trash2, 
  Eye, Check, ShieldAlert, Plus, X, Globe, Save, AlertTriangle, 
  MapPin, Bell, MessageSquare, ExternalLink, HelpCircle, HardDrive 
} from "lucide-react";
import { Article, Comment, WebSettings, AdminUser, DashboardData, CATEGORIES, KECAMATAN_LIST } from "../types";
import GoogleDriveTab from "./GoogleDriveTab";

interface CmsDashboardProps {
  user: any;
  onLogout: () => void;
  onNavigateHome: () => void;
  webSettings: WebSettings;
  onUpdateSettings: (newSettings: WebSettings) => void;
}

const COLORS = ["#C2185B", "#AD1457", "#F06292", "#D81B60", "#F48FB1", "#880E4F"];

// Helper function to play an elegant double-tone chime sound programmatically using the Web Audio API
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioContext = new AudioContextClass();
    
    // First tone (C5)
    const osc1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    osc1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    
    osc1.type = "sine";
    const now = audioContext.currentTime;
    
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gainNode1.gain.setValueAtTime(0.12, now);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    osc1.start(now);
    osc1.stop(now + 0.45);
    
    // Second tone (E5, perfect chime interval)
    const osc2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    osc2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.setValueAtTime(0.12, now + 0.12);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn("Could not play notification sound:", err);
  }
};

export default function CmsDashboard({
  user,
  onLogout,
  onNavigateHome,
  webSettings,
  onUpdateSettings,
}: CmsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "articles" | "write" | "admins" | "settings" | "comments" | "drive">("dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Loading indicators
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Forms State
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "pemerintahan",
    kecamatan: "" as string,
    image: "",
    status: "draft" as "draft" | "review" | "publish"
  });

  const [adminForm, setAdminForm] = useState({
    email: "",
    name: "",
    role: "admin" as "admin" | "superadmin"
  });

  const [settingsForm, setSettingsForm] = useState<WebSettings>({ ...webSettings });

  // Load Dashboard Data (Superadmin only) or Admin Main View
  const fetchDashboardData = async () => {
    if (user.role !== "superadmin") {
      setLoadingDashboard(false);
      return;
    }
    setLoadingDashboard(true);
    try {
      const res = await fetch("/api/dashboard", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("cms_token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        setComments(data.comments);
      }

      // Notifications
      const notifRes = await fetch("/api/notifications", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("cms_token")}` }
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        // Play notification chime on initial dashboard load if there are pending notifications
        if (notifData.length > 0 && notifications.length === 0) {
          playNotificationSound();
        }
        setNotifications(notifData);
      }
    } catch (e) {
      console.error("Error loading dashboard data", e);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Load Articles list
  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch("/api/articles?status=all", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("cms_token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (e) {
      console.error("Error fetching articles", e);
    } finally {
      setLoadingArticles(false);
    }
  };

  // Load Admins list
  const fetchAdmins = async () => {
    if (user.role !== "superadmin") return;
    setLoadingAdmins(true);
    try {
      const res = await fetch("/api/admins", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("cms_token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (e) {
      console.error("Error fetching admins", e);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchArticles();
    fetchAdmins();
  }, [activeTab]);

  // Background polling (every 15 seconds) to fetch review notifications for real-time sound updates
  useEffect(() => {
    if (user.role !== "superadmin") return;

    const intervalId = setInterval(async () => {
      try {
        const notifRes = await fetch("/api/notifications", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("cms_token")}` }
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          if (notifData.length > 0) {
            // Check if there are any brand new notification IDs that we don't have in state
            const hasNewNotif = notifData.some((newN: any) => 
              !notifications.some((oldN: any) => oldN.id === newN.id)
            );
            if (hasNewNotif) {
              playNotificationSound();
            }
          }
          setNotifications(notifData);
        }
      } catch (err) {
        console.error("Error background polling notifications:", err);
      }
    }, 15000); // 15 seconds

    return () => clearInterval(intervalId);
  }, [notifications, user.role]);

  // Handle setting tabs or editing
  const handleEditArticle = (art: Article) => {
    setEditingArticleId(art.id);
    setArticleForm({
      title: art.title,
      content: art.content,
      excerpt: art.excerpt,
      category: art.category,
      kecamatan: art.kecamatan || "",
      image: art.image,
      status: art.status
    });
    setActiveTab("write");
  };

  const handleCreateNewArticle = () => {
    setEditingArticleId(null);
    setArticleForm({
      title: "",
      content: "",
      excerpt: "",
      category: "pemerintahan",
      kecamatan: "",
      image: "",
      status: "draft"
    });
    setActiveTab("write");
  };

  // Actions
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingArticleId;
    const url = isEdit ? `/api/articles/${editingArticleId}` : "/api/articles";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("cms_token")}`
        },
        body: JSON.stringify({
          ...articleForm,
          kecamatan: articleForm.kecamatan || null
        })
      });

      if (res.ok) {
        alert(isEdit ? "Artikel berhasil diperbarui!" : "Artikel baru berhasil ditambahkan!");
        setActiveTab("articles");
        fetchArticles();
      } else {
        const err = await res.json();
        alert(err.message || "Gagal menyimpan artikel.");
      }
    } catch (e) {
      console.error("Failed saving article", e);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("cms_token")}` }
      });
      if (res.ok) {
        setArticles(articles.filter(a => a.id !== id));
        alert("Artikel berhasil dihapus!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Action: Change Status / Jadikan Draft
  const handleQuickStatusChange = async (id: string, newStatus: "draft" | "review" | "publish") => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("cms_token")}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchArticles();
        alert(`Status artikel berhasil diubah menjadi ${newStatus.toUpperCase()}!`);
      } else {
        const err = await res.json();
        alert(err.message || "Gagal mengubah status.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Manage Admins
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.email) return;
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("cms_token")}`
        },
        body: JSON.stringify(adminForm)
      });
      if (res.ok) {
        alert("Admin berhasil ditambahkan!");
        setAdminForm({ email: "", name: "", role: "admin" });
        fetchAdmins();
      } else {
        const err = await res.json();
        alert(err.message || "Gagal menambahkan admin.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAdmin = async (email: string) => {
    if (email === "aann37501@gmail.com" || email === "aan347346@gmail.com") {
      alert("Akun Superadmin Utama tidak dapat dihapus!");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin mencabut hak akses admin untuk ${email}?`)) return;
    try {
      const res = await fetch(`/api/admins/${email}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("cms_token")}` }
      });
      if (res.ok) {
        setAdmins(admins.filter(a => a.email !== email));
        alert("Akses admin dicabut!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Moderate comments
  const handleDeleteComment = async (id: string) => {
    if (!confirm("Hapus komentar publik ini?")) return;
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("cms_token")}` }
      });
      if (res.ok) {
        setComments(comments.filter(c => c.id !== id));
        alert("Komentar berhasil dihapus!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Settings
  const handleUpdateSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("cms_token")}`
        },
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdateSettings(updated);
        alert("Pengaturan website berhasil diperbarui secara real-time!");
      } else {
        alert("Gagal memperbarui pengaturan.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await fetch("/api/notifications/clear", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("cms_token")}` }
      });
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper parsing image URL
  const parseImage = (url: string) => {
    if (!url) return "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=128";
    
    // Support various formats of Google Drive links
    const driveRegexes = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/uc\?.*?id=([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/thumbnail\?.*?id=([a-zA-Z0-9_-]+)/,
      /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
      /lh3\.googleusercontent\.com\/u\/\d+\/d\/([a-zA-Z0-9_-]+)/
    ];

    let fileId = "";
    for (const regex of driveRegexes) {
      const match = url.match(regex);
      if (match && match[1]) {
        fileId = match[1];
        break;
      }
    }

    // If still not matched, check if there's any parameter with 'id=' that looks like a Google Drive ID (usually 25-45 characters)
    if (!fileId) {
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{25,45})/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      }
    }

    if (fileId) {
      // Use lh3.googleusercontent.com/d/FILE_ID which bypasses Google Drive's new cookie/iframe restrictions on embedded images
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    
    return url;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Control Panel */}
      <aside className="w-full md:w-64 bg-vibrant-dark text-white flex flex-col shrink-0 select-none border-r border-vibrant-secondary">
        <div className="p-6 bg-vibrant-secondary border-b border-vibrant-dark flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase text-vibrant-light">INFO WARGA JEMBER</span>
          </div>
          <h2 className="text-base font-black tracking-tight truncate">
            {user.name}
          </h2>
          <span className="text-[10px] bg-vibrant-dark/80 px-2 py-0.5 rounded font-extrabold uppercase w-max tracking-wide text-vibrant-light">
            {user.role}
          </span>
        </div>

        <nav className="flex-grow p-4 flex flex-col gap-1.5">
          {user.role === "superadmin" && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "dashboard" ? "bg-vibrant-primary text-white" : "text-vibrant-light hover:bg-vibrant-secondary"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dasbor Analitik
            </button>
          )}

          <button
            onClick={() => setActiveTab("articles")}
            className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === "articles" ? "bg-vibrant-primary text-white" : "text-vibrant-light hover:bg-vibrant-secondary"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" />
              Kelola Artikel
            </span>
            <span className="bg-vibrant-dark/60 text-[10px] text-vibrant-light px-1.5 py-0.5 rounded-md font-bold">
              {articles.length}
            </span>
          </button>

          <button
            onClick={handleCreateNewArticle}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === "write" && !editingArticleId ? "bg-vibrant-primary text-white" : "text-vibrant-light hover:bg-vibrant-secondary"
            }`}
          >
            <PenTool className="w-4 h-4" />
            Tulis Artikel Baru
          </button>

          <button
            onClick={() => setActiveTab("drive")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === "drive" ? "bg-vibrant-primary text-white" : "text-vibrant-light hover:bg-vibrant-secondary"
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Google Drive Cloud
          </button>

          {user.role === "superadmin" && (
            <>
              <button
                onClick={() => setActiveTab("comments")}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "comments" ? "bg-vibrant-primary text-white" : "text-vibrant-light hover:bg-vibrant-secondary"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Moderasi Komentar
              </button>

              <button
                onClick={() => setActiveTab("admins")}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "admins" ? "bg-vibrant-primary text-white" : "text-vibrant-light hover:bg-vibrant-secondary"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Daftar Akses Admin
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "settings" ? "bg-vibrant-primary text-white" : "text-vibrant-light hover:bg-vibrant-secondary"
                }`}
              >
                <Settings className="w-4 h-4" />
                Pengaturan Website
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-vibrant-secondary/50 flex flex-col gap-2">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-center gap-1.5 bg-vibrant-secondary hover:bg-vibrant-secondary/85 py-2 rounded-xl text-[11px] font-bold text-vibrant-light transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" /> Lihat Beranda Publik
          </button>
          <button
            onClick={onLogout}
            className="w-full bg-vibrant-primary hover:bg-vibrant-accent py-2 rounded-xl text-[11px] font-bold text-white transition-colors cursor-pointer"
          >
            Keluar dari Portal
          </button>
        </div>
      </aside>

      {/* Main CMS Display area */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto max-w-7xl">
        
        {/* NOTIFICATIONS BAR FOR SUPERADMIN */}
        {user.role === "superadmin" && notifications.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
            <div className="flex gap-2.5 items-start">
              <Bell className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex flex-col text-xs text-amber-950 font-semibold">
                <span className="font-extrabold text-sm text-amber-900">Artikel Baru Menunggu Persetujuan!</span>
                <span>{notifications[0].message}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  // Find review article in the state
                  const targetArt = articles.find(a => a.status === "review");
                  if (targetArt) {
                    handleEditArticle(targetArt);
                  } else {
                    // Fallback to list of articles
                    setActiveTab("articles");
                  }
                  // Clear the notifications so it disappears immediately from the server and client
                  await handleClearNotifications();
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Tinjau Artikel
              </button>
              <button 
                onClick={handleClearNotifications}
                className="text-amber-700 hover:text-amber-900 text-xs font-bold cursor-pointer"
              >
                Bersihkan
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: DASHBOARD STATS */}
        {activeTab === "dashboard" && user.role === "superadmin" && (
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-black text-gray-900 uppercase">Dashboard Analitik Pengunjung</h1>

            {loadingDashboard ? (
              <p className="text-xs text-gray-500">Memuat analisis...</p>
            ) : (
              <>
                {/* Real-time stats widgets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Kunjungan</span>
                    <span className="text-2xl font-black text-vibrant-primary">{dashboardData?.stats.totalVisits}</span>
                    <span className="text-[9px] text-emerald-600 font-semibold">↑ Sesi Unik Pengunjung</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Pageviews</span>
                    <span className="text-2xl font-black text-vibrant-dark">{dashboardData?.stats.totalPageviews}</span>
                    <span className="text-[9px] text-slate-400 font-semibold">Sirkulasi Pembaca</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Berita</span>
                    <span className="text-2xl font-black text-slate-850">{dashboardData?.totalArticles}</span>
                    <span className="text-[9px] text-vibrant-primary font-semibold">Telah Terbit & Konsep</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-vibrant-border shadow-xs flex flex-col gap-1 bg-gradient-to-tr from-vibrant-light/30 to-white">
                    <span className="text-[10px] uppercase font-bold text-vibrant-secondary">Butuh Review (Review)</span>
                    <span className="text-2xl font-black text-vibrant-primary">{dashboardData?.pendingReviewCount}</span>
                    <span className="text-[9px] text-vibrant-accent font-semibold">Menunggu Superadmin</span>
                  </div>
                </div>

                {/* Recharts Charts Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Visitor Trend */}
                  <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-slate-850">Tren Kunjungan & Pembaca (Real-time)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardData?.stats.dailyStats}>
                          <defs>
                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#C2185B" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#C2185B" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="visits" name="Pengunjung Unik" stroke="#C2185B" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                          <Area type="monotone" dataKey="pageviews" name="Tampilan Halaman" stroke="#AD1457" strokeWidth={2} fill="none" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Browser Stats */}
                  <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-slate-850">Perangkat Pengunjung</h3>
                    <div className="h-64 flex justify-center items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(dashboardData?.stats.browserStats || {}).map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name }) => name}
                          >
                            {Object.entries(dashboardData?.stats.browserStats || {}).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Category Views */}
                  <div className="lg:col-span-12 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-slate-850">Minat Kategori Terfavorit</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(dashboardData?.stats.categoryViews || {}).map(([category, views]) => ({ category, views }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="views" name="Jumlah Pembaca" fill="#C2185B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Popular Articles List */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">5 Berita Jember Terpopuler Saat Ini</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                          <th className="py-2">Peringkat</th>
                          <th className="py-2">Judul Artikel</th>
                          <th className="py-2">Kategori</th>
                          <th className="py-2">Kecamatan</th>
                          <th className="py-2">Penulis</th>
                          <th className="py-2">Pembaca (Views)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData?.popularArticles.map((art, idx) => (
                          <tr key={art.id} className="border-b border-slate-50 text-slate-700 font-medium hover:bg-vibrant-light/10">
                            <td className="py-3 font-bold text-vibrant-primary">#{idx + 1}</td>
                            <td className="py-3 font-semibold text-slate-900">{art.title}</td>
                            <td className="py-3 uppercase font-bold text-vibrant-primary">{art.category}</td>
                            <td className="py-3 font-bold text-slate-500">{art.kecamatan || "—"}</td>
                            <td className="py-3 text-slate-500">{art.authorName}</td>
                            <td className="py-3 font-black text-vibrant-dark">{art.views} kali dilihat</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: ARTICLES LIST */}
        {activeTab === "articles" && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-black text-slate-900 uppercase">Daftar Artikel Jember</h1>
              <button
                onClick={handleCreateNewArticle}
                className="bg-vibrant-primary hover:bg-vibrant-secondary text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Tulis Berita Baru
              </button>
            </div>

            {loadingArticles ? (
              <p className="text-xs text-slate-500">Memuat artikel...</p>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                        <th className="py-3">Gambar</th>
                        <th className="py-3">Judul Berita</th>
                        <th className="py-3">Kategori & Wilayah</th>
                        <th className="py-3">Status</th>
                        <th className="py-3">Penulis</th>
                        <th className="py-3">Views</th>
                        <th className="py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((art) => {
                        const canEdit = user.role === "superadmin" || art.authorEmail === user.email;
                        return (
                          <tr key={art.id} className="border-b border-slate-50 text-slate-700 font-semibold hover:bg-slate-50/50">
                            <td className="py-3 pr-4">
                              <img 
                                src={parseImage(art.image)} 
                                alt={art.title} 
                                referrerPolicy="no-referrer"
                                className="w-12 h-10 object-cover rounded shadow-xs"
                              />
                            </td>
                            <td className="py-3 pr-4">
                              <span className="font-bold text-slate-950 line-clamp-2 leading-snug">{art.title}</span>
                              <span className="text-[10px] text-slate-400">{new Date(art.createdAt).toLocaleDateString("id-ID")}</span>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase text-vibrant-primary font-extrabold">{art.category}</span>
                                {art.kecamatan && (
                                  <span className="text-[9px] font-bold text-vibrant-dark">📍 {art.kecamatan}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                art.status === "publish" 
                                  ? "bg-green-100 text-green-700" 
                                  : art.status === "review" 
                                    ? "bg-amber-100 text-amber-700" 
                                    : "bg-slate-100 text-slate-700"
                              }`}>
                                {art.status}
                              </span>
                            </td>
                            <td className="py-3 text-slate-500 pr-4">{art.authorName}</td>
                            <td className="py-3 font-bold pr-4">{art.views}</td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Quick Draft Action (Jadikan Draft) */}
                                {art.status === "publish" && (
                                  <button
                                    onClick={() => handleQuickStatusChange(art.id, "draft")}
                                    className="px-2 py-1 bg-slate-100 hover:bg-vibrant-light/50 text-slate-700 hover:text-vibrant-secondary font-black text-[10px] rounded cursor-pointer"
                                    title="Jadikan Draft agar tidak dilihat publik"
                                  >
                                    Jadikan Draft
                                  </button>
                                )}

                                {/* Quick Publish Action (Superadmin Only) */}
                                {art.status !== "publish" && user.role === "superadmin" && (
                                  <button
                                    onClick={() => handleQuickStatusChange(art.id, "publish")}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white font-black text-[10px] rounded cursor-pointer"
                                    title="Setujui dan Terbitkan"
                                  >
                                    Terbitkan
                                  </button>
                                )}

                                {canEdit && (
                                  <>
                                    <button
                                      onClick={() => handleEditArticle(art)}
                                      className="p-1.5 bg-vibrant-light text-vibrant-primary hover:bg-vibrant-border rounded cursor-pointer"
                                      title="Edit"
                                    >
                                      <PenTool className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteArticle(art.id)}
                                      className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded cursor-pointer"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WRITE / EDIT ARTICLE */}
        {activeTab === "write" && (
          <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-6 flex flex-col gap-6">
            <h1 className="text-2xl font-black text-slate-900 uppercase">
              {editingArticleId ? "Ubah & Sunting Berita Jember" : "Tulis Berita Jember Terkini"}
            </h1>

            <form onSubmit={handleSaveArticle} className="flex flex-col gap-5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-xs">Judul Artikel Berita Jember *</label>
                <input
                  type="text"
                  required
                  placeholder="Ketik judul artikel yang menarik dan informatif seputar Jember..."
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  className="px-4 py-2.5 border-2 border-vibrant-border focus:border-vibrant-primary focus:ring-1 focus:ring-vibrant-primary rounded-xl focus:outline-none text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Pilih Kategori Utama *</label>
                  <select
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                    className="px-4 py-2.5 border-2 border-vibrant-border focus:border-vibrant-primary rounded-xl focus:outline-none text-xs font-semibold bg-white"
                  >
                    {CATEGORIES.filter(c => c.id !== "beranda").map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Wilayah Kecamatan Kabupaten Jember (Pilihan)</label>
                  <select
                    value={articleForm.kecamatan}
                    onChange={(e) => setArticleForm({ ...articleForm, kecamatan: e.target.value })}
                    className="px-4 py-2.5 border-2 border-vibrant-border focus:border-vibrant-primary rounded-xl focus:outline-none text-xs font-semibold bg-white"
                  >
                    <option value="">— Bukan Berita Kecamatan —</option>
                    {KECAMATAN_LIST.map(kec => (
                      <option key={kec} value={kec}>Kecamatan {kec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Excerpt / Ringkasan Berita */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Kutipan / Ringkasan Singkat (Muncul di Halaman Beranda) *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Berikan ringkasan berita singkat padat untuk menarik minat pembaca..."
                  value={articleForm.excerpt}
                  onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                  className="p-3 border-2 border-vibrant-border focus:border-vibrant-primary rounded-xl focus:outline-none text-xs font-medium"
                />
              </div>

              {/* Cover Image URL Input (Includes Support for Google Drive) */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>URL Gambar Sampul (Unsplash atau Tautan Google Drive Publik) *</span>
                  <button
                    type="button"
                    onClick={() => alert("Panduan Link Google Drive:\n1. Upload gambar ke Google Drive Anda\n2. Klik kanan, pilih Bagikan & pastikan akses diatur 'Siapa saja yang memiliki link dapat melihat'\n3. Salin linknya lalu tempelkan ke kolom ini.\n\nAplikasi ini akan otomatis mengubahnya agar gambar dapat tampil lancar!")}
                    className="text-[10px] text-vibrant-primary hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Petunjuk Google Drive
                  </button>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... atau tautan sharing Google Drive publik..."
                  value={articleForm.image}
                  onChange={(e) => setArticleForm({ ...articleForm, image: e.target.value })}
                  className="px-4 py-2.5 border-2 border-vibrant-border focus:border-vibrant-primary rounded-xl focus:outline-none text-xs"
                />
                {articleForm.image && (
                  <div className="mt-2 flex items-center gap-3 bg-vibrant-light/30 p-2 rounded-xl border border-vibrant-border">
                    <img 
                      src={parseImage(articleForm.image)} 
                      alt="Pratinjau Sampul" 
                      referrerPolicy="no-referrer"
                      className="w-16 h-12 object-cover rounded shadow-xs"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-[10px] text-vibrant-dark">Pratinjau Gambar Berhasil Disaring!</span>
                      <span className="text-[9px] text-vibrant-secondary truncate max-w-[400px]">{parseImage(articleForm.image)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rich Content Editor Textarea */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Konten Artikel Lengkap (Gunakan Format Kode HTML Sederhana Jika Diperlukan) *</label>
                {/* HTML Helper Quick Tools */}
                <div className="flex gap-2 bg-vibrant-light/30 border border-vibrant-border p-2 rounded-t-xl text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setArticleForm({ ...articleForm, content: articleForm.content + "<p>Teks Paragraf Baru</p>" })}
                    className="px-2 py-1 bg-white hover:bg-vibrant-light/60 rounded border border-vibrant-border cursor-pointer text-vibrant-dark transition-colors"
                  >
                    + Paragraf (&lt;p&gt;)
                  </button>
                  <button
                    type="button"
                    onClick={() => setArticleForm({ ...articleForm, content: articleForm.content + "<b>Teks Tebal</b>" })}
                    className="px-2 py-1 bg-white hover:bg-vibrant-light/60 rounded border border-vibrant-border cursor-pointer text-vibrant-dark transition-colors"
                  >
                    + Tebal (&lt;b&gt;)
                  </button>
                  <button
                    type="button"
                    onClick={() => setArticleForm({ ...articleForm, content: articleForm.content + "<i>Teks Miring</i>" })}
                    className="px-2 py-1 bg-white hover:bg-vibrant-light/60 rounded border border-vibrant-border cursor-pointer text-vibrant-dark transition-colors"
                  >
                    + Miring (&lt;i&gt;)
                  </button>
                </div>
                <textarea
                  required
                  rows={14}
                  placeholder="Ketik detail isi laporan berita lengkap Anda di sini..."
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  className="p-4 border-2 border-t-0 border-vibrant-border focus:border-vibrant-primary rounded-b-xl focus:outline-none text-xs font-medium leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-vibrant-light/40 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("articles")}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    onClick={() => setArticleForm({ ...articleForm, status: "draft" })}
                    className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Simpan Sebagai Draft
                  </button>
                  <button
                    type="submit"
                    onClick={() => setArticleForm({ ...articleForm, status: "review" })}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Kirim untuk Di-Review Superadmin
                  </button>
                  {user.role === "superadmin" && (
                    <button
                      type="submit"
                      onClick={() => setArticleForm({ ...articleForm, status: "publish" })}
                      className="px-6 py-2.5 bg-vibrant-primary hover:bg-vibrant-secondary text-white font-black rounded-xl cursor-pointer shadow-md transition-colors"
                    >
                      Terbitkan Sekarang (Publish)
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: COMMENT MODERATION */}
        {activeTab === "comments" && user.role === "superadmin" && (
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-black text-slate-900 uppercase">Moderasi Komentar Publik</h1>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-4">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center italic py-6">Tidak ada komentar masuk.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                        <th className="py-2.5">Berita Terkait</th>
                        <th className="py-2.5">Penulis Komentar</th>
                        <th className="py-2.5">Email</th>
                        <th className="py-2.5">Isi Komentar</th>
                        <th className="py-2.5">Dibuat</th>
                        <th className="py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comments.map((com) => (
                        <tr key={com.id} className="border-b border-slate-50 text-slate-750 font-medium hover:bg-vibrant-light/10">
                          <td className="py-3 pr-4 font-bold text-slate-900 max-w-[150px] truncate">{com.articleTitle}</td>
                          <td className="py-3 pr-4 font-semibold text-vibrant-dark">{com.authorName}</td>
                          <td className="py-3 pr-4 font-semibold text-slate-500">{com.authorEmail || "—"}</td>
                          <td className="py-3 pr-4 text-slate-600 max-w-sm leading-relaxed">{com.content}</td>
                          <td className="py-3 pr-4 text-slate-400 text-[10px]">{new Date(com.createdAt).toLocaleDateString("id-ID")}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteComment(com.id)}
                              className="bg-red-100 hover:bg-red-200 text-red-600 p-1.5 rounded transition-all cursor-pointer"
                              title="Hapus Komentar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ADMINS MANAGEMENT */}
        {activeTab === "admins" && user.role === "superadmin" && (
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-black text-slate-900 uppercase">Kelola Hak Akses Admin (Gmail)</h1>

            {/* Add New Admin Form */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase">Daftarkan Gmail Admin Baru</h3>
              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
                <div className="flex flex-col gap-1 md:col-span-1.5">
                  <label className="font-bold text-slate-700">Email Gmail Terdaftar *</label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: adminjember@gmail.com"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:border-vibrant-primary focus:ring-1 focus:ring-vibrant-primary"
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-1.5">
                  <label className="font-bold text-slate-700">Nama Lengkap Penulis *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rendra Gunawan"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:border-vibrant-primary focus:ring-1 focus:ring-vibrant-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Peran Akses *</label>
                  <select
                    value={adminForm.role}
                    onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value as any })}
                    className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:border-vibrant-primary focus:ring-1 focus:ring-vibrant-primary bg-white font-semibold"
                  >
                    <option value="admin">Admin (Tulis & Review)</option>
                    <option value="superadmin">Superadmin (Publish & Kontrol)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-vibrant-primary hover:bg-vibrant-secondary text-white font-bold py-2.5 px-4 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </form>
            </div>

            {/* Admins Table */}
            {loadingAdmins ? (
              <p className="text-xs text-slate-500">Memuat akses admin...</p>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                        <th className="py-2.5">Email Google</th>
                        <th className="py-2.5">Nama Admin</th>
                        <th className="py-2.5">Peran</th>
                        <th className="py-2.5">Ditambahkan Oleh</th>
                        <th className="py-2.5">Pada Tanggal</th>
                        <th className="py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((adm) => (
                        <tr key={adm.email} className="border-b border-slate-50 text-slate-700 font-medium hover:bg-vibrant-light/5">
                          <td className="py-3 pr-4 font-bold text-slate-900">{adm.email}</td>
                          <td className="py-3 pr-4 font-semibold">{adm.name}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              adm.role === "superadmin" ? "bg-vibrant-light text-vibrant-primary" : "bg-blue-100 text-blue-700"
                            }`}>
                              {adm.role}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-400">{adm.addedBy}</td>
                          <td className="py-3 pr-4 text-slate-400 text-[10px]">
                            {new Date(adm.addedAt).toLocaleDateString("id-ID")}
                          </td>
                          <td className="py-3 text-right">
                            {adm.email !== "aann37501@gmail.com" && adm.email !== "aan347346@gmail.com" ? (
                              <button
                                onClick={() => handleDeleteAdmin(adm.email)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded transition-all cursor-pointer"
                                title="Hapus Admin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-vibrant-primary font-bold italic">Utama</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: WEBSITE SETTINGS */}
        {activeTab === "settings" && user.role === "superadmin" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
            <h1 className="text-2xl font-black text-slate-900 uppercase">Pengaturan Layout Portal Berita</h1>

            <form onSubmit={handleUpdateSettingsSubmit} className="flex flex-col gap-5 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Nama Website Portal berita *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.websiteTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, websiteTitle: e.target.value })}
                    className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:ring-1 focus:ring-vibrant-primary focus:border-vibrant-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Nomor WhatsApp Admin / Pengaduan *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.whatsappAdmin}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappAdmin: e.target.value })}
                    className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:ring-1 focus:ring-vibrant-primary focus:border-vibrant-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Email Kantor Redaksi *</label>
                  <input
                    type="email"
                    required
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:ring-1 focus:ring-vibrant-primary focus:border-vibrant-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Alamat Kantor Redaksi *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:ring-1 focus:ring-vibrant-primary focus:border-vibrant-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Tautan YouTube Channel</label>
                  <input
                    type="url"
                    value={settingsForm.youtube}
                    onChange={(e) => setSettingsForm({ ...settingsForm, youtube: e.target.value })}
                    className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:ring-1 focus:ring-vibrant-primary focus:border-vibrant-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Tautan Facebook Page</label>
                  <input
                    type="url"
                    value={settingsForm.facebook}
                    onChange={(e) => setSettingsForm({ ...settingsForm, facebook: e.target.value })}
                    className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:ring-1 focus:ring-vibrant-primary focus:border-vibrant-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Tautan Instagram Page</label>
                  <input
                    type="url"
                    value={settingsForm.instagram}
                    onChange={(e) => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                    className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:ring-1 focus:ring-vibrant-primary focus:border-vibrant-primary"
                  />
                </div>
              </div>

              {/* Running text marquee editing */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Teks Berita Berjalan / Running Text Marquee (Gunakan pembatas •)</label>
                <textarea
                  rows={3}
                  value={settingsForm.runningText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, runningText: e.target.value })}
                  className="p-3 border border-vibrant-border rounded-lg focus:outline-none focus:ring-1 focus:ring-vibrant-primary focus:border-vibrant-primary text-xs font-semibold leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="self-end bg-vibrant-primary hover:bg-vibrant-secondary text-white font-extrabold py-2 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow shadow-vibrant-light transition-colors"
              >
                <Save className="w-4 h-4" /> Simpan Pengaturan Website
              </button>
            </form>
          </div>
        )}

        {/* TAB 7: GOOGLE DRIVE CLOUD */}
        {activeTab === "drive" && (
          <GoogleDriveTab
            user={user}
            articles={articles}
            onRefreshArticles={async () => {
              await fetchArticles();
              await fetchDashboardData();
            }}
            setActiveTab={setActiveTab}
            setArticleForm={setArticleForm}
            setEditingArticleId={setEditingArticleId}
          />
        )}

      </main>
    </div>
  );
}
