'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { StallProfile, getStallProfile, updateStallProfile } from '@/utils/stallProfile';

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<StallProfile>({
    nama: '',
    alamat: '',
    provinsi: '',
    kota: '',
    notelp: '',
    email: '',
    jam_mulai_operasional: '08:00:00',
    jam_selesai_operasional: '22:00:00',
    nama_pemilik: '',
    kode: '',
    lat: null,
    long: null,
    tampil_detik_presensi: false,
    status: true,
    status_pajak: true,
    pajak: 0.1,
    status_biaya_lainnya: false,
    tipe_biaya_lainnya: 'nominal',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getJwtPin = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jwt_pin');
    }
    return null;
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    try {
      const { useMainStore } = require('@/utils/stores');
      const { setNotificationError, setNotificationSuccess } = useMainStore.getState();
      if (type === 'success' && setNotificationSuccess) {
        setNotificationSuccess(message);
      } else if (type === 'error' && setNotificationError) {
        setNotificationError(message);
      } else {
        alert(message);
      }
    } catch {
      alert(message);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const jwtPin = getJwtPin();
        if (!jwtPin) {
          throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
        }

        const data = await getStallProfile(jwtPin);
        setProfile({
          ...profile,
          ...data,
        });
      } catch (error: any) {
        showNotification(error?.message || 'Gagal memuat profil usaha', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: keyof StallProfile, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const jwtPin = getJwtPin();
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const payload: StallProfile = {
        ...profile,
        lat:
          profile.lat !== null && profile.lat !== undefined
            ? Number(profile.lat)
            : null,
        long:
          profile.long !== null && profile.long !== undefined
            ? Number(profile.long)
            : null,
      };

      const updated = await updateStallProfile(payload, jwtPin);
      setProfile((prev) => ({
        ...prev,
        ...updated,
      }));
      showNotification('Profil usaha berhasil disimpan', 'success');
    } catch (error: any) {
      showNotification(error?.message || 'Gagal menyimpan profil usaha', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pl-0 lg:pl-64 pb-10">
      <Sidebar />

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Profil Usaha</h1>
          <p className="text-gray-600 text-sm">
            Atur informasi warung Anda seperti nama, alamat, jam operasional, dan pengaturan pajak.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex items-start gap-6 pb-6 border-b border-gray-200">
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                {logoFile ? (
                  <img
                    src={URL.createObjectURL(logoFile)}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="ri-store-2-line w-12 h-12 flex items-center justify-center text-gray-400"></span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Logo Usaha</h3>
                <p className="text-xs text-gray-500 mb-3">
                  (Opsional) Upload logo usaha Anda (PNG, JPG max 2MB). Saat ini logo belum dikirim ke API.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Pilih File
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Warung</label>
                <input
                  type="text"
                  value={profile.nama}
                  onChange={(e) => handleChange('nama', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik</label>
                <input
                  type="text"
                  value={profile.nama_pemilik}
                  onChange={(e) => handleChange('nama_pemilik', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea
                value={profile.alamat}
                onChange={(e) => handleChange('alamat', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                <input
                  type="text"
                  value={profile.provinsi}
                  onChange={(e) => handleChange('provinsi', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kota/Kabupaten</label>
                <input
                  type="text"
                  value={profile.kota}
                  onChange={(e) => handleChange('kota', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                <input
                  type="tel"
                  value={profile.notelp}
                  onChange={(e) => handleChange('notelp', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Warung</label>
                <input
                  type="text"
                  value={profile.kode}
                  onChange={(e) => handleChange('kode', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai Operasional</label>
                <input
                  type="time"
                  value={profile.jam_mulai_operasional?.substring(0, 5) || ''}
                  onChange={(e) =>
                    handleChange('jam_mulai_operasional', `${e.target.value}:00`)
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai Operasional</label>
                <input
                  type="time"
                  value={profile.jam_selesai_operasional?.substring(0, 5) || ''}
                  onChange={(e) =>
                    handleChange('jam_selesai_operasional', `${e.target.value}:00`)
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  value={profile.lat ?? ''}
                  onChange={(e) =>
                    handleChange('lat', e.target.value === '' ? null : Number(e.target.value))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  value={profile.long ?? ''}
                  onChange={(e) =>
                    handleChange('long', e.target.value === '' ? null : Number(e.target.value))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Pengaturan Pajak</label>
                <div className="flex items-center gap-3">
                  <input
                    id="status_pajak"
                    type="checkbox"
                    checked={profile.status_pajak}
                    onChange={(e) => handleChange('status_pajak', e.target.checked)}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  />
                  <label htmlFor="status_pajak" className="text-sm text-gray-700">
                    Aktifkan pajak penjualan
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Besaran Pajak (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={profile.pajak * 100}
                    onChange={(e) =>
                      handleChange('pajak', Number(e.target.value || 0) / 100)
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Biaya Lainnya
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="status_biaya_lainnya"
                    type="checkbox"
                    checked={profile.status_biaya_lainnya}
                    onChange={(e) =>
                      handleChange('status_biaya_lainnya', e.target.checked)
                    }
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  />
                  <label htmlFor="status_biaya_lainnya" className="text-sm text-gray-700">
                    Aktifkan biaya layanan lain (service charge, dll)
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Tipe Biaya Lainnya
                  </label>
                  <select
                    value={profile.tipe_biaya_lainnya}
                    onChange={(e) =>
                      handleChange('tipe_biaya_lainnya', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="nominal">Nominal</option>
                    <option value="persentase">Persentase</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="tampil_detik_presensi"
                type="checkbox"
                checked={profile.tampil_detik_presensi}
                onChange={(e) =>
                  handleChange('tampil_detik_presensi', e.target.checked)
                }
                className="h-4 w-4 text-green-600 border-gray-300 rounded"
              />
              <label htmlFor="tampil_detik_presensi" className="text-sm text-gray-700">
                Tampilkan detik pada layar presensi
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="status_warung"
                type="checkbox"
                checked={profile.status}
                onChange={(e) => handleChange('status', e.target.checked)}
                className="h-4 w-4 text-green-600 border-gray-300 rounded"
              />
              <label htmlFor="status_warung" className="text-sm text-gray-700">
                Warung Aktif
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                disabled={isLoading || isSaving}
                onClick={() => window.history.back()}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || isSaving}
                className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>

            {isLoading && (
              <p className="text-xs text-gray-500 text-right mt-2">
                Memuat data profil usaha...
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
