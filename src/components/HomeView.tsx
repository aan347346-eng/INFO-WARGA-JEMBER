import { useState, useEffect } from "react";
import { 
  Clock, Eye, MessageSquare, MapPin, ArrowRight, Bell, 
  Share2, ChevronRight, Bookmark, ThumbsUp, AlertCircle, Video 
} from "lucide-react";
import { Article, Comment, WebSettings, CATEGORIES } from "../types";

interface HomeViewProps {
  articles: Article[];
  settings: WebSettings;
  currentCategory: string;
  selectedKecamatan: string | null;
  searchQuery: string;
  onSelectArticle: (id: string) => void;
  setCategory: (cat: string) => void;
  setKecamatan: (kec: string | null) => void;
}

export default function HomeView({
  articles,
  settings,
  currentCategory,
  selectedKecamatan,
  searchQuery,
  onSelectArticle,
  setCategory,
  setKecamatan,
}: HomeViewProps) {
  const [notificationStatus, setNotificationStatus] = useState<"unsubscribed" | "subscribed">(() => {
    return (localStorage.getItem("news_subscribed") as any) || "unsubscribed";
  });
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  // Filter articles based on active tabs
  let displayArticles = articles.filter(a => a.status === "publish");

  // Get Popular Articles
  const popularArticles = [...displayArticles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // If there's a search query or category or kecamatan, filter them
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    displayArticles = displayArticles.filter(
      a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
    );
  } else if (selectedKecamatan) {
    displayArticles = displayArticles.filter(
      a => a.kecamatan?.toLowerCase() === selectedKecamatan.toLowerCase()
    );
  } else if (currentCategory && currentCategory !== "beranda") {
    displayArticles = displayArticles.filter(
      a => a.category.toLowerCase() === currentCategory.toLowerCase()
    );
  }

  const handleSubscribeNotifications = () => {
    if (notificationStatus === "unsubscribed") {
      // Simulate browser push notification permission request
      if ("Notification" in window) {
        Notification.requestPermission().then((permission) => {
          setNotificationStatus("subscribed");
          localStorage.setItem("news_subscribed", "subscribed");
          setShowNotificationToast(true);
          setTimeout(() => setShowNotificationToast(false), 4000);
          
          if (permission === "granted") {
            new window.Notification("Info Warga Jember", {
              body: "Terima kasih! Anda akan menerima update berita Jember terbaru secara real-time.",
              icon: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=128"
            });
          }
        });
      } else {
        setNotificationStatus("subscribed");
        localStorage.setItem("news_subscribed", "subscribed");
        setShowNotificationToast(true);
        setTimeout(() => setShowNotificationToast(false), 4000);
      }
    } else {
      setNotificationStatus("unsubscribed");
      localStorage.setItem("news_subscribed", "unsubscribed");
    }
  };

  // Convert Google Drive public link if any
  const parseImage = (url: string) => {
    if (!url) return "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=60";
    const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?#]+)/) || url.match(/id=([^&]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
    return url;
  };

  // Format date readable
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " WIB";
  };

  // Get active category display name
  const activeCategoryName = CATEGORIES.find(c => c.id === currentCategory)?.name || "Berita";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-8">
      
      {/* Toast Notification for Subscription */}
      {showNotificationToast && (
        <div className="fixed bottom-5 right-5 bg-vibrant-secondary border-2 border-vibrant-primary text-white rounded-xl shadow-2xl p-4 max-w-sm flex gap-3 items-start z-50 animate-bounce">
          <Bell className="w-5 h-5 text-vibrant-light shrink-0 mt-0.5" />
          <div className="flex flex-col text-xs">
            <span className="font-bold text-sm">Notifikasi Aktif!</span>
            <span>Anda kini berlangganan berita penting seputar Jember. Kami akan mengabari saat berita terbit.</span>
          </div>
        </div>
      )}
 
      {/* Hero Header Channel Info */}
      {selectedKecamatan && (
        <div className="bg-gradient-to-r from-vibrant-secondary to-vibrant-dark text-white p-6 rounded-2xl shadow-md border-b-4 border-vibrant-primary">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-vibrant-light text-xs font-extrabold uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-vibrant-accent" />
              Kecamatan Hub
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              Kanal Berita Kecamatan {selectedKecamatan}
            </h2>
            <p className="text-sm text-vibrant-light/90 mt-1 max-w-xl">
              Menampilkan seluruh laporan warga, agenda pembangunan, peristiwa lokal, dan profil masyarakat di wilayah Kecamatan {selectedKecamatan}, Kabupaten Jember.
            </p>
          </div>
        </div>
      )}
 
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: News Feed (8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Channel Name */}
          <div className="flex justify-between items-center border-b-2 border-vibrant-primary pb-2">
            <h3 className="text-lg font-black text-vibrant-dark uppercase tracking-tight flex items-center gap-2">
              <span className="bg-vibrant-primary text-white px-2 py-0.5 rounded text-xs">Kanal</span>
              {searchQuery ? `Hasil Pencarian: "${searchQuery}"` : selectedKecamatan ? `Kecamatan ${selectedKecamatan}` : activeCategoryName}
            </h3>
            <span className="text-xs font-bold text-vibrant-accent">
              {displayArticles.length} Berita ditemukan
            </span>
          </div>
 
          {/* If No Articles */}
          {displayArticles.length === 0 ? (
            <div className="bg-vibrant-light/40 border border-vibrant-border rounded-2xl p-12 text-center flex flex-col items-center gap-3">
              <AlertCircle className="w-12 h-12 text-vibrant-accent" />
              <h4 className="font-black text-vibrant-dark text-lg">Belum Ada Berita</h4>
              <p className="text-xs text-vibrant-secondary max-w-md font-medium">
                Maaf, saat ini belum ada berita yang diterbitkan untuk kategori atau filter yang Anda pilih. Silakan kembali lagi nanti atau cari topik lainnya.
              </p>
              <button 
                onClick={() => { setCategory("beranda"); setKecamatan(null); }}
                className="mt-2 bg-vibrant-primary hover:bg-vibrant-secondary text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                Kembali ke Beranda
              </button>
            </div>
          ) : (
            <>
              {/* If on home and no active filter, show large featured hero article */}
              {currentCategory === "beranda" && !selectedKecamatan && !searchQuery && (
                <div 
                  onClick={() => onSelectArticle(displayArticles[0].id)}
                  className="bg-white rounded-2xl overflow-hidden border border-vibrant-border shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden relative">
                    <img 
                      src={parseImage(displayArticles[0].image)} 
                      alt={displayArticles[0].title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-vibrant-primary text-white px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider shadow">
                        {displayArticles[0].category}
                      </span>
                      {displayArticles[0].kecamatan && (
                        <span className="bg-vibrant-secondary text-vibrant-light px-3 py-1 rounded-full text-[10px] font-black tracking-wider shadow flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-vibrant-accent" />
                          Kec. {displayArticles[0].kecamatan}
                        </span>
                      )}
                    </div>
                    {displayArticles[0].category === "video" && (
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <span className="bg-red-600 text-white p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                          <Video className="w-8 h-8 fill-current" />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col gap-3">
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-vibrant-primary" />
                        {formatDate(displayArticles[0].createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-vibrant-primary" />
                        {displayArticles[0].views} kali dilihat
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-vibrant-dark group-hover:text-vibrant-primary transition-colors leading-tight">
                      {displayArticles[0].title}
                    </h2>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {displayArticles[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-vibrant-light text-xs">
                      <span className="text-slate-800 font-bold">
                        Oleh: <span className="text-vibrant-primary font-black">{displayArticles[0].authorName}</span>
                      </span>
                      <span className="text-vibrant-primary font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Baca Selengkapnya <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Feed List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(currentCategory === "beranda" && !selectedKecamatan && !searchQuery ? displayArticles.slice(1) : displayArticles).map((art) => (
                  <div 
                    key={art.id}
                    onClick={() => onSelectArticle(art.id)}
                    className="bg-white rounded-xl border border-vibrant-border border-l-4 border-vibrant-accent shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col overflow-hidden"
                  >
                    <div className="aspect-[16/10] overflow-hidden relative bg-vibrant-light/20">
                      <img 
                        src={parseImage(art.image)} 
                        alt={art.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="bg-vibrant-primary text-white px-2.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shadow-sm">
                          {art.category}
                        </span>
                        {art.kecamatan && (
                          <span className="bg-vibrant-secondary text-vibrant-light px-2 py-0.5 rounded text-[9px] font-bold tracking-wider shadow-sm flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 text-vibrant-accent" />
                            {art.kecamatan}
                          </span>
                        )}
                      </div>
                      {art.category === "video" && (
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <span className="bg-red-600 text-white p-2.5 rounded-full shadow-md">
                            <Video className="w-5 h-5 fill-current" />
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-2 flex-grow justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-vibrant-accent" />
                            {formatDate(art.createdAt)}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3 text-vibrant-accent" />
                            {art.views} views
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-vibrant-primary transition-colors line-clamp-2 leading-snug">
                          {art.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                          {art.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-vibrant-light pt-2.5 mt-2 text-[11px]">
                        <span className="text-slate-600 font-medium truncate max-w-[120px]">
                          Oleh: <span className="font-bold text-vibrant-primary">{art.authorName}</span>
                        </span>
                        <span className="text-vibrant-primary font-bold flex items-center gap-0.5 hover:underline">
                          Baca <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>

        {/* Right Side: Sidebar (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Notification Opt-in Box */}
          <div className="bg-white rounded-2xl p-5 border border-vibrant-border shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-vibrant-primary animate-swing" />
              <h4 className="font-extrabold text-sm text-vibrant-dark uppercase tracking-tight">
                Langganan Berita Jember
              </h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
              Dapatkan pemberitahuan langsung di perangkat Anda setiap kali ada pengumuman atau berita penting Jember yang diterbitkan redaksi.
            </p>
            <button
              onClick={handleSubscribeNotifications}
              className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                notificationStatus === "subscribed"
                  ? "bg-vibrant-secondary text-vibrant-light hover:bg-vibrant-dark"
                  : "bg-vibrant-primary text-white hover:bg-vibrant-secondary"
              }`}
            >
              {notificationStatus === "subscribed" ? "✔ Berlangganan Aktif" : "🔔 Aktifkan Notifikasi"}
            </button>
          </div>

          {/* Popular Articles Widget */}
          <div className="bg-white rounded-2xl border border-vibrant-border shadow-sm p-5 flex flex-col gap-4">
            <h4 className="font-black text-sm text-vibrant-primary italic uppercase tracking-tighter border-b border-vibrant-light pb-2 flex items-center justify-between">
              <span>Terpopuler Hari Ini</span>
              <span className="text-[10px] bg-vibrant-light text-vibrant-primary px-2 py-0.5 rounded font-bold not-italic">Jember</span>
            </h4>
            <div className="flex flex-col gap-4">
              {popularArticles.map((art, index) => (
                <div 
                  key={art.id}
                  onClick={() => onSelectArticle(art.id)}
                  className="flex gap-3 cursor-pointer group"
                >
                  <div className="text-3xl font-black text-vibrant-border group-hover:text-vibrant-primary transition-colors w-8 shrink-0 flex items-start justify-center pt-1 italic">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider text-vibrant-secondary">
                      {art.category} {art.kecamatan ? `• Kec. ${art.kecamatan}` : ""}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800 group-hover:text-vibrant-primary transition-colors line-clamp-2 leading-snug">
                      {art.title}
                    </h5>
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" /> {art.views} views
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* District Quick Search Map Widget */}
          <div className="bg-white rounded-2xl border border-vibrant-border shadow-sm p-5 flex flex-col gap-3">
            <h4 className="font-black text-sm text-vibrant-primary italic uppercase tracking-tighter border-b border-vibrant-light pb-2">
              Kecamatan Terpopuler
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {["Kaliwates", "Sumbersari", "Patrang", "Ambulu", "Puger", "Tanggul", "Balung", "Silo"].map((kec) => (
                <button
                  key={kec}
                  onClick={() => { setKecamatan(kec); setCategory("berita-kecamatan"); }}
                  className="bg-vibrant-light hover:bg-white text-vibrant-primary border border-vibrant-border hover:border-vibrant-primary text-[10px] font-bold px-2.5 py-1.5 rounded transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  📍 {kec}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold text-center mt-1">
              Ketuk untuk menyaring berita di kecamatan tersebut.
            </p>
          </div>

          {/* Social Media Widget */}
          <div className="bg-vibrant-primary text-white rounded-2xl p-5 flex flex-col gap-3.5 shadow-md">
            <h4 className="font-black text-xs uppercase tracking-wider text-vibrant-light">
              Ikuti Media Sosial Kami
            </h4>
            <div className="flex flex-col gap-3 text-xs">
              {settings.youtube && (
                <a href={settings.youtube} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 bg-vibrant-secondary rounded-lg hover:bg-vibrant-dark transition-all">
                  <span className="flex items-center gap-2 font-bold text-white">
                    <span className="bg-red-600 p-1 rounded text-white"><Video className="w-3 h-3 fill-current" /></span> Youtube
                  </span>
                  <span className="text-[10px] bg-red-600 px-1.5 py-0.5 rounded font-extrabold text-white">Subscribe</span>
                </a>
              )}
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 bg-vibrant-secondary rounded-lg hover:bg-vibrant-dark transition-all">
                  <span className="flex items-center gap-2 font-bold text-white">
                    <span className="bg-blue-600 p-1 rounded-sm text-white font-extrabold text-xs">f</span> Facebook
                  </span>
                  <span className="text-[10px] text-vibrant-light font-bold">Ikuti</span>
                </a>
              )}
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 bg-vibrant-secondary rounded-lg hover:bg-vibrant-dark transition-all">
                  <span className="flex items-center gap-2 font-bold text-white">
                    <span className="bg-pink-500 p-1 rounded text-white font-extrabold text-xs">📸</span> Instagram
                  </span>
                  <span className="text-[10px] text-vibrant-light font-bold">Ikuti</span>
                </a>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
