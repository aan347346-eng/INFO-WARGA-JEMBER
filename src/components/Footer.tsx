import { MapPin, Mail, Youtube, Phone, Facebook, Instagram, ShieldAlert } from "lucide-react";
import { WebSettings } from "../types";

interface FooterProps {
  settings: WebSettings;
  onNavigateToLogin: () => void;
  user: any;
}

export default function Footer({ settings, onNavigateToLogin, user }: FooterProps) {
  return (
    <footer className="w-full bg-white text-slate-600 py-12 px-4 border-t border-vibrant-border shadow-sm mt-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* About Column */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-black text-vibrant-primary tracking-tight">
            INFO <span className="text-vibrant-secondary">WARGA</span> JEMBER
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Portal berita independen Kabupaten Jember, menyajikan informasi terkini seputar pemerintahan, peristiwa, wisata kuliner, ekonomi, dan aspirasi masyarakat dari 31 kecamatan di Kabupaten Jember.
          </p>
          <div className="flex gap-3 mt-2 text-vibrant-primary">
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noreferrer" className="hover:text-vibrant-secondary transition-colors" title="Facebook Info Warga Jember">
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noreferrer" className="hover:text-vibrant-secondary transition-colors" title="Instagram Info Warga Jember">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {settings.youtube && (
              <a href={settings.youtube} target="_blank" rel="noreferrer" className="hover:text-vibrant-secondary transition-colors text-vibrant-primary" title="YouTube Info Warga Jember">
                <Youtube className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Contact/Office Column */}
        <div className="flex flex-col gap-3 text-xs">
          <h3 className="text-sm font-bold text-vibrant-primary uppercase tracking-wider border-b border-vibrant-light pb-2">
            Redaksi & Kantor Utama
          </h3>
          {settings.address && (
            <p className="flex items-start gap-2 text-slate-500">
              <MapPin className="w-4 h-4 text-vibrant-accent shrink-0 mt-0.5" />
              <span>{settings.address}</span>
            </p>
          )}
          {settings.email && (
            <p className="flex items-center gap-2 text-slate-500">
              <Mail className="w-4 h-4 text-vibrant-accent shrink-0" />
              <a href={`mailto:${settings.email}`} className="hover:underline hover:text-vibrant-primary">{settings.email}</a>
            </p>
          )}
          {settings.whatsappAdmin && (
            <p className="flex items-center gap-2 text-slate-500">
              <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Telp/WhatsApp: {settings.whatsappAdmin}</span>
            </p>
          )}
        </div>

        {/* Useful Links & Hidden Admin Portal Access */}
        <div className="flex flex-col gap-3 text-xs">
          <h3 className="text-sm font-bold text-vibrant-primary uppercase tracking-wider border-b border-vibrant-light pb-2">
            Kanal Redaksi
          </h3>
          <ul className="grid grid-cols-2 gap-2 text-slate-500 font-semibold">
            <li><span className="hover:text-vibrant-primary transition-colors cursor-pointer">• Beranda</span></li>
            <li><span className="hover:text-vibrant-primary transition-colors cursor-pointer">• Pemerintahan</span></li>
            <li><span className="hover:text-vibrant-primary transition-colors cursor-pointer">• Wisata & Kuliner</span></li>
            <li><span className="hover:text-vibrant-primary transition-colors cursor-pointer">• Ekonomi Jember</span></li>
            <li><span className="hover:text-vibrant-primary transition-colors cursor-pointer">• Pendidikan</span></li>
            <li><span className="hover:text-vibrant-primary transition-colors cursor-pointer">• Berita Kecamatan</span></li>
          </ul>
          <p className="text-[10px] text-slate-400 mt-2">
            © {new Date().getFullYear()} INFO WARGA JEMBER. Seluruh hak cipta dilindungi undang-undang. Portal Berita Nasional Berbasis Kabupaten Jember.
          </p>
        </div>
      </div>

      {/* Extreme Bottom Bar with Subtle Admin Login */}
      <div className="max-w-7xl mx-auto border-t border-vibrant-light mt-8 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500">
        <div className="flex items-center gap-4">
          <span>Didesain khusus untuk menyajikan kabar aktual warga Jember, Jawa Timur</span>
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          {/* Subtle CMS login link, perfectly hiding "Login Admin" as requested! */}
          <button 
            onClick={onNavigateToLogin}
            className="flex items-center gap-1 opacity-55 hover:opacity-100 transition-opacity hover:text-vibrant-primary cursor-pointer font-bold"
          >
            <ShieldAlert className="w-3 h-3 text-vibrant-accent" />
            <span>Akses Redaksi / CMS Portal</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
