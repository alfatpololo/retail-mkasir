'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

type TrendStatus = 'Naik' | 'Turun' | 'Stabil';

interface BestsellerProductRow {
  id: number | string;
  sku: string;
  nama: string;
  kategori: string;
  terjual: number;
  pendapatan: number;
  stokTersisa: number;
  tren: TrendStatus;
}

interface BestsellerSummary {
  produkTerlarisNama: string;
  produkTerlarisSku: string;
  produkTerlarisQty: number;
  totalTerjual: number;
  totalPendapatan: number;
  rataRataTerjual: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

export default function BestsellerProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [rows, setRows] = useState<BestsellerProductRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [summary, setSummary] = useState<BestsellerSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBestseller = useCallback(async () => {
    if (typeof window === 'undefined') return;

    setLoading(true);
    setError(null);

    try {
      const jwtPin =
        typeof window !== 'undefined'
          ? localStorage.getItem('jwt_pin')
          : null;

      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan, silakan login PIN terlebih dahulu.');
      }

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (startDate) params.set('tanggal_awal', startDate);
      if (endDate) params.set('tanggal_akhir', endDate);

      const response = await fetch(
        `${API_BASE_URL}/reports/produk_terlaris?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
        }
      );

      const json = await response.json().catch(() => ({} as any));

      if (!response.ok || json.success === false) {
        throw new Error(
          json.message || 'Gagal mengambil data produk terlaris.'
        );
      }

      const apiRows = (json.data?.data?.rows ?? []) as any[];
      const mappedRows: BestsellerProductRow[] = apiRows.map((row) => ({
        id: row.product_id ?? row.id ?? row.sku,
        sku: row.sku,
        nama: row.nama_produk,
        kategori: row.kategori,
        terjual: row.total_qty ?? 0,
        pendapatan: row.total_pendapatan ?? 0,
        stokTersisa: row.stok_tersisa ?? 0,
        // Tren belum tersedia dari API, sementara gunakan "Stabil"
        tren: 'Stabil',
      }));

      setRows(mappedRows);

      const meta = json.data ?? {};
      if (typeof meta.total === 'number') {
        setTotalItems(meta.total);
      }
      if (typeof meta.total_pages === 'number') {
        setTotalPages(meta.total_pages);
      } else if (typeof meta.totalPages === 'number') {
        setTotalPages(meta.totalPages);
      }

      const apiSummary = json.data?.data?.summary;
      if (apiSummary) {
        setSummary({
          produkTerlarisNama: apiSummary.produk_terlaris?.nama_produk ?? '',
          produkTerlarisSku: apiSummary.produk_terlaris?.sku ?? '',
          produkTerlarisQty: apiSummary.produk_terlaris?.total_qty ?? 0,
          totalTerjual: apiSummary.total_terjual ?? 0,
          totalPendapatan: apiSummary.total_pendapatan ?? 0,
          rataRataTerjual: apiSummary.rata_rata_terjual ?? 0,
        });
      } else {
        setSummary(null);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengambil data produk terlaris.';
      setError(message);
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page, limit]);

  useEffect(() => {
    fetchBestseller();
  }, [fetchBestseller]);

  const filteredData = useMemo(() => {
    return rows.filter((row) => {
      const byCategory =
        selectedCategory === 'all' || row.kategori === selectedCategory;
      return byCategory;
    });
  }, [rows, selectedCategory]);

  const totalTerjual =
    summary?.totalTerjual ??
    filteredData.reduce((sum, row) => sum + row.terjual, 0);
  const totalPendapatan =
    summary?.totalPendapatan ??
    filteredData.reduce((sum, row) => sum + row.pendapatan, 0);
  const rataRataTerjual =
    summary?.rataRataTerjual ??
    (filteredData.length > 0
      ? Math.round(totalTerjual / filteredData.length)
      : 0);

  const produkTerlarisNama =
    summary?.produkTerlarisNama ?? filteredData[0]?.nama ?? '-';
  const produkTerlarisSku =
    summary?.produkTerlarisSku ?? filteredData[0]?.sku ?? '';
  const produkTerlarisQty =
    summary?.produkTerlarisQty ?? filteredData[0]?.terjual ?? 0;

  const kategoriOptions = Array.from(new Set(rows.map((row) => row.kategori)));

  return (
    <div className="min-h-screen bg-gray-50 pl-0 2xl:pl-0 2xl:pl-64 pb-10">
      <Sidebar />

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Produk Terlaris
            </h1>
            <p className="text-gray-600 text-sm">
              Analisis produk dengan penjualan tertinggi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 col-span-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <span className="ri-star-smile-line text-indigo-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Produk Terlaris</p>
              <p className="text-sm font-semibold text-gray-900">
                {produkTerlarisNama}
              </p>
              {produkTerlarisNama !== '-' && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {produkTerlarisQty} unit terjual
                  {produkTerlarisSku ? ` (${produkTerlarisSku})` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <span className="ri-shopping-bag-3-line text-emerald-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Terjual</p>
              <p className="text-xl font-bold text-emerald-700">
                {totalTerjual}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <span className="ri-money-dollar-circle-line text-violet-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Pendapatan</p>
              <p className="text-xl font-bold text-violet-700">
                {formatCurrency(totalPendapatan)}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <span className="ri-bar-chart-2-line text-amber-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Rata-rata Terjual</p>
              <p className="text-xl font-bold text-amber-700">
                {rataRataTerjual}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 flex flex-col md:flex-row items-center gap-3 border-b border-gray-200">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[160px]"
              >
                <option value="all">Semua Kategori</option>
                {kategoriOptions.map((kategori) => (
                  <option key={kategori} value={kategori}>
                    {kategori}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchBestseller()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500 text-xs font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer"
            >
              <span className="ri-refresh-line text-sm" />
              Terapkan Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Peringkat
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nama Produk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Terjual
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pendapatan
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stok Tersisa
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tren
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Memuat data produk terlaris...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-sm text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Tidak ada data produk terlaris.
                    </td>
                  </tr>
                )}

                {filteredData.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {row.sku}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {row.nama}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {row.kategori}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-emerald-700 whitespace-nowrap">
                      {row.terjual.toLocaleString('id-ID')} unit
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900 whitespace-nowrap">
                      {formatCurrency(row.pendapatan)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          row.stokTersisa > 100
                            ? 'bg-green-50 text-green-700'
                            : row.stokTersisa > 20
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {row.stokTersisa.toLocaleString('id-ID')} unit
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-center whitespace-nowrap">
                      {row.tren === 'Naik' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <span className="ri-arrow-up-s-line" />
                          Naik
                        </span>
                      )}
                      {row.tren === 'Turun' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          <span className="ri-arrow-down-s-line" />
                          Turun
                        </span>
                      )}
                      {row.tren === 'Stabil' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
                          <span className="ri-subtract-line" />
                          Stabil
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Menampilkan{' '}
              <span className="font-semibold">
                {filteredData.length > 0 ? (page - 1) * limit + 1 : 0}
              </span>{' '}
              -
              <span className="font-semibold">
                {Math.min(page * limit, totalItems)}
              </span>{' '}
              dari <span className="font-semibold">{totalItems}</span> produk
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  page <= 1 || loading
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="ri-arrow-left-s-line mr-1" />
                Sebelumnya
              </button>

              <span className="text-xs text-gray-500">
                Halaman{' '}
                <span className="font-semibold">{page}</span> dari{' '}
                <span className="font-semibold">
                  {totalPages > 0 ? totalPages : 1}
                </span>
              </span>

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() =>
                  setPage((p) =>
                    totalPages ? Math.min(totalPages, p + 1) : p + 1
                  )
                }
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  page >= totalPages || loading
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Berikutnya
                <span className="ri-arrow-right-s-line ml-1" />
              </button>

              <select
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(Number(e.target.value) || 10);
                }}
                className="ml-2 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={10}>10 / halaman</option>
                <option value={25}>25 / halaman</option>
                <option value={50}>50 / halaman</option>
                <option value={100}>100 / halaman</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

