import React, { useState, useEffect } from "react";
import { 
  HardDrive, Search, Filter, RefreshCw, AlertTriangle, 
  CheckCircle, Download, Upload, FileText, Image as ImageIcon, Folder, 
  Plus, Trash2, ShieldAlert, Settings, ExternalLink
} from "lucide-react";
import { Article } from "../types";

interface GoogleDriveTabProps {
  user: any;
  articles: Article[];
  onRefreshArticles: () => Promise<void>;
  setActiveTab: (tab: any) => void;
  setArticleForm: (form: any) => void;
  setEditingArticleId: (id: string | null) => void;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  content?: string; // For mock file text or json contents
}

export default function GoogleDriveTab({
  user,
  articles,
  onRefreshArticles,
  setActiveTab,
  setArticleForm,
  setEditingArticleId
}: GoogleDriveTabProps) {
  // Drive mode: simulator vs real Google Drive API
  const [isSimulator, setIsSimulator] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string>("");
  const [clientId, setClientId] = useState<string>(() => {
    return localStorage.getItem("gdrive_client_id") || "";
  });
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // File lists and searches
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "doc" | "image" | "json">("all");

  // Export / Import Modals State
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [articleToExport, setArticleToExport] = useState<string>("");
  const [exportFileName, setExportFileName] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"txt" | "json">("txt");

  // Mock initial files for simulation
  const [mockFiles, setMockFiles] = useState<DriveFile[]>([
    {
      id: "mock-1",
      name: "Liputan_Festival_Egrang_Jember_2026.txt",
      mimeType: "text/plain",
      size: "2.4 KB",
      modifiedTime: new Date(Date.now() - 3600000 * 2).toISOString(),
      content: `FESTIVAL EGRANG KREASI TRADISIONAL JEMBER 2026

Festival Egrang tradisional kembali digelar meriah di kecamatan Ledokombo, Jember. Acara tahunan ini berhasil menarik ribuan pasang mata warga lokal hingga wisatawan mancanegara.

Bupati Jember mengapresiasi kreativitas warga Ledokombo yang secara konsisten melestarikan warisan budaya Indonesia melalui permainan egrang yang dikombinasikan dengan kostum karnaval modern.

"Ledokombo telah membuktikan bahwa permainan tradisional bisa naik kelas dan menjadi magnet pariwisata berkelas dunia," ujarnya dalam sambutan pembukaan.`
    },
    {
      id: "mock-2",
      name: "Infrastruktur_Jalan_Rambipuji.txt",
      mimeType: "text/plain",
      size: "1.8 KB",
      modifiedTime: new Date(Date.now() - 3600000 * 12).toISOString(),
      content: `PERCEPATAN PERBAIKAN JALAN UTAMA RAMBIPUJI

Pemerintah Kabupaten Jember mengumumkan alokasi anggaran khusus untuk perbaikan jalan rusak di sepanjang jalur Rambipuji hingga Balung. Proyek pengerjaan ditargetkan rampung sebelum musim hujan tiba.

Kepala Dinas PU Bina Marga menjelaskan bahwa pengaspalan ulang ini mencakup pelebaran bahu jalan guna mengurai kemacetan parah yang kerap terjadi pada jam sibuk kerja.`
    },
    {
      id: "mock-3",
      name: "Alun_Alun_Jember_Malam_Hari.jpg",
      mimeType: "image/jpeg",
      size: "1.2 MB",
      modifiedTime: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: "mock-4",
      name: "Foto_Kegiatan_UMKM_Sumbersari.png",
      mimeType: "image/png",
      size: "850 KB",
      modifiedTime: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: "mock-5",
      name: "portal-jember-backup-juli.json",
      mimeType: "application/json",
      size: "14.5 KB",
      modifiedTime: new Date(Date.now() - 3600000 * 72).toISOString(),
      content: JSON.stringify({
        articles: [
          {
            id: "imported-1",
            title: "UMKM Jember Tembus Pasar Nasional Lewat Digitalisasi",
            content: "Puluhan pelaku UMKM di Sumbersari, Jember dibekali keterampilan digital marketing...",
            excerpt: "UMKM Jember dilatih pemasaran digital untuk perluas jangkauan pasar.",
            category: "ekonomi",
            kecamatan: "Sumbersari",
            image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
            status: "draft",
            views: 0,
            authorName: "Sistem Impor",
            authorEmail: "system@jemberportal.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }, null, 2)
    }
  ]);

  // Load files based on mode (simulator vs real)
  useEffect(() => {
    if (isSimulator) {
      setFiles(mockFiles);
    } else {
      if (accessToken) {
        fetchRealFiles();
      } else {
        setFiles([]);
      }
    }
  }, [isSimulator, mockFiles, accessToken]);

  // Save client ID to local storage
  const handleSaveClientId = () => {
    localStorage.setItem("gdrive_client_id", clientId);
    setShowConfig(false);
    setSuccessMessage("Client ID berhasil disimpan!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Google OAuth 2 Token Client authentication handler
  const handleConnectRealGoogle = () => {
    if (!clientId) {
      setError("Silakan masukkan Google OAuth Client ID terlebih dahulu di menu pengaturan.");
      setShowConfig(true);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // @ts-ignore
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        // @ts-ignore
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly",
          callback: (response: any) => {
            setLoading(false);
            if (response.error) {
              setError("Gagal mendapatkan akses: " + response.error);
              return;
            }
            if (response.access_token) {
              setAccessToken(response.access_token);
              setIsSimulator(false);
              setSuccessMessage("Berhasil terhubung dengan Google Drive asli Anda!");
              setTimeout(() => setSuccessMessage(null), 3000);
            }
          },
        });
        tokenClient.requestAccessToken();
      } else {
        throw new Error("SDK Google Identity Services tidak termuat secara lengkap.");
      }
    } catch (err: any) {
      setLoading(false);
      setError("Infrastruktur Google Auth GSI gagal dimuat: " + (err.message || err));
    }
  };

  // Fetch real files from Google Drive
  const fetchRealFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?pageSize=40&fields=files(id,name,mimeType,size,modifiedTime)&q=trashed=false",
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Gagal memuat file dari Google Drive.");
      }
      const data = await res.json();
      const mappedFiles: DriveFile[] = data.files.map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size ? `${(parseInt(f.size) / 1024).toFixed(1)} KB` : "—",
        modifiedTime: f.modifiedTime
      }));
      setFiles(mappedFiles);
    } catch (err: any) {
      setError(err.message || "Gagal memuat file Google Drive asli.");
    } finally {
      setLoading(false);
    }
  };

  // Create/Upload file to Google Drive (Real/Mock)
  const handleUploadFile = async (name: string, mimeType: string, content: string) => {
    if (isSimulator) {
      // Simulator Upload
      const newFile: DriveFile = {
        id: "mock-" + Date.now(),
        name,
        mimeType,
        size: `${(content.length / 1024).toFixed(1)} KB`,
        modifiedTime: new Date().toISOString(),
        content
      };
      setMockFiles([newFile, ...mockFiles]);
      return true;
    } else {
      // Real Google Drive Upload (Multipart Related)
      try {
        const boundary = "jember_portal_upload_boundary";
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delim = `\r\n--${boundary}--`;

        const metadata = { name, mimeType };

        const multipartRequestBody =
          delimiter +
          "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n\r\n` +
          content +
          close_delim;

        const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Gagal mengunggah ke Google Drive");
        }
        await fetchRealFiles();
        return true;
      } catch (err: any) {
        setError("Ekspor gagal: " + err.message);
        return false;
      }
    }
  };

  // Open / Read file content (Import into article editor)
  const handleImportFile = async (file: DriveFile) => {
    setLoading(true);
    try {
      let content = "";
      if (isSimulator) {
        content = file.content || "";
      } else {
        // Read content from real Google Drive
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) throw new Error("Gagal mengunduh isi file dari Google Drive.");
        content = await res.text();
      }

      // Parse and populate writing form
      let title = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      let bodyText = content;

      // Extract title from first line if it looks like a header
      const lines = content.split("\n");
      if (lines.length > 0 && lines[0].trim().length > 3 && lines[0].trim().toUpperCase() === lines[0].trim()) {
        title = lines[0].trim();
        bodyText = lines.slice(1).join("\n").trim();
      }

      // Populate draft editor form
      setEditingArticleId(null);
      setArticleForm({
        title: title,
        content: bodyText,
        excerpt: bodyText.substring(0, 150) + "...",
        category: "pemerintahan",
        kecamatan: "",
        image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800", // default
        status: "draft"
      });

      setSuccessMessage(`Berhasil mengimpor tulisan dari "${file.name}" ke Editor Draft!`);
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveTab("write");
      }, 1500);

    } catch (err: any) {
      setError("Gagal mengimpor file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Export current article to Google Drive
  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleToExport) return;

    const targetArticle = articles.find(a => a.id === articleToExport);
    if (!targetArticle) return;

    setLoading(true);
    setError(null);

    let fileName = exportFileName.trim();
    if (!fileName) {
      fileName = targetArticle.title.replace(/[^a-zA-Z0-9]/g, "_") + "." + exportFormat;
    } else if (!fileName.endsWith("." + exportFormat)) {
      fileName += "." + exportFormat;
    }

    let content = "";
    let mime = "text/plain";

    if (exportFormat === "json") {
      content = JSON.stringify(targetArticle, null, 2);
      mime = "application/json";
    } else {
      content = `${targetArticle.title.toUpperCase()}\n\nKategori: ${targetArticle.category}\nWilayah: ${targetArticle.kecamatan || "Jember"}\nPenulis: ${targetArticle.authorName}\nTanggal: ${new Date(targetArticle.createdAt).toLocaleDateString("id-ID")}\n\n${targetArticle.content}`;
    }

    const success = await handleUploadFile(fileName, mime, content);
    setLoading(false);

    if (success) {
      setShowExportModal(false);
      setSuccessMessage(`Berhasil mengekspor "${fileName}" ke Google Drive!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // System Backup (db.json payload) to Google Drive
  const handleSystemBackup = async () => {
    const confirmed = window.confirm("Apakah Anda yakin ingin mengekspor seluruh basis data portal berita (db.json) sebagai cadangan ke Google Drive?");
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/backup/export", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("cms_token")}` }
      });
      if (!res.ok) throw new Error("Gagal mengambil data sistem dari server.");
      const dbContent = await res.json();

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `jember-news-backup-${timestamp}.json`;

      const success = await handleUploadFile(backupName, "application/json", JSON.stringify(dbContent, null, 2));
      if (success) {
        setSuccessMessage(`Cadangan sistem "${backupName}" berhasil diunggah ke Google Drive!`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setError("Gagal membuat cadangan sistem: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // System Restore from file in Google Drive
  const handleSystemRestore = async (file: DriveFile) => {
    const confirmed = window.confirm(`PERINGATAN KRITIS: Anda akan memulihkan data sistem dari file cadangan "${file.name}". Tindakan ini akan OVERWRITE seluruh artikel, komentar, pengaturan layout, dan admin portal berita dengan data cadangan ini. Lanjutkan?`);
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      let content = "";
      if (isSimulator) {
        content = file.content || "";
      } else {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) throw new Error("Gagal mengunduh file cadangan.");
        content = await res.text();
      }

      // Parse to ensure valid JSON schema
      const parsedData = JSON.parse(content);
      if (!parsedData.articles || !parsedData.admins || !parsedData.settings) {
        throw new Error("File tidak valid. Skema cadangan harus berisi artikel, admin, dan pengaturan.");
      }

      const response = await fetch("/api/backup/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("cms_token")}`
        },
        body: content
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Gagal mengunggah data pemulihan ke server.");
      }

      setSuccessMessage("Basis data portal berita berhasil dipulihkan dari cadangan!");
      await onRefreshArticles();
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveTab("dashboard");
      }, 2000);

    } catch (err: any) {
      setError("Gagal memulihkan sistem: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete file in Google Drive
  const handleDeleteFile = async (file: DriveFile) => {
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus file "${file.name}" dari Google Drive? Tindakan ini permanen.`);
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    if (isSimulator) {
      setMockFiles(mockFiles.filter(f => f.id !== file.id));
      setLoading(false);
      setSuccessMessage(`Berhasil menghapus file "${file.name}" dari Drive Simulator.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) throw new Error("Gagal menghapus file dari Google Drive.");
        await fetchRealFiles();
        setSuccessMessage(`Berhasil menghapus file dari Google Drive.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        setError("Gagal menghapus: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper file filters
  const filteredFiles = files.filter(f => {
    const nameMatch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!nameMatch) return false;

    if (selectedFilter === "all") return true;
    if (selectedFilter === "doc") {
      return f.mimeType === "text/plain" || f.mimeType.includes("application/vnd.google-apps.document");
    }
    if (selectedFilter === "image") {
      return f.mimeType.includes("image/");
    }
    if (selectedFilter === "json") {
      return f.mimeType === "application/json";
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-6 text-xs font-semibold">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-vibrant-primary" /> Integrasi Google Drive
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Impor tulisan naskah berita, ekspor arsip liputan, serta buat cadangan database portal langsung ke cloud Google Drive.
          </p>
        </div>

        {/* Mode Toggles */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl self-end shrink-0">
          <button
            onClick={() => setIsSimulator(true)}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase transition-all cursor-pointer ${
              isSimulator ? "bg-white text-vibrant-primary shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Drive Simulator (Demo)
          </button>
          <button
            onClick={() => {
              if (accessToken) {
                setIsSimulator(false);
              } else {
                handleConnectRealGoogle();
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase transition-all cursor-pointer ${
              !isSimulator ? "bg-white text-vibrant-primary shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Google Drive Asli
          </button>
        </div>
      </div>

      {/* Connection / Config Box */}
      {!isSimulator && !accessToken && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-amber-950 text-sm">Hubungkan Google Drive Anda</h3>
              <p className="text-amber-800 font-medium leading-relaxed mt-1">
                Untuk terhubung ke akun Google Drive asli Anda, kami membutuhkan Google Client ID Anda sendiri yang dikonfigurasi melalui Google Cloud Console. Hal ini dikarenakan pembatasan keamanan origin iframe dalam lingkungan AI Studio.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1">
            <button
              onClick={handleConnectRealGoogle}
              className="bg-vibrant-primary hover:bg-vibrant-secondary text-white font-extrabold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Hubungkan Sekarang
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold px-4 py-2 rounded-lg cursor-pointer transition-all"
            >
              <Settings className="w-4 h-4 inline mr-1" /> {showConfig ? "Tutup Pengaturan" : "Masukkan Client ID"}
            </button>
          </div>
        </div>
      )}

      {showConfig && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
          <h3 className="font-black text-slate-900">Konfigurasi Kredensial OAuth Google</h3>
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-700">Google OAuth Client ID *</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: 123456789-abcde.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="flex-grow px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-vibrant-primary focus:border-vibrant-primary font-semibold text-xs"
              />
              <button
                onClick={handleSaveClientId}
                className="bg-vibrant-primary hover:bg-vibrant-secondary text-white font-extrabold px-4 rounded-lg cursor-pointer transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal font-medium">
            Tautan callback redirect resmi untuk aplikasi ini adalah: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold text-slate-700">{window.location.origin}/auth/callback</code>. Pastikan Anda mendaftarkan tautan ini di menu Google Cloud Console Authorized redirect URIs Anda.
          </p>
        </div>
      )}

      {/* Success/Error Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-lg text-red-800 font-bold flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-3.5 rounded-lg text-green-800 font-bold flex gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Connected Status Summary */}
      {(!isSimulator && accessToken) && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-extrabold text-green-950 text-xs">Terhubung ke Google Drive Asli</span>
          </div>
          <button
            onClick={() => {
              setAccessToken("");
              setIsSimulator(true);
            }}
            className="text-red-600 hover:text-red-800 font-extrabold text-[10px] uppercase hover:underline cursor-pointer"
          >
            Putuskan Koneksi
          </button>
        </div>
      )}

      {/* DRIVE EXPLORER CONTENT */}
      {(isSimulator || accessToken) && (
        <div className="flex flex-col gap-5">
          {/* Quick Stats & Backup Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex flex-col gap-1.5 justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Penyimpanan Cloud</span>
                <span className="text-sm font-black text-slate-800 block mt-1">Google Drive Storage</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-vibrant-primary h-full rounded-full" style={{ width: "35%" }}></div>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block mt-1">5.2 GB dari 15 GB digunakan</span>
            </div>

            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex flex-col gap-1 justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Pencadangan Basis Data</span>
                <span className="text-xs font-black text-slate-800 block mt-1">Simpan snapshot seluruh data portal ke Drive</span>
              </div>
              <button
                onClick={handleSystemBackup}
                disabled={loading}
                className="mt-3 w-full bg-vibrant-primary hover:bg-vibrant-secondary text-white font-extrabold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs text-[11px]"
              >
                <Upload className="w-3.5 h-3.5" /> Cadangkan Portal (JSON)
              </button>
            </div>

            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex flex-col gap-1 justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Ekspor Artikel</span>
                <span className="text-xs font-black text-slate-800 block mt-1">Unggah artikel portal sebagai file teks / JSON</span>
              </div>
              <button
                onClick={() => {
                  if (articles.length === 0) {
                    alert("Belum ada artikel untuk diekspor!");
                    return;
                  }
                  setArticleToExport(articles[0].id);
                  setExportFileName(articles[0].title.replace(/[^a-zA-Z0-9]/g, "_"));
                  setShowExportModal(true);
                }}
                disabled={loading}
                className="mt-3 w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" /> Ekspor Berita Tertentu
              </button>
            </div>
          </div>

          {/* Search, Filter & Reload Section */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari file di Google Drive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none text-xs font-semibold"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all cursor-pointer ${
                  selectedFilter === "all" ? "bg-slate-800 text-white" : "bg-white hover:bg-slate-100 border border-slate-200 text-slate-600"
                }`}
              >
                Semua File
              </button>
              <button
                onClick={() => setSelectedFilter("doc")}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all cursor-pointer ${
                  selectedFilter === "doc" ? "bg-slate-800 text-white" : "bg-white hover:bg-slate-100 border border-slate-200 text-slate-600"
                }`}
              >
                Naskah / Docs
              </button>
              <button
                onClick={() => setSelectedFilter("image")}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all cursor-pointer ${
                  selectedFilter === "image" ? "bg-slate-800 text-white" : "bg-white hover:bg-slate-100 border border-slate-200 text-slate-600"
                }`}
              >
                Cover / Foto
              </button>
              <button
                onClick={() => setSelectedFilter("json")}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all cursor-pointer ${
                  selectedFilter === "json" ? "bg-slate-800 text-white" : "bg-white hover:bg-slate-100 border border-slate-200 text-slate-600"
                }`}
              >
                Cadangan (.json)
              </button>

              <button
                onClick={() => {
                  if (isSimulator) {
                    setSuccessMessage("Daftar simulasi file berhasil direfresh!");
                    setTimeout(() => setSuccessMessage(null), 1500);
                  } else {
                    fetchRealFiles();
                  }
                }}
                disabled={loading}
                title="Refresh Daftar File"
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Files List Table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
            {filteredFiles.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold">
                <Folder className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                Tidak ada file yang cocok dengan filter atau pencarian Anda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
                      <th className="p-3.5">Nama File</th>
                      <th className="p-3.5">Tipe / Format</th>
                      <th className="p-3.5">Ukuran</th>
                      <th className="p-3.5">Diubah Pada</th>
                      <th className="p-3.5 text-right">Integrasi Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => {
                      const isTextDoc = file.mimeType === "text/plain" || file.mimeType.includes("application/vnd.google-apps.document");
                      const isJsonBackup = file.mimeType === "application/json" && file.name.includes("backup");
                      const isImageFile = file.mimeType.includes("image/");

                      return (
                        <tr key={file.id} className="border-b border-slate-50 text-slate-700 font-medium hover:bg-vibrant-light/5">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              {isTextDoc ? (
                                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                              ) : isJsonBackup ? (
                                <span className="p-1 rounded bg-amber-50 text-amber-600 font-bold font-mono text-[9px]">JSON</span>
                              ) : isImageFile ? (
                                <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
                              )}
                              <span className="font-extrabold text-slate-900 truncate max-w-xs">{file.name}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-500 text-[10px]">
                            {file.mimeType.replace("application/vnd.google-apps.", "Google ")}
                          </td>
                          <td className="p-3.5 font-bold text-slate-600">{file.size || "—"}</td>
                          <td className="p-3.5 text-[10px] text-slate-400">
                            {new Date(file.modifiedTime).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Import Article Button */}
                              {isTextDoc && (
                                <button
                                  onClick={() => handleImportFile(file)}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-black text-[10px] uppercase transition-colors cursor-pointer"
                                  title="Impor naskah ini ke form tulis berita"
                                >
                                  Impor ke Editor
                                </button>
                              )}

                              {/* Restore System Button */}
                              {isJsonBackup && (
                                <button
                                  onClick={() => handleSystemRestore(file)}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-black text-[10px] uppercase transition-colors cursor-pointer flex items-center gap-1"
                                  title="Pulihkan seluruh data portal dari cadangan ini"
                                >
                                  <Download className="w-3 h-3" /> Pulihkan Backup
                                </button>
                              )}

                              {/* Set Cover Image Helper */}
                              {isImageFile && (
                                <button
                                  onClick={() => {
                                    // Set image to editor or simulator preview
                                    const imgUrl = isSimulator 
                                      ? "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800" 
                                      : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
                                    
                                    setArticleForm((prev: any) => ({ ...prev, image: imgUrl }));
                                    setSuccessMessage("Gambar dipilih sebagai cover! Dialihkan ke Editor...");
                                    setTimeout(() => {
                                      setSuccessMessage(null);
                                      setActiveTab("write");
                                    }, 1500);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-black text-[10px] uppercase transition-colors cursor-pointer"
                                  title="Gunakan gambar ini sebagai cover berita"
                                >
                                  Gunakan Foto
                                </button>
                              )}

                              {/* Trash button */}
                              <button
                                onClick={() => handleDeleteFile(file)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded cursor-pointer"
                                title="Hapus File dari Google Drive"
                              >
                                <Trash2 className="w-3 h-3" />
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
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 w-full max-w-md flex flex-col gap-4 animate-in fade-in-50">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-vibrant-primary" /> Ekspor Berita Jember ke Drive
              </h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleExportSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              {/* Select Article */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Pilih Berita yang Ingin Diekspor *</label>
                <select
                  value={articleToExport}
                  onChange={(e) => {
                    setArticleToExport(e.target.value);
                    const target = articles.find(a => a.id === e.target.value);
                    if (target) setExportFileName(target.title.replace(/[^a-zA-Z0-9]/g, "_"));
                  }}
                  className="p-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                >
                  {articles.map(art => (
                    <option key={art.id} value={art.id}>{art.title} ({art.status})</option>
                  ))}
                </select>
              </div>

              {/* File Name input */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Nama File Baru di Drive (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Laporan_Kecamatan_Balung"
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              {/* Export Format */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Format Ekspor *</label>
                <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setExportFormat("txt")}
                    className={`flex-1 py-1.5 rounded-md font-bold text-center cursor-pointer transition-all ${
                      exportFormat === "txt" ? "bg-white text-vibrant-primary shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Format Teks (.txt)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat("json")}
                    className={`flex-1 py-1.5 rounded-md font-bold text-center cursor-pointer transition-all ${
                      exportFormat === "json" ? "bg-white text-vibrant-primary shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Format JSON (.json)
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl transition-all font-extrabold cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-vibrant-primary hover:bg-vibrant-secondary text-white py-2 rounded-xl transition-colors font-extrabold cursor-pointer shadow-xs"
                >
                  {loading ? "Sedang Mengekspor..." : "Unggah ke Drive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
