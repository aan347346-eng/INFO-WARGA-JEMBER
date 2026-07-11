import { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomeView from "./components/HomeView";
import ArticleDetail from "./components/ArticleDetail";
import CmsLogin from "./components/CmsLogin";
import CmsDashboard from "./components/CmsDashboard";
import { Article, WebSettings } from "./types";
import { BellRing, ShieldCheck, X } from "lucide-react";

export default function App() {
  const [view, setView] = useState<"home" | "article-detail" | "cms-login" | "cms-dashboard">("home");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  
  // Navigation filters
  const [currentCategory, setCategory] = useState<string>("beranda");
  const [selectedKecamatan, setKecamatan] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data
  const [settings, setSettings] = useState<WebSettings>({
    websiteTitle: "INFO WARGA JEMBER",
    address: "Jl. Bengawan Solo No. 12, Sumbersari, Jember, Jawa Timur 68121",
    email: "info@infowargajember.com",
    youtube: "https://youtube.com/c/InfoWargaJember",
    whatsappAdmin: "081234567890",
    facebook: "https://facebook.com/infowargajember",
    instagram: "https://instagram.com/infowargajember",
    runningText: "Memuat info terkini warga Jember..."
  });
  const [articles, setArticles] = useState<Article[]>([]);

  // User Auth session state
  const [user, setUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Real-time news flash notifications
  const [latestNotification, setLatestNotification] = useState<{ title: string; id: string } | null>(null);

  // Fetch initial configuration and published articles
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        
        // Push notification simulation: check if we have new published articles
        if (articles.length > 0 && data.length > articles.length) {
          const newArt = data[0];
          // Check if user is subscribed to news
          if (localStorage.getItem("news_subscribed") === "subscribed") {
            setLatestNotification({ title: newArt.title, id: newArt.id });
            // Browser push notification
            if ("Notification" in window && Notification.permission === "granted") {
              new window.Notification("Berita Jember Baru Terbit!", {
                body: newArt.title,
                icon: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=128"
              });
            }
          }
        }
        setArticles(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchArticles();

    // Fetch articles every 20 seconds to simulate real-time news room alerts
    const interval = setInterval(() => {
      fetchArticles();
    }, 20000);

    return () => clearInterval(interval);
  }, [articles.length]);

  const handleLoginSuccess = (token: string, userData: any) => {
    localStorage.setItem("cms_token", token);
    localStorage.setItem("cms_user", JSON.stringify(userData));
    setUser(userData);
    
    // Redirect appropriately
    if (userData.role === "reader") {
      setView("home");
    } else {
      setView("cms-dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cms_token");
    localStorage.removeItem("cms_user");
    setUser(null);
    setView("home");
  };

  // Navigations
  const handleSelectArticle = (id: string) => {
    setSelectedArticleId(id);
    setView("article-detail");
  };

  const handleNavigateHome = () => {
    setView("home");
    setSelectedArticleId(null);
    setCategory("beranda");
    setKecamatan(null);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-vibrant-light text-slate-800 font-sans flex flex-col justify-between">
      
      {/* Real-time In-app Breaking News Flash Alerts */}
      {latestNotification && (
        <div className="fixed top-24 right-5 bg-white border-2 border-vibrant-primary text-slate-800 rounded-2xl shadow-2xl p-4 max-w-sm flex gap-3 items-start z-50 animate-[slideIn_0.3s_ease-out]">
          <div className="bg-vibrant-light p-2 rounded-xl text-vibrant-primary shrink-0">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex flex-col gap-1 flex-grow">
            <span className="text-[10px] uppercase font-black text-vibrant-primary tracking-wider">BREAKING NEWS</span>
            <span className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">{latestNotification.title}</span>
            <button
              onClick={() => {
                handleSelectArticle(latestNotification.id);
                setLatestNotification(null);
              }}
              className="text-[10px] font-extrabold text-vibrant-primary hover:text-vibrant-secondary hover:underline text-left mt-1"
            >
              Baca Berita Sekarang →
            </button>
          </div>
          <button 
            onClick={() => setLatestNotification(null)}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main View Router */}
      {view === "cms-login" ? (
        <CmsLogin 
          onLoginSuccess={handleLoginSuccess}
          onNavigateHome={handleNavigateHome}
        />
      ) : view === "cms-dashboard" ? (
        <CmsDashboard 
          user={user}
          onLogout={handleLogout}
          onNavigateHome={handleNavigateHome}
          webSettings={settings}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
        />
      ) : (
        <>
          {/* Header navigation (Stays sticky) */}
          <Header 
            settings={settings}
            currentCategory={currentCategory}
            setCategory={setCategory}
            selectedKecamatan={selectedKecamatan}
            setKecamatan={setKecamatan}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            user={user}
            onLogout={handleLogout}
            onNavigateToCms={() => setView("cms-dashboard")}
            onNavigateHome={handleNavigateHome}
          />

          {/* Main Body */}
          <main className="flex-grow">
            {view === "home" ? (
              <HomeView 
                articles={articles}
                settings={settings}
                currentCategory={currentCategory}
                selectedKecamatan={selectedKecamatan}
                searchQuery={searchQuery}
                onSelectArticle={handleSelectArticle}
                setCategory={setCategory}
                setKecamatan={setKecamatan}
              />
            ) : (
              <ArticleDetail 
                articleId={selectedArticleId!}
                settings={settings}
                user={user}
                onBack={() => setView("home")}
                onSelectArticle={handleSelectArticle}
                articles={articles}
                onTriggerLogin={() => setView("cms-login")}
              />
            )}
          </main>

          {/* Footer content */}
          <Footer 
            settings={settings}
            onNavigateToLogin={() => setView("cms-login")}
            user={user}
          />
        </>
      )}
    </div>
  );
}
