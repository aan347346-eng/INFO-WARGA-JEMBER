import React, { useState, useEffect } from "react";
import { ShieldCheck, Mail, LogIn, ChevronRight, HelpCircle, AlertCircle } from "lucide-react";

interface CmsLoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  onNavigateHome: () => void;
}

export default function CmsLogin({ onLoginSuccess, onNavigateHome }: CmsLoginProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  // Load Google Identity Services SDK
  useEffect(() => {
    // Inject the script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      if (window.google) {
        initializeGoogleSignIn();
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeGoogleSignIn = () => {
    try {
      // @ts-ignore
      window.google.accounts.id.initialize({
        // Default Client ID or fallback to check
        client_id: "57989345798-example.apps.googleusercontent.com", 
        callback: handleGoogleResponse,
      });

      // @ts-ignore
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { theme: "outline", size: "large", width: "100%", text: "signin_with" }
      );
    } catch (e) {
      console.log("Failed to initialize Google GSI button", e);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal masuk menggunakan Google");
      }

      const data = await res.json();
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  // Demo Login Bypass handler
  const handleDemoLogin = async (email: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal melakukan demo login");
      }

      const data = await res.json();
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Gagal demo masuk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vibrant-light/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-vibrant-border overflow-hidden">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-vibrant-secondary to-vibrant-dark text-white p-8 text-center relative">
          <div className="absolute top-4 right-4 text-vibrant-light">
            <ShieldCheck className="w-8 h-8 opacity-80" />
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-1">
            PORTAL REDAKSI
          </h2>
          <p className="text-xs text-vibrant-light uppercase font-semibold tracking-wider">
            INFO WARGA JEMBER
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 flex flex-col gap-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800">Silakan Masuk</h3>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan akun Google (Gmail) terdaftar Anda untuk mengakses dasbor redaksi.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Real Google Sign-In Button Container */}
          <div className="w-full flex justify-center py-2">
            <div id="google-signin-btn" className="w-full"></div>
          </div>

          {/* Separator */}
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative px-3 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Bypass Demo Penguji (Instan)
            </span>
          </div>

          {/* Fast Demo Mode - Essential for AI Studio Preview without Google Console setups */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleDemoLogin("aann37501@gmail.com", "Superadmin Jember")}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3 bg-vibrant-light/40 hover:bg-vibrant-light/70 border border-vibrant-border rounded-xl text-xs font-bold text-vibrant-secondary transition-colors disabled:opacity-50 cursor-pointer text-left"
            >
              <div className="flex flex-col">
                <span className="font-extrabold flex items-center gap-1.5 text-vibrant-dark">
                  <span className="w-2 h-2 rounded-full bg-vibrant-primary animate-pulse"></span>
                  Superadmin Jember
                </span>
                <span className="text-[10px] text-vibrant-accent font-normal">
                  Email: aann37501@gmail.com (Akses penuh)
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-vibrant-primary shrink-0" />
            </button>

            <button
              onClick={() => handleDemoLogin("admin_jember@gmail.com", "Rendra Jurnalist")}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-vibrant-light/20 border border-gray-200 hover:border-vibrant-border rounded-xl text-xs font-bold text-gray-800 hover:text-vibrant-primary transition-colors disabled:opacity-50 cursor-pointer text-left"
            >
              <div className="flex flex-col">
                <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-vibrant-accent"></span>
                  Admin Jurnalist
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Email: admin_jember@gmail.com (Akses draf & review)
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>

          {/* Help Configuration Toggle */}
          <div className="mt-2 text-center">
            <button
              onClick={() => setShowConfigHelp(!showConfigHelp)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-vibrant-primary underline cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Cara konfigurasi Google Login asli di .env?
            </button>

            {showConfigHelp && (
              <div className="bg-vibrant-light/30 border border-vibrant-border p-3 rounded-lg text-left text-[10px] text-vibrant-dark mt-2 space-y-1.5 leading-relaxed">
                <p className="font-bold text-vibrant-secondary">Panduan Set-up Google OAuth:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Buka <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="underline font-bold text-vibrant-primary">Google Cloud Console</a>.</li>
                  <li>Buat Project baru, lalu masuk ke bagian <b>APIs & Services &gt; Credentials</b>.</li>
                  <li>Konfigurasikan <b>OAuth Consent Screen</b> untuk aplikasi eksternal.</li>
                  <li>Buat <b>OAuth Client ID</b> tipe <i>Web Application</i>.</li>
                  <li>Masukkan Authorized Javascript Origins: <code>{window.location.origin}</code>.</li>
                  <li>Ganti Client ID di kode program <code>CmsLogin.tsx</code> dengan Client ID asli Anda.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-gray-50 px-8 py-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
          <button 
            onClick={onNavigateHome}
            className="hover:text-vibrant-primary underline font-semibold cursor-pointer"
          >
            ← Kembali ke Beranda Publik
          </button>
          <span>ID Aplikasi: info-warga-jember</span>
        </div>
      </div>
    </div>
  );
}
