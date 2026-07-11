import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Article, Comment, WebSettings, VisitorStats, AdminUser } from "./src/types.js";

// Check if running on Vercel to use the writable /tmp/db.json database path
const IS_VERCEL = typeof process.env.VERCEL !== "undefined";
const DB_PATH = IS_VERCEL 
  ? path.join("/tmp", "db.json") 
  : path.join(process.cwd(), "db.json");

// Helper to read and write database
function readDB() {
  if (IS_VERCEL && !fs.existsSync(DB_PATH)) {
    try {
      const originalPath = path.join(process.cwd(), "db.json");
      if (fs.existsSync(originalPath)) {
        fs.copyFileSync(originalPath, DB_PATH);
      }
    } catch (e) {
      console.error("Error copying db.json to /tmp on Vercel:", e);
    }
  }

  if (!fs.existsSync(DB_PATH)) {
    // Initial Seed Data
    const seedData = {
      settings: {
        websiteTitle: "INFO WARGA JEMBER",
        address: "Jl. Bengawan Solo No. 12, Sumbersari, Jember, Jawa Timur 68121",
        email: "info@infowargajember.com",
        youtube: "https://youtube.com/c/InfoWargaJember",
        whatsappAdmin: "081234567890",
        facebook: "https://facebook.com/infowargajember",
        instagram: "https://instagram.com/infowargajember",
        runningText: "BREAKING NEWS: Pemerintah Kabupaten Jember Membuka Pendaftaran Beasiswa Mahasiswa Prestasi 2026 • Car Free Day Alun-Alun Jember Hadir Kembali Akhir Pekan Ini Mulai Pukul 06.00 WIB • Sukseskan Pilkada Jember Damai 2026 • Festival Budaya Pegon Watu Lo Sukses Menarik Ribuan Wisatawan Domestik!"
      } as WebSettings,
      admins: [
        {
          email: "aan347346@gmail.com",
          name: "Superadmin Jember 1",
          role: "superadmin",
          addedBy: "System",
          addedAt: new Date().toISOString()
        },
        {
          email: "aann37501@gmail.com",
          name: "Superadmin Jember 2",
          role: "superadmin",
          addedBy: "System",
          addedAt: new Date().toISOString()
        }
      ] as AdminUser[],
      articles: [
        {
          id: "art-1",
          title: "Pemkab Jember Resmi Buka Beasiswa Mahasiswa Berprestasi Tahun 2026",
          content: "<p>Pemerintah Kabupaten Jember resmi meluncurkan program Beasiswa Mahasiswa Berprestasi Tahun Anggaran 2026. Program tahunan ini bertujuan untuk membantu putra-putri daerah Jember yang sedang menempuh pendidikan tinggi, baik di dalam maupun di luar Kabupaten Jember.</p><p>Bupati Jember menjelaskan bahwa beasiswa tahun ini difokuskan pada kategori mahasiswa kurang mampu, prestasi akademik, prestasi non-akademik (seperti olahraga dan seni), serta mahasiswa keagamaan (hafidz/hafidzah).</p><p>\"Kami berkomitmen penuh untuk memajukan kualitas sumber daya manusia di Kabupaten Jember. Pendidikan adalah investasi jangka panjang terbaik kita,\" ujar Bupati Jember saat konferensi pers di Pendopo Wahyawibawagraha.</p><p>Pendaftaran dibuka secara daring mulai tanggal 15 Juli 2026 hingga 15 Agustus 2026. Persyaratan lengkap dapat diakses melalui portal resmi Dinas Pendidikan Kabupaten Jember.</p>",
          excerpt: "Kabar gembira untuk mahasiswa asal Jember. Pemkab Jember resmi membuka beasiswa prestasi tahun 2026 untuk berbagai kategori pendaftaran.",
          category: "pemerintahan",
          kecamatan: "Kaliwates",
          image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=60",
          status: "publish",
          views: 342,
          authorName: "Superadmin Jember",
          authorEmail: "aann37501@gmail.com",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
          updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: "art-2",
          title: "Festival Pegon Watu Ulo Ambulu Sedot Perhatian Ribuan Wisatawan",
          content: "<p>Ribuan warga dan wisatawan dari berbagai daerah memadati kawasan Pantai Watu Ulo di Kecamatan Ambulu, Kabupaten Jember, untuk menyaksikan perhelatan tahunan Festival Pegon. Tradisi ini merupakan perayaan masyarakat pesisir selatan Jember sebagai ungkapan syukur sekaligus atraksi wisata budaya yang memikat.</p><p>Festival ini menampilkan belasan pegon (gerobak sapi tradisional Jawa) yang dihias dengan aneka janur, hasil bumi, dan hiasan khas. Para pemilik pegon mengenakan pakaian adat Jawa-Madura (Pandalungan) seraya mengarak pegon menyusuri pantai.</p><p>Plt Kepala Dinas Pariwisata Jember menyatakan bahwa pariwisata berbasis budaya di Jember selatan seperti Festival Pegon akan terus didorong masuk dalam kalender event nasional karena keunikan budaya lokalnya.</p><p>Selain pawai pegon, pengunjung juga disuguhi pertunjukan seni tradisional reog, tari daerah, dan sajian kuliner khas ikan bakar pesisir Ambulu.</p>",
          excerpt: "Kemeriahan tradisi budaya pesisir selatan Jember kembali hadir. Festival Pegon Watu Ulo sukses menarik kedatangan ribuan wisatawan lokal maupun mancanegara.",
          category: "wisata-kuliner",
          kecamatan: "Ambulu",
          image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=60",
          status: "publish",
          views: 489,
          authorName: "Superadmin Jember",
          authorEmail: "aann37501@gmail.com",
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
          updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          id: "art-3",
          title: "Lalin Gunung Gumitir Silo Sempat Macet Total Akibat Truk Mogok di Tikungan Mbah Lanang",
          content: "<p>Jalur utama Jember-Banyuwangi melalui Gunung Gumitir, Kecamatan Silo, sempat mengalami kemacetan lalu lintas total pada Jumat dini hari akibat sebuah truk tronton bermuatan semen mengalami kerusakan mesin tepat di tikungan tajam legendaris Mbah Lanang.</p><p>Truk bernomor polisi P 9823 UY tersebut mogok dalam posisi melintang yang menutup hampir seluruh badan jalan raya nasional tersebut.</p><p>Aparat Polsek Silo bersama relawan Gumitir segera diterjunkan ke lokasi untuk melakukan rekayasa lalu lintas dengan sistem buka-tutup satu arah secara bergantian guna mengurai kemacetan kendaraan yang sempat mengekor hingga beberapa kilometer di kedua arah.</p><p>\"Proses evakuasi truk memakan waktu sekitar tiga jam karena membutuhkan kendaraan derek khusus dari Jember kota,\" tutur Kanit Lantas Polsek Silo.</p><p>Lalu lintas baru kembali normal sepenuhnya menjelang pukul 08.00 WIB setelah truk berhasil dievakuasi ke bahu jalan yang lebih aman.</p>",
          excerpt: "Kemacetan parah melanda jalur Gumitir Silo akibat truk tronton mogok tepat di tikungan tajam. Polisi terapkan sistem buka-tutup lalu lintas.",
          category: "peristiwa",
          kecamatan: "Silo",
          image: "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?w=800&auto=format&fit=crop&q=60",
          status: "publish",
          views: 651,
          authorName: "Ahmad S.",
          authorEmail: "ahmads@infowargajember.com",
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
          updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id: "art-4",
          title: "Persid Jember Targetkan Juara Grup di Liga 3 Jawa Timur Musim Ini",
          content: "<p>Manajemen Persid Jember (Persatuan Sepakbola Indonesia Djember) menaruh optimisme tinggi menjelang bergulirnya kompetisi kasta ketiga sepak bola nasional wilayah Jawa Timur musim ini. Klub berjuluk Macan Raung tersebut menargetkan lolos fase grup dengan menyapu bersih poin penuh pada laga-laga kandang.</p><p>Pelatih kepala Persid mengutarakan bahwa persiapan fisik dan taktikal skuad asuhannya sudah berjalan intensif selama dua bulan terakhir di Stadion Jember Sport Garden (JSG), Ajung.</p><p>\"Kami memiliki komposisi tim yang solid, perpaduan pemain senior berpengalaman dan talenta muda berbakat asli Jember. Dukungan fanatik suporter Berni (Jember Mania) di stadion akan menjadi motivasi ekstra bagi kami,\" ujarnya.</p><p>Laga perdana Persid dijadwalkan menjamu Persipro Probolinggo di JSG pada akhir pekan mendatang.</p>",
          excerpt: "Optimisme tinggi membayangi Persid Jember jelang gelaran Liga 3 Jatim. Manajemen targetkan Macan Raung menyapu bersih laga kandang.",
          category: "olahraga",
          kecamatan: "Ajung",
          image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60",
          status: "publish",
          views: 215,
          authorName: "Berni Jember",
          authorEmail: "berni@infowargajember.com",
          createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 18).toISOString()
        },
        {
          id: "art-5",
          title: "Mencicipi Kelezatan Gudeg Jember yang Khas dan Manis Gurih di Sumbersari",
          content: "<p>Bagi para pencinta wisata kuliner yang sedang berkunjung ke Jember, rasanya belum lengkap bila belum mencicipi hidangan legendaris Gudeg Jember yang berlokasi di kawasan kampus Sumbersari.</p><p>Berbeda dengan gudeg Yogyakarta yang cenderung sangat manis, Gudeg Jember menyajikan sensasi rasa yang lebih gurih-manis yang disesuaikan dengan selera lidah masyarakat Jember Timur. Seporsi gudeg di sini disajikan lengkap dengan nasi hangat, sayur nangka (krecek pedas), suwiran ayam kampung, telur bacem, dan sambal khas Jember yang menggugah selera.</p><p>\"Warung kami sudah berdiri sejak tahun 1995. Rahasia kelezatan kami terletak pada bumbu tradisional yang dimasak perlahan di atas tungku arang kayu,\" ujar pemilik warung legendaris tersebut.</p><p>Warung gudeg ini buka setiap hari dari pukul 06.00 hingga 14.00 WIB dan selalu ramai dipadati oleh kalangan mahasiswa maupun pegawai perkantoran setempat.</p>",
          excerpt: "Gudeg Jember menyajikan cita rasa gurih manis pandalungan yang istimewa. Cocok untuk sarapan pagi maupun makan siang para pemburu kuliner.",
          category: "wisata-kuliner",
          kecamatan: "Sumbersari",
          image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60",
          status: "publish",
          views: 512,
          authorName: "Rudi Hartono",
          authorEmail: "rudi@infowargajember.com",
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 48).toISOString()
        }
      ] as Article[],
      comments: [
        {
          id: "com-1",
          articleId: "art-1",
          articleTitle: "Pemkab Jember Resmi Buka Beasiswa Mahasiswa Berprestasi Tahun 2026",
          authorName: "Indra Lesmana",
          authorEmail: "indralesmana@gmail.com",
          content: "Sangat bersyukur dengan adanya beasiswa ini. Semoga pendaftarannya lancar dan transparan sehingga menjangkau adik-adik mahasiswa Jember yang benar-benar membutuhkan.",
          createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
        },
        {
          id: "com-2",
          articleId: "art-3",
          articleTitle: "Lalin Gunung Gumitir Silo Sempat Macet Total Akibat Truk Mogok di Tikungan Mbah Lanang",
          authorName: "Siti Masitoh",
          authorEmail: "sitimasitoh@yahoo.com",
          content: "Waduh, untung tadi pagi ga lewat Gumitir. Jalur ini emang rawan mogok terutama di tikungan tajam, semoga ke depan ada pelebaran jalan di titik-titik rawan.",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ] as Comment[],
      stats: {
        totalVisits: 1420,
        totalPageviews: 3102,
        dailyStats: [
          { date: "2026-07-04", visits: 180, pageviews: 380 },
          { date: "2026-07-05", visits: 210, pageviews: 450 },
          { date: "2026-07-06", visits: 190, pageviews: 410 },
          { date: "2026-07-07", visits: 230, pageviews: 520 },
          { date: "2026-07-08", visits: 260, pageviews: 590 },
          { date: "2026-07-09", visits: 200, pageviews: 452 },
          { date: "2026-07-10", visits: 150, pageviews: 300 }
        ],
        categoryViews: {
          "pemerintahan": 512,
          "wisata-kuliner": 1210,
          "peristiwa": 890,
          "olahraga": 490
        },
        browserStats: {
          "Chrome": 1890,
          "Safari": 640,
          "Firefox": 250,
          "Mobile Chrome": 210,
          "Others": 112
        }
      } as VisitorStats,
      notifications: [
        {
          id: "notif-1",
          message: "Artikel baru 'Lalin Gunung Gumitir...' sedang menunggu persetujuan review.",
          createdAt: new Date().toISOString(),
          read: false
        }
      ] as { id: string; message: string; createdAt: string; read: boolean }[]
    };

    fs.writeFileSync(DB_PATH, JSON.stringify(seedData, null, 2));
    return seedData;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading database file, returning default schema", error);
    return {};
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing to database file", error);
  }
}

