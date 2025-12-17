'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

type ProfileView = {
  cashierName: string;
  cashierLevel: string;
  storeName: string;
  storePhone: string;
  email: string;
  address: string;
};

const DEFAULT_PROFILE: ProfileView = {
  cashierName: 'Kasir',
  cashierLevel: '',
  storeName: 'POS Retail',
  storePhone: '',
  email: '',
  address: '',
};

export default function ProfileDetailPage() {
  const [profile, setProfile] = useState<ProfileView>(DEFAULT_PROFILE);
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parsed: Partial<ProfileView> = {};

    // Sumber utama: currentUser (diset saat login PIN)
    try {
      const rawCurrent = localStorage.getItem('currentUser');
      if (rawCurrent) {
        const cu = JSON.parse(rawCurrent);
        parsed.cashierName =
          cu.name || cu.nama || DEFAULT_PROFILE.cashierName;
        parsed.cashierLevel = cu.level || '';
        parsed.storeName = cu.nama_kios || DEFAULT_PROFILE.storeName;
        parsed.storePhone = cu.phone || cu.notelp || '';
      }
    } catch {
      // abaikan error parse
    }

    // Fallback tambahan: pin_session (juga dari login PIN)
    if (!parsed.cashierName || parsed.cashierName === DEFAULT_PROFILE.cashierName) {
      try {
        const rawPin = localStorage.getItem('pin_session');
        if (rawPin) {
          const pin = JSON.parse(rawPin);
          parsed.cashierName =
            pin.nama || parsed.cashierName || DEFAULT_PROFILE.cashierName;
          parsed.cashierLevel = pin.level || parsed.cashierLevel || '';
          parsed.storeName =
            pin.nama_kios || parsed.storeName || DEFAULT_PROFILE.storeName;
          parsed.storePhone =
            pin.notelp || parsed.storePhone || '';
        }
      } catch {
        // abaikan error parse
      }
    }

    setProfile((prev) => ({
      ...prev,
      ...parsed,
    }));
  }, []);

  // Reset sidebar state saat window resize untuk memastikan konsistensi
  useEffect(() => {
    const handleResize = () => {
      // Jika window menjadi 2xl atau lebih besar, reset tablet sidebar
      if (window.innerWidth >= 1536) {
        setSidebarCollapsed(true);
      }
      // Jika window menjadi md atau lebih kecil, reset mobile sidebar
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showHeaderLevel = Boolean(profile.cashierLevel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-emerald-50/30 relative">
      {/* Static sidebar for desktop (2xl up - very large screens only) */}
      <div className="hidden 2xl:block fixed left-0 top-0 bottom-0 w-64 z-50">
        <Sidebar />
      </div>

      {/* Sidebar overlay for tablet (md, lg, xl - all tablets including landscape) */}
      {!sidebarCollapsed && (
        <div className="hidden md:block 2xl:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarCollapsed(true)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[10.5rem] md:w-[13rem] lg:w-[15rem] xl:w-[17rem] bg-white shadow-xl z-50 overflow-y-auto">
            <Sidebar isOverlay={true} />
          </div>
        </div>
      )}

      {/* Show Sidebar Indicator for Tablet (md, lg, xl - all tablets including landscape, when collapsed) */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden md:flex 2xl:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 w-12 h-20 bg-white rounded-r-full items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 group"
          aria-label="Show sidebar"
        >
          <div className="flex items-center -space-x-3">
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0s'
              }}
            ></i>
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0.3s'
              }}
            ></i>
          </div>
        </button>
      )}
      
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white z-50 overflow-y-auto">
            <Sidebar isOverlay={true} />
          </div>
        </div>
      )}

      {/* Show Sidebar Indicator for Mobile (when collapsed) */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 w-12 h-20 bg-white rounded-r-full items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 group flex"
          aria-label="Show sidebar"
        >
          <div className="flex items-center -space-x-3">
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0s'
              }}
            ></i>
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0.3s'
              }}
            ></i>
          </div>
        </button>
      )}

      <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 pb-12 2xl:pl-72 2xl:pr-8">
        {/* Header profil dengan gradient */}
        <div className="w-full bg-emerald-500 rounded-3xl px-4 sm:px-6 pt-8 sm:pt-10 pb-10 sm:pb-12 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <div className="rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white w-32 h-32 flex items-center justify-center">
                <span className="ri-user-3-line text-5xl text-emerald-500" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow-lg">
                <i className="ri-check-line text-white text-sm"></i>
              </div>
            </div>

            <h1 className="mt-6 text-3xl font-bold text-white">
              {profile.cashierName}
            </h1>

            {showHeaderLevel && (
              <div className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 shadow-lg">
                <i className="ri-award-line mr-2 text-white"></i>
                <span className="text-xs font-bold tracking-wide text-white">
                  {profile.cashierLevel.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Kartu informasi profil */}
          <div className="bg-white rounded-3xl border border-gray-200/50 px-6 py-7 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <i className="ri-information-line text-white text-lg"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Informasi Profil</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Data singkat mengenai toko dan akun kasir
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Nama Toko" value={profile.storeName} icon="ri-store-2-line" />
              {profile.storePhone && (
                <InfoRow label="Telepon Toko" value={profile.storePhone} icon="ri-phone-line" />
              )}
              {profile.email && (
                <InfoRow label="Email" value={profile.email} icon="ri-mail-line" />
              )}
              {profile.address && (
                <InfoRow label="Alamat" value={profile.address} icon="ri-map-pin-2-line" />
              )}
            </div>
          </div>

          {/* Menu profil */}
          <div className="bg-white rounded-3xl border border-gray-200/50 px-6 py-7 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <i className="ri-menu-line text-white text-lg"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Menu Profil</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kelola pengaturan profil toko, karyawan, dan keamanan akun
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MenuTile
                icon="ri-store-2-line"
                title="Ubah Profil Toko"
                description="Nama toko, alamat, kontak, dan logo"
                href="/business-profile"
              />
              <MenuTile
                icon="ri-user-add-line"
                title="Karyawan"
                description="Kelola data dan akses karyawan"
                href="/employees"
              />
              <MenuTile
                icon="ri-qr-code-line"
                title="Upload QRIS"
                description="Atur kode QRIS untuk pembayaran non-tunai"
                href="/qris-upload"
              />
              <MenuTile
                icon="ri-file-list-2-line"
                title="Catatan Pengeluaran"
                description="Catat dan pantau pengeluaran operasional"
                href="/expenses"
              />
              <MenuTile
                icon="ri-lock-password-line"
                title="Ganti Kata Sandi"
                description="Perbarui kata sandi akun kasir"
                href="/change-password"
              />
              <MenuTile
                icon="ri-delete-bin-6-line"
                title="Tutup Akun"
                description="Nonaktifkan akun dan hentikan akses"
                href="/close-account"
                isDanger
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow(props: { label: string; value: string; icon?: string }) {
  const { label, value, icon } = props;

  return (
    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
          <span className={`${icon} text-base text-emerald-600`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">
          {label}
        </p>
        <p className="text-sm font-bold text-gray-900 truncate">
          {value || '-'}
        </p>
      </div>
    </div>
  );
}

function MenuTile(props: {
  icon: string;
  title: string;
  description: string;
  href: string;
  isDanger?: boolean;
}) {
  const { icon, title, description, href, isDanger } = props;

  return (
    <Link
      href={href}
      className={`flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
        isDanger
          ? 'border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 hover:from-red-100 hover:to-red-200 text-red-700 hover:shadow-lg'
          : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-emerald-300 hover:from-emerald-50 hover:to-emerald-100/50 text-gray-800 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${
            isDanger ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
          }`}
        >
          <span className={`${icon} text-xl`} />
        </div>
        <i className={`ri-arrow-right-s-line text-xl ${isDanger ? 'text-red-400' : 'text-emerald-400'} group-hover:translate-x-1 transition-transform`}></i>
      </div>
      <div>
        <p className="font-bold text-base mb-1">{title}</p>
        <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}
