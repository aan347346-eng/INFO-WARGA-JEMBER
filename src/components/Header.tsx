import React, { useState } from "react";
import { Search, Calendar, Phone, Flame, ChevronDown, MapPin, User, LogOut, Video } from "lucide-react";
import { CATEGORIES, KECAMATAN_LIST, WebSettings } from "../types";

interface HeaderProps {
  settings: WebSettings;
  currentCategory: string;
  setCategory: (cat: string) => void;
  selectedKecamatan: string | null;
  setKecamatan: (kec: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: any;
  onLogout: () => void;
  onNavigateToCms: () => void;
  onNavigateHome: () => void;
}

export default function Header({
  settings,
  currentCategory,
  setCategory,
  selectedKecamatan,
  setKecamatan,
  searchQuery,
  setSearchQuery,
  user,
  onLogout,
  onNavigateToCms,
  onNavigateHome,
}: HeaderProps) {
  const [showKecamatanDropdown, setShowKecamatanDropdown] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    setCategory("beranda");
    setKecamatan(null);
  };

  const selectCategory = (catId: string) => {
    setCategory(catId);
    setSearchQuery("");
    setLocalSearch("");
    if (catId !== "berita-kecamatan") {
      setKecamatan(null);
    }
  };

  const selectKecamatan = (kec: string) => {
    setKecamatan(kec);
    setCategory("berita-kecamatan");
    setSearchQuery("");
    setLocalSearch("");
    setShowKecamatanDropdown(false);
  };

  // Format today's date in Indonesian
  const getIndonesianDate = () => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const date = new Date();
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <header className="w-full flex flex-col bg-white border-b border-vibrant-border sticky top-0 z-50 shadow-sm">
      {/* Top Banner */}
      <div className="w-full bg-vibrant-primary text-white py-1.5 px-4 text-xs font-bold">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-vibrant-light" />
              {getIndonesianDate()}
            </span>
            <span className="hidden md:flex items-center gap-1.5 border-l border-vibrant-secondary pl-4">
              <MapPin className="w-3.5 h-3.5 text-vibrant-light" />
              Kabupaten Jember, Jawa Timur
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/95">
            {settings.whatsappAdmin && (
              <a 
                href={`https://wa.me/${settings.whatsappAdmin}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-vibrant-light transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-300" />
                Redaksi WA: {settings.whatsappAdmin}
              </a>
            )}
            {user ? (
              <div className="flex items-center gap-2 border-l border-vibrant-secondary pl-4">
                <span className="text-white/90 max-w-[120px] truncate font-semibold">Halo, {user.name}</span>
                {user.role !== "reader" ? (
                  <button 
                    onClick={onNavigateToCms}
                    className="bg-white text-vibrant-primary hover:bg-vibrant-light px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Dashboard CMS
                  </button>
                ) : (
                  <span className="text-[10px] bg-vibrant-secondary text-vibrant-light px-1.5 py-0.5 rounded">Pembaca</span>
                )}
                <button 
                  onClick={onLogout}
                  title="Keluar"
                  className="hover:text-vibrant-light ml-1 p-0.5 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Brand & Search Bar */}
      <div className="w-full bg-white border-b border-vibrant-border/50 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div onClick={onNavigateHome} className="flex flex-col cursor-pointer select-none group">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-vibrant-primary transition-colors group-hover:text-vibrant-secondary">
              INFO WARGA JEMBER
            </h1>
            <p className="text-[10px] text-vibrant-secondary font-bold uppercase tracking-[0.2em] text-center md:text-left mt-1">
              Portal Berita Terkini & Terpercaya
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-96 flex items-center gap-2">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Cari berita Jember..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full px-4 py-2 bg-vibrant-light border-none rounded-full text-sm focus:ring-2 ring-vibrant-accent outline-none text-slate-800"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => { setLocalSearch(""); setSearchQuery(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vibrant-secondary hover:text-vibrant-primary text-xs font-semibold"
                >
                  Batal
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-vibrant-primary hover:bg-vibrant-secondary text-white px-5 py-2 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 mr-1" />
              Cari
            </button>
          </form>
        </div>
      </div>

      {/* Main Category Navigation */}
      <div className="w-full bg-white px-4 border-b border-vibrant-border shadow-sm flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full relative flex items-center justify-between h-11">
          <nav className="flex items-center overflow-x-auto scrollbar-none gap-5 select-none pr-12 text-[11px] font-bold text-vibrant-dark uppercase tracking-wide">
            {CATEGORIES.map((cat) => {
              const isActive = currentCategory === cat.id && (cat.id !== "berita-kecamatan" || selectedKecamatan === null);
              
              if (cat.id === "berita-kecamatan") {
                const isKecamatanActive = currentCategory === "berita-kecamatan";
                return (
                  <div key={cat.id} className="relative shrink-0 flex items-center h-11">
                    <button
                      onClick={() => setShowKecamatanDropdown(!showKecamatanDropdown)}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer uppercase ${
                        isKecamatanActive
                          ? "bg-vibrant-primary text-white"
                          : "text-vibrant-dark hover:bg-vibrant-light hover:text-vibrant-primary"
                      }`}
                    >
                      {selectedKecamatan ? `Kec. ${selectedKecamatan}` : "Kecamatan"}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showKecamatanDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {/* Kecamatan Dropdown Grid */}
                    {showKecamatanDropdown && (
                      <div className="absolute top-full left-0 mt-1.5 w-[310px] sm:w-[480px] bg-white border border-vibrant-border rounded-lg shadow-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 z-50 max-h-[360px] overflow-y-auto">
                        <div className="col-span-full border-b border-vibrant-light pb-2 mb-1 flex justify-between items-center">
                          <span className="text-xs font-bold text-vibrant-secondary uppercase flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> Pilih Kecamatan ({KECAMATAN_LIST.length})
                          </span>
                          <button 
                            onClick={() => { setKecamatan(null); setCategory("berita-kecamatan"); setShowKecamatanDropdown(false); }}
                            className="text-[10px] text-vibrant-primary hover:underline font-bold"
                          >
                            Semua Kecamatan
                          </button>
                        </div>
                        {KECAMATAN_LIST.map((kec) => (
                          <button
                            key={kec}
                            onClick={() => selectKecamatan(kec)}
                            className={`px-2.5 py-1.5 text-xs text-left rounded hover:bg-vibrant-light hover:text-vibrant-primary transition-colors font-semibold ${
                              selectedKecamatan === kec ? "bg-vibrant-light text-vibrant-primary font-bold" : "text-slate-700"
                            }`}
                          >
                            {kec}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id)}
                  className={`h-11 flex items-center text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-b-2 uppercase ${
                    isActive
                      ? "text-vibrant-primary border-vibrant-primary"
                      : "text-vibrant-dark border-transparent hover:text-vibrant-primary"
                  }`}
                >
                  {cat.id === "video" ? (
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4 text-red-500 fill-current" /> Video
                    </span>
                  ) : cat.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Breaking News Ticker */}
      {settings.runningText && (
        <div className="w-full bg-vibrant-primary text-white py-1 px-4 text-xs font-bold flex items-center shrink-0 border-b border-vibrant-secondary/30">
          <div className="max-w-7xl mx-auto flex items-center text-xs w-full">
            <span className="bg-white text-vibrant-primary px-2 py-0.5 rounded mr-3 uppercase tracking-tighter shrink-0 text-[10px] font-black">
              Breaking News
            </span>
            <div className="w-full overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-[marquee_60s_linear_infinite] hover:[animation-play-state:paused] text-white font-bold cursor-pointer">
                {settings.runningText}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
