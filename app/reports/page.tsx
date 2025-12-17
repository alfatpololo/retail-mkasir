'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

type PaymentMethod = 'Tunai' | 'Transfer' | 'E-Wallet' | string;

interface ApiSalesRow {
  tanggal: string;
  no_invoice: string;
  pelanggan: string;
  item: number;
  qty: number;
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  pembayaran: string;
  status: string;
}

interface ApiSalesSummary {
  total_transaksi: number;
  total_pendapatan: number;
  total_item_terjual: number;
  total_diskon: number;
}

interface ApiSalesResponse {
  success: boolean;
  message: string;
  data: {
    data: {
      rows: ApiSalesRow[];
      summary: ApiSalesSummary;
    };
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface SalesReportRow {
  id: number;
  tanggal: string;
  nomorInvoice: string;
  pelanggan: string;
  itemCount: number;
  qty: number;
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  metodePembayaran: PaymentMethod;
  status: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const toInputDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

export default function ReportsPage() {
  const today = useMemo(() => new Date(), []);

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<string>(''); // untuk input (bisa kosong)
  const [endDate, setEndDate] = useState<string>(''); // untuk input (bisa kosong)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [rows, setRows] = useState<SalesReportRow[]>([]);
  const [summary, setSummary] = useState<ApiSalesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        const jwtPin =
          typeof window !== 'undefined'
            ? localStorage.getItem('jwt_pin')
            : null;

        if (!jwtPin) {
          setError(
            'JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.'
          );
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '10');

        // jika input kosong, pakai tanggal hari ini sebagai default
        const effectiveStart = startDate || toInputDate(today);
        const effectiveEnd = endDate || toInputDate(today);

        if (effectiveStart) params.set('start_date', effectiveStart);
        if (effectiveEnd) params.set('end_date', effectiveEnd);
        if (search.trim()) params.set('search', search.trim());

        const response = await fetch(
          `${API_BASE_URL}/reports/laporan_penjualan?${params.toString()}`,
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

        const json: ApiSalesResponse = await response.json();

        const apiRows = json.data.data.rows || [];

        const mappedRows: SalesReportRow[] = apiRows.map((row, index) => ({
          id: index + 1 + (json.data.page - 1) * json.data.limit,
          tanggal: row.tanggal,
          nomorInvoice: row.no_invoice,
          pelanggan: row.pelanggan,
          itemCount: row.item,
          qty: row.qty,
          subtotal: row.subtotal,
          diskon: row.diskon,
          pajak: row.pajak,
          total: row.total,
          metodePembayaran:
            row.pembayaran.toLowerCase() === 'tunai'
              ? 'Tunai'
              : row.pembayaran.toLowerCase() === 'transfer'
              ? 'Transfer'
              : row.pembayaran.toLowerCase() === 'e-wallet'
              ? 'E-Wallet'
              : row.pembayaran,
          status: row.status === 'selesai' ? 'Lunas' : row.status,
        }));

        setRows(mappedRows);
        setSummary(json.data.data.summary);
        setTotalItems(json.data.total);
        setTotalPages(json.data.total_pages);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Gagal memuat laporan penjualan';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [page, startDate, endDate, search]);

  const totalTransaksi = summary?.total_transaksi ?? rows.length;
  const totalPendapatan = summary?.total_pendapatan ?? 0;
  const totalItemTerjual = summary?.total_item_terjual ?? 0;
  const totalDiskon = summary?.total_diskon ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pl-0 lg:pl-64 pb-10">
      <Sidebar />

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Laporan Penjualan
            </h1>
            <p className="text-gray-600 text-sm">
              Analisis dan ringkasan penjualan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
              <span className="ri-receipt-line text-white text-xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Total Transaksi</p>
              <p className="text-xl font-bold text-gray-900">
                {totalTransaksi}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
              <span className="ri-money-dollar-circle-line text-white text-xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Total Pendapatan</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(totalPendapatan)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center shadow-md">
              <span className="ri-box-3-line text-white text-xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Total Item Terjual</p>
              <p className="text-xl font-bold text-violet-600">
                {totalItemTerjual}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
              <span className="ri-percent-line text-white text-xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Total Diskon</p>
              <p className="text-xl font-bold text-amber-600">
                {formatCurrency(totalDiskon)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 flex flex-col md:flex-row items-center gap-3 border-b border-gray-200">
            <div className="flex-1 w-full relative">
              <span className="ri-search-line w-5 h-5 flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari invoice atau pelanggan..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <span className="ri-download-2-line text-sm" />
              Export
            </button>
          </div>

          {error && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-t border-red-100">
              {error}
            </div>
          )}

          {loading && !error && (
            <div className="px-4 py-3 text-sm text-gray-500 border-t border-gray-100">
              Memuat data laporan penjualan...
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    No. Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pelanggan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Diskon
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pajak
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pembayaran
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!loading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Tidak ada data laporan.
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {new Date(row.tanggal).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {row.nomorInvoice}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {row.pelanggan}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700 whitespace-nowrap">
                      {row.itemCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700 whitespace-nowrap">
                      {row.qty}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(row.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600 whitespace-nowrap">
                      -{formatCurrency(row.diskon)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(row.pajak)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900 whitespace-nowrap">
                      {formatCurrency(row.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {row.metodePembayaran}
                    </td>
                    <td className="px-4 py-3 text-sm text-center whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Menampilkan {rows.length} dari {totalItems} transaksi (halaman{' '}
              {page} dari {totalPages})
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
