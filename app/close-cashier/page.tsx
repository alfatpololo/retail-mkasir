'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  fetchTutupKasirData,
  tutupKasirApi,
  TutupKasirData,
} from '@/utils/cashierSession';
import { logoutUser } from '@/utils/storage';

export default function CloseCashierPage() {
  const router = useRouter();
  const [data, setData] = useState<TutupKasirData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const d = await fetchTutupKasirData();
        if (!d) {
          setError('Gagal mengambil data ringkasan kasir.');
        } else {
          setData(d);
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Gagal memuat data ringkasan kasir.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleTutupKasir = async () => {
    try {
      setProcessing(true);
      await tutupKasirApi('Tutup kasir dari menu Sidebar');
      alert('Kasir berhasil ditutup');
      // Logout dan redirect ke login
      logoutUser();
      router.push('/login');
    } catch (e) {
      alert(
        `Gagal tutup kasir: ${
          e instanceof Error ? e.message : 'Terjadi kesalahan'
        }`
      );
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Tutup Kasir</h1>

        {loading && (
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-600">Memuat data ringkasan...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && data && (
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div>
              <p className="text-sm text-gray-600">Waktu buka</p>
              <p className="text-base font-semibold text-gray-900">
                {data.waktu_buka}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Total transaksi</p>
                <p className="font-semibold">{data.total_transaksi}</p>
              </div>
              <div>
                <p className="text-gray-600">Total penjualan</p>
                <p className="font-semibold">
                  Rp {data.total.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Tunai</p>
                <p className="font-semibold">
                  Rp {data.tunai.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Non tunai</p>
                <p className="font-semibold">
                  Rp {data.nontunai.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Diskon</p>
                <p className="font-semibold">
                  Rp {data.diskon.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Pajak</p>
                <p className="font-semibold">
                  Rp {data.pajak.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Biaya lainnya</p>
                <p className="font-semibold">
                  Rp {data.biaya_lainnya.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Saldo kas</p>
                <p className="font-semibold">
                  Rp {data.saldo_kas.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTutupKasir}
              disabled={processing}
              className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processing ? 'Memproses...' : 'Tutup Kasir Sekarang'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


