'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

interface StockHistoryItem {
  id: number;
  tanggal_waktu: string;
  produk: string;
  sku: string;
  tipe: 'in' | 'out' | 'adjustment';
  tipe_label: string;
  jumlah: number;
  jumlah_formatted: string;
  stok_sebelum: number;
  stok_sesudah: number;
  stok_sebelum_formatted: string;
  stok_sesudah_formatted: string;
  user: string;
  keterangan: string;
  referensi: string;
}

interface StockHistorySummary {
  total_transaksi: number;
  stok_masuk: number;
  stok_keluar: number;
  penyesuaian: number;
}

interface ApiStockHistoryResponse {
  success: boolean;
  message: string;
  data: {
    data: {
      data: StockHistoryItem[];
      summary: StockHistorySummary;
    };
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

type FilterType = 'Semua Tipe' | 'Masuk' | 'Keluar' | 'Penyesuaian';

export default function StockHistoryPage() {
  const [historyItems, setHistoryItems] = useState<StockHistoryItem[]>([]);
  const [summary, setSummary] = useState<StockHistorySummary>({
    total_transaksi: 0,
    stok_masuk: 0,
    stok_keluar: 0,
    penyesuaian: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('Semua Tipe');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStockHistory = useCallback(
    async (currentPage: number) => {
      try {
        setLoading(true);
        setError(null);

        const jwtPin =
          typeof window !== 'undefined'
            ? localStorage.getItem('jwt_pin')
            : null;

        if (!jwtPin) {
          setError('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        params.set('page', String(currentPage));
        params.set('limit', '10');

        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }

        // Map filter ke tipe API
        if (selectedFilter === 'Masuk') {
          params.set('tipe', 'in');
        } else if (selectedFilter === 'Keluar') {
          params.set('tipe', 'out');
        } else if (selectedFilter === 'Penyesuaian') {
          params.set('tipe', 'adjustment');
        }

        if (startDate) {
          params.set('start_date', startDate);
        }
        if (endDate) {
          params.set('end_date', endDate);
        }

        const response = await fetch(
          `${API_BASE_URL}/stock/history?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwtPin}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const json: ApiStockHistoryResponse = await response.json();

        setHistoryItems(json.data.data.data);
        setSummary(json.data.data.summary);
        setPage(json.data.page);
        setTotalPages(json.data.total_pages);
        setTotalItems(json.data.total);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Gagal memuat riwayat stok';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, selectedFilter, startDate, endDate]
  );

  useEffect(() => {
    setPage(1);
    fetchStockHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, startDate, endDate]);

  // Search dengan debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchStockHistory(1);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Fetch data saat page berubah
  useEffect(() => {
    fetchStockHistory(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleRefresh = () => {
    setPage(1);
    setHistoryItems([]);
    fetchStockHistory(1);
  };

  const getTypeColor = (tipe: string) => {
    if (tipe === 'adjustment') {
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
      };
    } else if (tipe === 'in') {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
      };
    } else {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
      };
    }
  };

  const getTypeIcon = (tipe: string) => {
    if (tipe === 'adjustment') {
      return 'ri-edit-line';
    } else if (tipe === 'in') {
      return 'ri-arrow-down-line';
    } else {
      return 'ri-arrow-up-line';
    }
  };

  const getJumlahColor = (tipe: string) => {
    if (tipe === 'adjustment') {
      return 'text-orange-600';
    } else if (tipe === 'in') {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pl-0 lg:pl-64">
      <Sidebar />

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Riwayat Stok
          </h1>
          <p className="text-gray-600 text-sm">Pantau pergerakan stok barang Anda</p>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
                <span className="ri-file-list-3-line text-white text-xl"></span>
              </div>
            </div>
            <div className="text-xs font-medium text-gray-600 mb-1">Total Transaksi</div>
            <div className="text-2xl font-bold text-emerald-600">
              {summary.total_transaksi}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
                <span className="ri-arrow-down-line text-white text-xl"></span>
              </div>
            </div>
            <div className="text-xs font-medium text-gray-600 mb-1">Stok Masuk</div>
            <div className="text-2xl font-bold text-emerald-600">
              {summary.stok_masuk}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-md">
                <span className="ri-arrow-up-line text-white text-xl"></span>
              </div>
            </div>
            <div className="text-xs font-medium text-gray-600 mb-1">Stok Keluar</div>
            <div className="text-2xl font-bold text-red-600">
              {summary.stok_keluar}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
                <span className="ri-edit-line text-white text-xl"></span>
              </div>
            </div>
            <div className="text-xs font-medium text-gray-600 mb-1">Penyesuaian</div>
            <div className="text-2xl font-bold text-amber-600">
              {summary.penyesuaian}
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 md:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <span className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></span>
                <input
                  type="text"
                  placeholder="Cari produk atau SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Filter Tipe */}
            <div className="w-full lg:w-48">
              <select
                value={selectedFilter}
                onChange={(e) => {
                  setSelectedFilter(e.target.value as FilterType);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Semua Tipe">Semua Tipe</option>
                <option value="Masuk">Masuk</option>
                <option value="Keluar">Keluar</option>
                <option value="Penyesuaian">Penyesuaian</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="flex items-center text-gray-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <span className="ri-refresh-line"></span>
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <span className="ri-error-warning-line"></span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Data Table - Desktop */}
        {!loading && historyItems.length > 0 && (
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tanggal & Waktu
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stok Sebelum
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stok Sesudah
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historyItems.map((item) => {
                    const typeColor = getTypeColor(item.tipe);
                    const jumlahColor = getJumlahColor(item.tipe);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.tanggal_waktu}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.produk}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${typeColor.bg} ${typeColor.text} border ${typeColor.border}`}
                          >
                            <span className={getTypeIcon(item.tipe)}></span>
                            {item.tipe_label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                          <span className={jumlahColor}>
                            {item.jumlah_formatted}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                          {item.stok_sebelum_formatted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                          {item.stok_sesudah_formatted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.user}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {item.keterangan}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan {historyItems.length} dari {totalItems} transaksi
                (halaman {page} dari {totalPages})
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages || loading}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data List - Mobile */}
        {!loading && historyItems.length > 0 && (
          <>
            <div className="lg:hidden space-y-4">
              {historyItems.map((item) => {
                const typeColor = getTypeColor(item.tipe);
                const jumlahColor = getJumlahColor(item.tipe);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {item.produk}
                        </div>
                        <div className="text-xs text-gray-500">{item.sku}</div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${typeColor.bg} ${typeColor.text} border ${typeColor.border}`}
                      >
                        <span className={getTypeIcon(item.tipe)}></span>
                        {item.tipe_label}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tanggal:</span>
                        <span className="text-gray-900 font-medium">
                          {item.tanggal_waktu}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Jumlah:</span>
                        <span className={`font-semibold ${jumlahColor}`}>
                          {item.jumlah_formatted}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stok Sebelum:</span>
                        <span className="text-gray-900">
                          {item.stok_sebelum_formatted}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stok Sesudah:</span>
                        <span className="text-gray-900">
                          {item.stok_sesudah_formatted}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">User:</span>
                        <span className="text-gray-900">{item.user}</span>
                      </div>
                      {item.keterangan && (
                        <div className="pt-2 border-t border-gray-100">
                          <div className="text-gray-500 text-xs mb-1">
                            Keterangan:
                          </div>
                          <div className="text-gray-900 text-xs">
                            {item.keterangan}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls - Mobile */}
            <div className="lg:hidden bg-white rounded-xl border border-gray-200 p-4 mt-4">
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-600 text-center">
                  Menampilkan {historyItems.length} dari {totalItems} transaksi
                  (halaman {page} dari {totalPages})
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1 || loading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={page === totalPages || loading}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {loading && historyItems.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading &&
          historyItems.length === 0 &&
          !error &&
          searchQuery === '' &&
          selectedFilter === 'Semua Tipe' &&
          !startDate &&
          !endDate && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <span className="ri-inbox-line text-6xl text-gray-300 mb-4 inline-block"></span>
              <p className="text-gray-600">Tidak ada riwayat stok</p>
            </div>
          )}

        {/* No Results State */}
        {!loading &&
          historyItems.length === 0 &&
          !error &&
          (searchQuery !== '' ||
            selectedFilter !== 'Semua Tipe' ||
            startDate ||
            endDate) && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <span className="ri-search-line text-6xl text-gray-300 mb-4 inline-block"></span>
              <p className="text-gray-600">
                Tidak ada data yang sesuai dengan filter
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
