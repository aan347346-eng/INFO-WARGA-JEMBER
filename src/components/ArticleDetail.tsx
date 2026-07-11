import React, { useState, useEffect } from "react";
import { 
  Clock, Eye, MessageSquare, MapPin, Share2, ArrowLeft, Send, 
  CheckCircle2, Copy, Check, MessageCircle, Facebook, Send as TelegramIcon 
} from "lucide-react";
import { Article, Comment, WebSettings } from "../types";

interface ArticleDetailProps {
  articleId: string;
  settings: WebSettings;
  user: any;
  onBack: () => void;
  onSelectArticle: (id: string) => void;
  articles: Article[]; // For related news
  onTriggerLogin: () => void;
}

export default function ArticleDetail({
  articleId,
  settings,
  user,
  onBack,
  onSelectArticle,
  articles,
  onTriggerLogin,
}: ArticleDetailProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load article details and comments, track view count
  useEffect(() => {
    const fetchArticleAndComments = async () => {
      setLoading(true);
      try {
        // Track the view count first (simulate or API route)
        await fetch("/api/stats/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId,
            category: article?.category || "pemerintahan",
            isNewVisit: !sessionStorage.getItem(`visited_${articleId}`),
            browser: getBrowserName()
          })
        });
        sessionStorage.setItem(`visited_${articleId}`, "true");

        // Fetch Article
        const artRes = await fetch(`/api/articles/${articleId}`);
        if (artRes.ok) {
          const artData = await artRes.json();
          setArticle(artData);
        }

        // Fetch Comments
        const comRes = await fetch(`/api/comments?articleId=${articleId}`);
        if (comRes.ok) {
          const comData = await comRes.json();
          setComments(comData);
        }
      } catch (e) {
        console.error("Error loading article details", e);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleAndComments();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [articleId]);

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Firefox")) return "Firefox";
    return "Others";
  };

  const handleShareCopy = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const nameToSubmit = user ? user.name : commentName.trim();
    const emailToSubmit = user ? user.email : commentEmail.trim();

    if (!nameToSubmit) {
      alert("Silakan masukkan nama Anda untuk berkontribusi komentar.");
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          authorName: nameToSubmit,
          authorEmail: emailToSubmit,
          content: newComment.trim()
        }),
      });

      if (res.ok) {
        const addedComment = await res.json();
        setComments([addedComment, ...comments]);
        setNewComment("");
        if (!user) {
          setCommentName("");
          setCommentEmail("");
        }
      }
    } catch (e) {
      console.error("Failed to post comment", e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const parseImage = (url: string) => {
    if (!url) return "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=60";
    const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?#]+)/) || url.match(/id=([^&]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
    return url;
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " WIB";
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-vibrant-light border-t-vibrant-primary rounded-full animate-spin"></div>
        <span className="text-sm text-vibrant-dark font-bold">Memuat artikel...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <span className="text-vibrant-accent text-lg font-bold">Artikel Tidak Ditemukan</span>
        <button 
          onClick={onBack}
          className="bg-vibrant-primary hover:bg-vibrant-secondary text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Find related articles (same category, up to 3)
  const relatedArticles = articles
    .filter(a => a.status === "publish" && a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  const shareText = encodeURIComponent(`Baca berita terkini Jember: ${article.title}`);
  const shareUrl = encodeURIComponent(window.location.href);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-vibrant-secondary hover:text-vibrant-dark bg-vibrant-light/85 hover:bg-vibrant-light py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm border border-vibrant-border"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Kanal Utama
        </button>
      </div>

      {/* Main Article Container */}
      <article className="bg-white rounded-2xl border border-vibrant-border shadow-md overflow-hidden p-6 md:p-8 flex flex-col gap-6">
        
        {/* Badges & Meta Info */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-vibrant-primary text-white px-3 py-1 rounded-full text-xs uppercase font-black tracking-wider shadow-xs">
            {article.category}
          </span>
          {article.kecamatan && (
            <span className="bg-vibrant-secondary text-vibrant-light px-3 py-1 rounded-full text-xs font-black tracking-wider flex items-center gap-1 shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-vibrant-accent" />
              Kec. {article.kecamatan}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3.5xl font-black text-vibrant-dark leading-tight tracking-tight">
          {article.title}
        </h1>

        {/* Meta Stats Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-semibold border-y border-vibrant-light py-3">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-vibrant-primary" />
            <span>Diterbitkan: {formatDate(article.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-vibrant-primary" />
            <span>Dilihat: {article.views} kali</span>
          </div>
          <div>
            <span>Penulis: <span className="text-vibrant-secondary font-bold">{article.authorName}</span></span>
          </div>
        </div>

        {/* Social Media Sharing Panel */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-vibrant-light/20 p-3 rounded-xl border border-vibrant-border text-xs font-bold text-slate-800">
          <span>Bagikan berita ini:</span>
          <div className="flex items-center gap-2">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              title="Bagikan ke WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              title="Bagikan ke Facebook"
            >
              <Facebook className="w-4 h-4" />
              <span className="hidden sm:inline">Facebook</span>
            </a>
            {/* Telegram */}
            <a
              href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              title="Bagikan ke Telegram"
            >
              <TelegramIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Telegram</span>
            </a>
            {/* Copy Link */}
            <button
              onClick={handleShareCopy}
              className="p-2 bg-vibrant-primary hover:bg-vibrant-secondary text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs font-bold"
              title="Salin Tautan"
            >
              {copied ? <Check className="w-4 h-4 text-vibrant-light" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "Disalin!" : "Salin Link"}</span>
            </button>
          </div>
        </div>

        {/* Featured Image */}
        <div className="w-full overflow-hidden rounded-2xl border border-vibrant-border bg-vibrant-light/10 max-h-[480px]">
          <img
            src={parseImage(article.image)}
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Excerpt Block */}
        <div className="border-l-4 border-vibrant-primary pl-4 py-2 italic text-slate-700 font-semibold text-sm md:text-base bg-vibrant-light/20 rounded-r-lg">
          Jember — {article.excerpt}
        </div>

        {/* Article Body Content */}
        <div 
          className="prose prose-pink max-w-none text-slate-800 text-sm md:text-base leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

      </article>

      {/* Recommendations / Berita Terkait */}
      {relatedArticles.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-black text-vibrant-primary italic uppercase tracking-tighter border-b border-vibrant-light pb-2">
            Rekomendasi Berita Terkait
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => onSelectArticle(art.id)}
                className="bg-white border border-vibrant-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col"
              >
                <div className="aspect-[16/10] bg-vibrant-light/10 overflow-hidden">
                  <img
                    src={parseImage(art.image)}
                    alt={art.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3 flex flex-col gap-1.5 flex-grow justify-between">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-vibrant-primary transition-colors leading-snug">
                    {art.title}
                  </h4>
                  <span className="text-[9px] font-bold text-vibrant-accent uppercase">
                    {art.category} {art.kecamatan ? `• Kec. ${art.kecamatan}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white rounded-2xl border border-vibrant-border shadow-md p-6 md:p-8 flex flex-col gap-6">
        <h3 className="text-lg font-black text-vibrant-primary uppercase tracking-tight border-b border-vibrant-light pb-2 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-vibrant-accent animate-pulse" />
          Komentar Publik ({comments.length})
        </h3>

        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="flex flex-col gap-4">
          {!user ? (
            <div className="bg-vibrant-light/40 border border-vibrant-border p-3 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs text-slate-700 font-semibold text-center sm:text-left">
                Masuk dengan akun Google untuk memberi komentar secara resmi & aman dengan identitas terverifikasi.
              </span>
              <button
                type="button"
                onClick={onTriggerLogin}
                className="bg-vibrant-primary hover:bg-vibrant-secondary text-white font-extrabold text-[11px] px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Login dengan Google
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-vibrant-dark bg-vibrant-light/40 p-2.5 rounded-lg border border-vibrant-border font-bold">
              <CheckCircle2 className="w-4 h-4 text-vibrant-primary shrink-0" />
              <span>Komentar sebagai: <span className="text-vibrant-dark">{user.name}</span> ({user.email})</span>
              <span className="text-[9px] bg-vibrant-primary text-white px-1.5 py-0.5 rounded font-extrabold ml-auto shadow-xs">Verifikasi Google</span>
            </div>
          )}

          {/* Anonymous / Public Manual Inputs if NOT logged in */}
          {!user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 text-xs">
                <label className="font-bold text-slate-700">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:border-vibrant-primary focus:ring-1 focus:ring-vibrant-primary text-xs bg-white"
                />
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <label className="font-bold text-slate-700">Alamat Email (Opsional)</label>
                <input
                  type="email"
                  placeholder="Contoh: budi@gmail.com"
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  className="px-3 py-2 border border-vibrant-border rounded-lg focus:outline-none focus:border-vibrant-primary focus:ring-1 focus:ring-vibrant-primary text-xs bg-white"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 text-xs">
            <label className="font-bold text-slate-700">Tulis Komentar Anda *</label>
            <textarea
              required
              rows={4}
              placeholder="Berikan tanggapan, usulan, atau kritik membangun terkait berita ini..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="p-3 border border-vibrant-border rounded-xl focus:outline-none focus:border-vibrant-primary focus:ring-1 focus:ring-vibrant-primary text-xs leading-relaxed bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={submittingComment}
            className="self-end bg-vibrant-primary hover:bg-vibrant-secondary text-white font-bold text-xs py-2 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            {submittingComment ? "Mengirim..." : "Kirim Komentar"}
          </button>
        </form>

        {/* Comments Feed List */}
        <div className="flex flex-col gap-4 mt-4 border-t border-vibrant-light pt-6">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center italic py-4">
              Belum ada komentar publik untuk berita ini. Jadilah yang pertama memberikan tanggapan!
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((com) => (
                <div 
                  key={com.id}
                  className="bg-vibrant-light/10 border border-vibrant-border p-4 rounded-xl flex flex-col gap-2 shadow-xs"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-vibrant-dark">
                        {com.authorName}
                      </span>
                      {com.authorEmail && com.authorEmail.includes("@") && (
                        <span className="bg-vibrant-light text-vibrant-secondary text-[8px] font-extrabold px-1.5 rounded-full flex items-center gap-0.5">
                          ✔ Terverifikasi
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {formatDate(com.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {com.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
