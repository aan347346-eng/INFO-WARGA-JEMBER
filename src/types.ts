/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string; // 'pemerintahan' | 'peristiwa' | 'politik' | etc.
  kecamatan: string | null; // Selected sub-district if category is 'Berita Kecamatan' or as sub-filter
  image: string;
  status: 'draft' | 'review' | 'publish';
  views: number;
  authorName: string;
  authorEmail: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface AdminUser {
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
  addedBy: string;
  addedAt: string;
}

export interface Comment {
  id: string;
  articleId: string;
  articleTitle: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

export interface WebSettings {
  websiteTitle: string;
  address: string;
  email: string;
  youtube: string;
  whatsappAdmin: string;
  facebook: string;
  instagram: string;
  runningText: string;
}

export interface VisitorStats {
  totalVisits: number;
  totalPageviews: number;
  dailyStats: {
    date: string; // YYYY-MM-DD
    visits: number;
    pageviews: number;
  }[];
  categoryViews: Record<string, number>;
  browserStats: Record<string, number>;
}

export interface DashboardData {
  stats: VisitorStats;
  totalArticles: number;
  pendingReviewCount: number;
  popularArticles: Article[];
  comments: Comment[];
  admins: AdminUser[];
}

export const KECAMATAN_LIST = [
  "Ajung",
  "Ambulu",
  "Arjasa",
  "Balung",
  "Bangsalsari",
  "Gumukmas",
  "Jelbuk",
  "Jenggawah",
  "Jombang",
  "Kalisat",
  "Kaliwates",
  "Kencong",
  "Ledokombo",
  "Mayang",
  "Mumbulsari",
  "Panti",
  "Pakusari",
  "Patrang",
  "Puger",
  "Rambipuji",
  "Semboro",
  "Silo",
  "Sukorambi",
  "Sukowono",
  "Sumberbaru",
  "Sumberjambe",
  "Sumbersari",
  "Tanggul",
  "Tempurejo",
  "Umbulsari",
  "Wuluhan"
];

export const CATEGORIES = [
  { id: "beranda", name: "Beranda" },
  { id: "pemerintahan", name: "Pemerintahan" },
  { id: "peristiwa", name: "Peristiwa" },
  { id: "politik", name: "Politik" },
  { id: "ekonomi", name: "Ekonomi" },
  { id: "pendidikan", name: "Pendidikan" },
  { id: "kesehatan", name: "Kesehatan" },
  { id: "wisata-kuliner", name: "Wisata & Kuliner" },
  { id: "olahraga", name: "Olahraga" },
  { id: "hiburan", name: "Hiburan" },
  { id: "gaya-hidup", name: "Gaya Hidup" },
  { id: "event", name: "Event" },
  { id: "pengumuman", name: "Pengumuman" },
  { id: "video", name: "Video" },
  { id: "berita-kecamatan", name: "Berita Kecamatan" }
];
