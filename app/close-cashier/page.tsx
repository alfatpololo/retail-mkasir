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
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)

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

  const handleTutupKasir = async () => {
    if (!confirm('Apakah Anda yakin ingin menutup kasir? Setelah ditutup, Anda akan logout dari sistem.')) {
      return;
    }

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-amber-50/30 relative">
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

      <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 2xl:pl-72 2xl:pr-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
              <i className="ri-safe-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tutup Kasir</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Ringkasan penjualan hari ini sebelum menutup kasir</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl border border-gray-200/50 p-8 shadow-xl">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium text-gray-600">Memuat data ringkasan...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-3xl border-2 border-red-200 p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600">
              <i className="ri-error-warning-line text-2xl"></i>
              <p className="text-sm font-semibold">{error}</p>
            </div>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <i className="ri-receipt-line text-white text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-700">Total Transaksi</p>
                    <p className="text-xl font-bold text-blue-900">{data.total_transaksi}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <i className="ri-money-dollar-circle-line text-white text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-emerald-700">Total Penjualan</p>
                    <p className="text-lg font-bold text-emerald-900">Rp {data.total.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border border-green-200 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                    <i className="ri-money-cny-circle-line text-white text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-700">Tunai</p>
                    <p className="text-lg font-bold text-green-900">Rp {data.tunai.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border border-purple-200 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                    <i className="ri-bank-card-line text-white text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-purple-700">Non Tunai</p>
                    <p className="text-lg font-bold text-purple-900">Rp {data.nontunai.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Card */}
            <div className="bg-white rounded-3xl border border-gray-200/50 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <i className="ri-file-list-3-line text-white text-lg"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Rincian Transaksi</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <i className="ri-time-line text-gray-400"></i>
                    <span className="text-sm font-medium text-gray-600">Waktu Buka</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{data.waktu_buka}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <i className="ri-price-tag-3-line text-red-500"></i>
                      <span className="text-sm font-medium text-gray-600">Diskon</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">Rp {data.diskon.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <i className="ri-file-paper-2-line text-amber-500"></i>
                      <span className="text-sm font-medium text-gray-600">Pajak</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">Rp {data.pajak.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <i className="ri-wallet-3-line text-purple-500"></i>
                      <span className="text-sm font-medium text-gray-600">Biaya Lainnya</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">Rp {data.biaya_lainnya.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-3">
                      <i className="ri-safe-line text-amber-600"></i>
                      <span className="text-sm font-semibold text-amber-700">Saldo Kas</span>
                    </div>
                    <span className="text-base font-bold text-amber-900">Rp {data.saldo_kas.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="bg-white rounded-3xl border-2 border-amber-200 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <i className="ri-alert-line text-amber-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Siap untuk menutup kasir?</p>
                    <p className="text-xs text-gray-500">Setelah ditutup, Anda akan logout dari sistem</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTutupKasir}
                  disabled={processing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98] min-h-[44px] touch-manipulation"
                >
                  {processing ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <i className="ri-lock-line"></i>
                      Tutup Kasir Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