// Start Server Setup
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize DB
readDB();

  // Helper middleware for auth checks
  function getAuthenticatedUser(req: express.Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split(" ")[1];
    try {
      // Decode JWT token loosely (this allows our custom mock token logins or real JWT tokens)
      const payloadBase64 = token.split(".")[1];
      if (payloadBase64) {
        const payloadStr = Buffer.from(payloadBase64, "base64").toString("utf-8");
        return JSON.parse(payloadStr);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // API Endpoints

  // Google Login / Verify Endpoint
  app.post("/api/auth/google", (req, res) => {
    const { credential, email: devEmail, name: devName } = req.body;

    let email = "";
    let name = "";
    let picture = "";

    if (credential) {
      try {
        // Try decoding Google JWT Token
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          email = payload.email;
          name = payload.name || payload.email.split("@")[0];
          picture = payload.picture || "";
        } else {
          return res.status(400).json({ message: "Invalid credentials format" });
        }
      } catch (e) {
        return res.status(400).json({ message: "Failed to parse credential" });
      }
    } else if (devEmail) {
      // Developer / Demo mode login
      email = devEmail;
      name = devName || devEmail.split("@")[0];
      picture = `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
    } else {
      return res.status(400).json({ message: "No login credential provided" });
    }

    // Standardize email to lowercase
    email = email.toLowerCase().trim();

    // Look up in our DB admins
    const db = readDB();
    const admin = db.admins.find((a: AdminUser) => a.email.toLowerCase() === email);

    // Determine access role
    let role: "superadmin" | "admin" | "reader" = "reader";
    if (email === "aann37501@gmail.com" || email === "aan347346@gmail.com") {
      role = "superadmin";
    } else if (admin) {
      role = admin.role;
    }

    // Build signed payload as an easy to decode JWT for local development session
    const payload = { email, name, picture, role };
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64");
    const token = `${header}.${body}.signatureplaceholder`;

    res.json({
      token,
      user: payload
    });
  });

  // Track page visit / view counts
  app.post("/api/stats/track", (req, res) => {
    const { category, articleId, browser } = req.body;
    const db = readDB();
    const today = new Date().toISOString().split("T")[0];

    if (!db.stats) {
      db.stats = { totalVisits: 0, totalPageviews: 0, dailyStats: [], categoryViews: {}, browserStats: {} };
    }

    db.stats.totalPageviews += 1;
    if (articleId) {
      const art = db.articles.find((a: Article) => a.id === articleId);
      if (art) art.views += 1;
    }

    // Ensure daily stats array
    let dayStat = db.stats.dailyStats.find((d: any) => d.date === today);
    if (!dayStat) {
      dayStat = { date: today, visits: 0, pageviews: 0 };
      db.stats.dailyStats.push(dayStat);
    }
    dayStat.pageviews += 1;

    // Is it a completely new session?
    const isNewVisit = req.body.isNewVisit;
    if (isNewVisit) {
      db.stats.totalVisits += 1;
      dayStat.visits += 1;
    }

    if (category) {
      db.stats.categoryViews[category] = (db.stats.categoryViews[category] || 0) + 1;
    }

    if (browser) {
      db.stats.browserStats[browser] = (db.stats.browserStats[browser] || 0) + 1;
    }

    writeDB(db);
    res.json({ success: true });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const db = readDB();
    res.json(db.settings);
  });

  app.put("/api/settings", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin can update settings" });
    }

    const db = readDB();
    db.settings = { ...db.settings, ...req.body };
    writeDB(db);
    res.json(db.settings);
  });

  // Backup & Restore Database to/from Google Drive
  app.get("/api/backup/export", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin can export database" });
    }
    const db = readDB();
    res.json(db);
  });

  app.post("/api/backup/restore", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin can restore database" });
    }

    const backupData = req.body;
    if (!backupData || !backupData.articles || !backupData.admins || !backupData.settings) {
      return res.status(400).json({ message: "Invalid backup data schema. Must contain articles, admins and settings." });
    }

    writeDB(backupData);
    res.json({ success: true, message: "Database successfully restored from backup" });
  });

  // Articles Routing
  app.get("/api/articles", (req, res) => {
    const db = readDB();
    const { category, kecamatan, search, status } = req.query;

    let filtered = db.articles;

    // Filter by status (public can only see "publish" status)
    if (status && status !== "all") {
      filtered = filtered.filter((a: Article) => a.status === status);
    } else {
      // By default, if request is from non-admin or no status filter, only return publish
      const user = getAuthenticatedUser(req);
      const isCmsUser = user && (user.role === "superadmin" || user.role === "admin");
      if (!isCmsUser) {
        filtered = filtered.filter((a: Article) => a.status === "publish");
      }
    }

    if (category && category !== "beranda") {
      filtered = filtered.filter((a: Article) => a.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (kecamatan) {
      filtered = filtered.filter((a: Article) => a.kecamatan?.toLowerCase() === (kecamatan as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter((a: Article) => 
        a.title.toLowerCase().includes(q) || 
        a.excerpt.toLowerCase().includes(q) || 
        a.content.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt descending
    filtered.sort((a: Article, b: Article) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(filtered);
  });

  // Get single article
  app.get("/api/articles/:id", (req, res) => {
    const db = readDB();
    const article = db.articles.find((a: Article) => a.id === req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    res.json(article);
  });

  // Create article
  app.post("/api/articles", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
      return res.status(403).json({ message: "Unauthorized. Admin/Superadmin access required." });
    }

    const { title, content, excerpt, category, kecamatan, image, status } = req.body;
    
    // Safety check for publish status
    let finalStatus = status || "draft";
    if (finalStatus === "publish" && user.role !== "superadmin") {
      // Admin cannot publish directly, set to review
      finalStatus = "review";
    }

    const db = readDB();
    const newArticle: Article = {
      id: "art-" + Date.now(),
      title: title || "Untitled Article",
      content: content || "",
      excerpt: excerpt || "",
      category: category || "pemerintahan",
      kecamatan: kecamatan || null,
      image: image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=60",
      status: finalStatus,
      views: 0,
      authorName: user.name,
      authorEmail: user.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.articles.push(newArticle);

    // If status is "review", create a notification for Superadmin
    if (finalStatus === "review") {
      if (!db.notifications) db.notifications = [];
      db.notifications.push({
        id: "notif-" + Date.now(),
        message: `Artikel baru '${newArticle.title}' menunggu persetujuan review dari ${user.name}.`,
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    writeDB(db);
    res.status(201).json(newArticle);
  });

  // Edit article
  app.put("/api/articles/:id", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const db = readDB();
    const index = db.articles.findIndex((a: Article) => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Article not found" });
    }

    const currentArticle = db.articles[index];

    // Access check: Admins can only edit if they are the author, or if they are superadmin
    if (user.role !== "superadmin" && currentArticle.authorEmail !== user.email) {
      return res.status(403).json({ message: "You can only edit your own articles." });
    }

    const { title, content, excerpt, category, kecamatan, image, status } = req.body;
    
    let finalStatus = status !== undefined ? status : currentArticle.status;
    if (finalStatus === "publish" && user.role !== "superadmin") {
      // Force "review" if an admin tries to publish
      finalStatus = "review";
    }

    const updatedArticle: Article = {
      ...currentArticle,
      title: title !== undefined ? title : currentArticle.title,
      content: content !== undefined ? content : currentArticle.content,
      excerpt: excerpt !== undefined ? excerpt : currentArticle.excerpt,
      category: category !== undefined ? category : currentArticle.category,
      kecamatan: kecamatan !== undefined ? kecamatan : currentArticle.kecamatan,
      image: image !== undefined ? image : currentArticle.image,
      status: finalStatus,
      updatedAt: new Date().toISOString()
    };

    db.articles[index] = updatedArticle;

    // Create notification if status changed to review
    if (finalStatus === "review" && currentArticle.status !== "review") {
      if (!db.notifications) db.notifications = [];
      db.notifications.push({
        id: "notif-" + Date.now(),
        message: `Artikel '${updatedArticle.title}' diubah statusnya menjadi Review oleh ${user.name}.`,
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    writeDB(db);
    res.json(updatedArticle);
  });

  // Delete article
  app.delete("/api/articles/:id", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const db = readDB();
    const art = db.articles.find((a: Article) => a.id === req.params.id);
    if (!art) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Admin can only delete their own, Superadmin can delete any
    if (user.role !== "superadmin" && art.authorEmail !== user.email) {
      return res.status(403).json({ message: "You are not authorized to delete this article." });
    }

    db.articles = db.articles.filter((a: Article) => a.id !== req.params.id);
    // Also clear associated comments
    db.comments = db.comments.filter((c: Comment) => c.articleId !== req.params.id);

    writeDB(db);
    res.json({ success: true, message: "Article deleted successfully" });
  });

  // Comments Router
  app.get("/api/comments", (req, res) => {
    const { articleId } = req.query;
    const db = readDB();
    
    let list = db.comments || [];
    if (articleId) {
      list = list.filter((c: Comment) => c.articleId === articleId);
    }
    
    // Sort latest comments first
    list.sort((a: Comment, b: Comment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  });

  app.post("/api/comments", (req, res) => {
    const { articleId, authorName, authorEmail, content } = req.body;
    if (!articleId || !authorName || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const db = readDB();
    const article = db.articles.find((a: Article) => a.id === articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const newComment: Comment = {
      id: "com-" + Date.now(),
      articleId,
      articleTitle: article.title,
      authorName,
      authorEmail: authorEmail || "",
      content,
      createdAt: new Date().toISOString()
    };

    if (!db.comments) db.comments = [];
    db.comments.push(newComment);
    writeDB(db);

    res.status(201).json(newComment);
  });

  app.delete("/api/comments/:id", (req, res) => {
    const user = getAuthenticatedUser(req);
    // Only superadmin can manage/delete comments
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin can delete comments" });
    }

    const db = readDB();
    db.comments = db.comments.filter((c: Comment) => c.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  });

  // Admins List Routing (Superadmin only)
  app.get("/api/admins", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied." });
    }
    const db = readDB();
    res.json(db.admins);
  });

  app.post("/api/admins", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const { email, name, role } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const db = readDB();
    const cleanEmail = email.toLowerCase().trim();

    // Check if already exists
    if (db.admins.find((a: AdminUser) => a.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ message: "Admin already registered." });
    }

    const newAdmin: AdminUser = {
      email: cleanEmail,
      name: name || cleanEmail.split("@")[0],
      role: role || "admin",
      addedBy: user.name,
      addedAt: new Date().toISOString()
    };

    db.admins.push(newAdmin);
    writeDB(db);
    res.status(201).json(newAdmin);
  });

  app.delete("/api/admins/:email", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const emailToDelete = req.params.email.toLowerCase().trim();
    if (emailToDelete === "aann37501@gmail.com") {
      return res.status(400).json({ message: "Cannot delete the main Superadmin account." });
    }

    const db = readDB();
    db.admins = db.admins.filter((a: AdminUser) => a.email.toLowerCase() !== emailToDelete);
    writeDB(db);
    res.json({ success: true, message: "Admin removed successfully." });
  });

  // Notifications for Superadmin
  app.get("/api/notifications", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied." });
    }
    const db = readDB();
    res.json(db.notifications || []);
  });

  app.post("/api/notifications/clear", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied." });
    }
    const db = readDB();
    db.notifications = [];
    writeDB(db);
    res.json({ success: true });
  });

  // Full analytic statistics dashboard
  app.get("/api/dashboard", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const db = readDB();
    
    // Sort all articles by views
    const popularArticles = [...db.articles]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const pendingReviewCount = db.articles.filter((a: Article) => a.status === "review").length;

    res.json({
      stats: db.stats || { totalVisits: 0, totalPageviews: 0, dailyStats: [], categoryViews: {}, browserStats: {} },
      totalArticles: db.articles.length,
      pendingReviewCount,
      popularArticles,
      comments: db.comments || [],
      admins: db.admins || []
    });
  });

// Setup Vite middleware for development or Static serve for production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// Only start the HTTP listener if NOT running in a serverless environment (like Vercel)
if (typeof process.env.VERCEL === "undefined") {
  setupViteOrStatic().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

export default app;
