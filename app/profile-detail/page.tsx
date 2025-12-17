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

  const showHeaderLevel = Boolean(profile.cashierLevel);

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar />

      <div className="max-w-5xl mx-auto px-6 py-8 pb-12">
        {/* Header profil */}
        <div className="w-full bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl px-6 pt-8 pb-10 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="rounded-full border-4 border-white shadow-lg overflow-hidden bg-white w-28 h-28 flex items-center justify-center">
                <span className="ri-user-3-line text-4xl text-emerald-500" />
              </div>
            </div>

            <h1 className="mt-4 text-2xl font-bold text-white">
              {profile.cashierName}
            </h1>

            {showHeaderLevel && (
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-white/20 border border-white/40">
                <span className="text-xs font-semibold tracking-wide text-white">
                  {profile.cashierLevel.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="-mt-8 space-y-6">
          {/* Kartu informasi profil */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <span className="ri-information-line text-lg" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Informasi Profil
                </p>
                <p className="text-xs text-gray-500">
                  Data singkat mengenai toko dan akun kasir.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900">Menu Profil</p>
              <p className="text-xs text-gray-500">
                Kelola pengaturan profil toko, karyawan, dan keamanan akun.
              </p>
            </div>

            <div className="space-y-2">
              <MenuTile
                icon="ri-store-2-line"
                title="Ubah Profil Toko"
                description="Nama toko, alamat, kontak, dan logo."
                href="/business-profile"
              />
              <MenuTile
                icon="ri-user-add-line"
                title="Karyawan"
                description="Kelola data dan akses karyawan."
                href="/employees"
              />
              <MenuTile
                icon="ri-qr-code-line"
                title="Upload QRIS"
                description="Atur kode QRIS untuk pembayaran non-tunai."
                href="/qris-upload"
              />
              <MenuTile
                icon="ri-file-list-2-line"
                title="Catatan Pengeluaran"
                description="Catat dan pantau pengeluaran operasional."
                href="/expenses"
              />
              <MenuTile
                icon="ri-lock-password-line"
                title="Ganti Kata Sandi"
                description="Perbarui kata sandi akun kasir."
                href="/change-password"
              />
              <MenuTile
                icon="ri-delete-bin-6-line"
                title="Tutup Akun"
                description="Nonaktifkan akun dan hentikan akses."
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
    <div className="flex items-start gap-3">
      {icon && (
        <span className={`${icon} text-base text-gray-400 mt-0.5`} />
      )}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">
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
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer ${
        isDanger
          ? 'border-red-100 bg-red-50/40 hover:bg-red-50 text-red-700'
          : 'border-gray-100 bg-gray-50/60 hover:bg-gray-100 text-gray-800'
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          isDanger ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'
        }`}
      >
        <span className={`${icon} text-lg`} />
      </div>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <span className="ri-arrow-right-s-line text-lg text-gray-400" />
    </Link>
  );
}


