'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

type Status = string;
type Frekuensi = string;

interface ApiCustomerReportRow {
  customer_id: number;
  nama: string;
  status: string;
  total_transaksi: number;
  total_belanja: number;
  rata_rata_transaksi: number;
  kunjungan_terakhir: string;
  frekuensi: string;
}

interface ApiCustomerReportResponse {
  success: boolean;
  message: string;
  data: {
    data: ApiCustomerReportRow[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface CustomerReportRow {
  id: number;
  nama: string;
  status: Status;
  totalTransaksi: number;
  totalBelanja: number;
  rataTransaksi: number;
  kunjunganTerakhir: string; // ISO date
  frekuensi: Frekuensi;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

export default function CustomerReportPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'VIP' | 'Regular'>(
    'all'
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [rows, setRows] = useState<CustomerReportRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        setError('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (startDate) {
        params.set('start_date', startDate);
      }
      if (endDate) {
        params.set('end_date', endDate);
      }

      const response = await fetch(
        `${API_BASE_URL}/reports/laporan_customers?${params.toString()}`,
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

      const json: ApiCustomerReportResponse = await response.json();

      const mapped: CustomerReportRow[] = json.data.data.map((item) => ({
        id: item.customer_id,
        nama: item.nama,
        status: item.status,
        totalTransaksi: item.total_transaksi,
        totalBelanja: item.total_belanja,
        rataTransaksi: item.rata_rata_transaksi,
        kunjunganTerakhir: item.kunjungan_terakhir,
        frekuensi: item.frekuensi,
      }));

      setRows(mapped);
      setTotalItems(json.data.total);
      setTotalPages(json.data.total_pages);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal memuat laporan pelanggan';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, startDate, endDate]);

  const totalPelanggan = rows.length;
  const totalPendapatan = rows.reduce(
    (sum, row) => sum + row.totalBelanja,
    0
  );
  const totalTransaksi = rows.reduce(
    (sum, row) => sum + row.totalTransaksi,
    0
  );
  const rataRataBelanja =
    rows.length > 0 ? Math.round(totalPendapatan / rows.length) : 0;

  const avatarColor = (nama: string) => {
    const colors = [
      'bg-emerald-50 text-emerald-700',
      'bg-blue-50 text-blue-700',
      'bg-indigo-50 text-indigo-700',
      'bg-amber-50 text-amber-700',
      'bg-pink-50 text-pink-700',
    ];
    if (!nama) return colors[0];
    const code = nama.charCodeAt(0) + nama.charCodeAt(nama.length - 1);
    return colors[code % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-0 2xl:pl-0 2xl:pl-64 pb-10">
      <Sidebar />

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Laporan Pelanggan
            </h1>
            <p className="text-gray-600 text-sm">
              Analisis perilaku dan kontribusi pelanggan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <span className="ri-user-3-line text-indigo-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Pelanggan</p>
              <p className="text-xl font-bold text-gray-900">{totalPelanggan}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <span className="ri-money-dollar-circle-line text-emerald-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Pendapatan</p>
              <p className="text-xl font-bold text-emerald-700">
                {formatCurrency(totalPendapatan)}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <span className="ri-shopping-cart-2-line text-violet-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Transaksi</p>
              <p className="text-xl font-bold text-violet-700">
                {totalTransaksi}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <span className="ri-bar-chart-2-line text-amber-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Rata-rata Belanja</p>
              <p className="text-xl font-bold text-amber-700">
                {formatCurrency(rataRataBelanja)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 flex flex-col md:flex-row items-center gap-3 border-b border-gray-200">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | 'VIP' | 'Regular')
                }
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[140px]"
              >
                <option value="all">Semua Status</option>
                <option value="VIP">VIP</option>
                <option value="Regular">Regular</option>
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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <span className="ri-download-2-line text-sm" />
              Export
            </button>
          </div>

          {error && (
            <div className="px-4 py-3 text-sm text-red-600 border-t border-gray-200">
              {error}
            </div>
          )}

          {loading && !error && (
            <div className="px-4 py-4 text-sm text-gray-500 border-t border-gray-200">
              Memuat laporan pelanggan...
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nama Pelanggan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Transaksi
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Belanja
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rata-rata Transaksi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kunjungan Terakhir
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Frekuensi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!loading && !error && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Tidak ada data pelanggan.
                    </td>
                  </tr>
                )}

                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${avatarColor(
                            row.nama
                          )}`}
                        >
                          {row.nama[0]}
                        </span>
                        <span>{row.nama}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                      {row.status === 'VIP' ? (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          VIP
                        </span>
                      ) : (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {row.totalTransaksi.toLocaleString('id-ID')} transaksi
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-emerald-700 whitespace-nowrap">
                      {formatCurrency(row.totalBelanja)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-700 whitespace-nowrap">
                      {formatCurrency(row.rataTransaksi)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {new Date(row.kunjunganTerakhir).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4 text-sm text-center whitespace-nowrap">
                      {row.frekuensi === 'Tinggi' && (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          Tinggi
                        </span>
                      )}
                      {row.frekuensi === 'Sedang' && (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          Sedang
                        </span>
                      )}
                      {row.frekuensi === 'Rendah' && (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
                          Rendah
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Menampilkan {rows.length} dari {totalItems} pelanggan (halaman {page}{' '}
              dari {totalPages})
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
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


