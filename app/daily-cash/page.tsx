'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';
import { getBukakasId } from '@/utils/cashierSession';

type CashType = 'masuk' | 'keluar';

interface ApiDailyCashRow {
  tanggal: string;
  jenis: CashType;
  keterangan: string;
  kategori: string;
  metode: string;
  nominal: number;
  operator?: string;
}

interface ApiDailyCashSummary {
  saldo_awal: number;
  kas_masuk: number;
  kas_keluar: number;
  saldo_akhir: number;
}

interface ApiDailyCashResponse {
  success: boolean;
  message: string;
  data: {
    data: {
      rows: ApiDailyCashRow[];
      summary: ApiDailyCashSummary;
    };
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
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

export default function DailyCashPage() {
  const today = useMemo(() => new Date(), []);

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<string>(''); // boleh kosong, default hari ini
  const [endDate, setEndDate] = useState<string>(''); // boleh kosong, default hari ini
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [rows, setRows] = useState<ApiDailyCashRow[]>([]);
  const [summary, setSummary] = useState<ApiDailyCashSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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
        params.set('page', String(page));
        params.set('limit', '10');

        const effectiveStart = startDate || toInputDate(today);
        const effectiveEnd = endDate || toInputDate(today);

        params.set('start_date', effectiveStart);
        params.set('end_date', effectiveEnd);

        if (search.trim()) {
          params.set('search', search.trim());
        }

        const bukakasId = getBukakasId();
        if (bukakasId) {
          params.set('bukakas_id', bukakasId);
        }

        const response = await fetch(
          `${API_BASE_URL}/reports/kas_harian?${params.toString()}`,
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

        const json: ApiDailyCashResponse = await response.json();

        const apiRows = json?.data?.data?.rows ?? [];
        const apiSummary = json?.data?.data?.summary;

        setRows(apiRows);
        setSummary(apiSummary || null);
        setTotalItems(json?.data?.total ?? apiRows.length);
        setTotalPages(json?.data?.total_pages ?? 1);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Gagal memuat kas harian';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, startDate, endDate, search, today]);

  const saldoAwal = summary?.saldo_awal ?? 0;
  const kasMasuk = summary?.kas_masuk ?? 0;
  const kasKeluar = summary?.kas_keluar ?? 0;
  const saldoAkhir = summary?.saldo_akhir ?? saldoAwal + kasMasuk - kasKeluar;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pl-0 lg:pl-64 pb-10">
      <Sidebar />

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kas Harian</h1>
            <p className="text-gray-600 text-sm">
              Ringkasan pergerakan kas per hari
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-500 flex items-center justify-center shadow-md">
              <span className="ri-wallet-3-line text-white text-xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Saldo Awal</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(saldoAwal)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
              <span className="ri-arrow-down-circle-line text-white text-xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Kas Masuk</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(kasMasuk)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center shadow-md">
              <span className="ri-arrow-up-circle-line text-white text-xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Kas Keluar</p>
              <p className="text-xl font-bold text-rose-600">
                {formatCurrency(kasKeluar)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md">
              <span className="ri-equalizer-line text-white text-xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Saldo Akhir</p>
              <p className="text-xl font-bold text-indigo-600">
                {formatCurrency(saldoAkhir)}
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
                placeholder="Cari keterangan atau kategori..."
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
          </div>

          {error && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-t border-red-100">
              {error}
            </div>
          )}

          {loading && !error && (
            <div className="px-4 py-3 text-sm text-gray-500 border-t border-gray-100">
              Memuat data kas harian...
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
                    Jenis
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Keterangan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Metode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nominal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!loading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Tidak ada data kas harian.
                    </td>
                  </tr>
                )}
                {rows.map((row, idx) => (
                  <tr key={`${row.tanggal}-${row.keterangan}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {new Date(row.tanggal).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          row.jenis === 'masuk'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {row.jenis === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {row.keterangan}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {row.kategori}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {row.metode}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {row.operator || '-'}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-semibold text-right whitespace-nowrap ${
                        row.jenis === 'masuk' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {row.jenis === 'keluar' ? '-' : '+'}
                      {formatCurrency(row.nominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Menampilkan {rows.length} dari {totalItems} transaksi (halaman {page}{' '}
              dari {totalPages})
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

