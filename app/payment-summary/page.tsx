'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

type PaymentMethod = 'Semua' | 'Tunai' | 'Transfer Bank' | 'E-Wallet';

type DistributionType = 'tunai' | 'transfer_bank' | 'e_wallet';

interface ApiDistributionItem {
  tipe: DistributionType;
  total: number;
  jumlah: number;
}

interface ApiRowItem {
  tanggal: string; // ISO string
  metode_pembayaran: DistributionType;
  jumlah_transaksi: number;
  total_pembayaran: number;
  biaya_admin: number;
  penerimaan_bersih: number;
}

interface ApiCards {
  total_transaksi: number;
  total_pembayaran: number;
  total_biaya: number;
  penerimaan_bersih: number;
}

interface ApiPaymentSummaryResponse {
  success: boolean;
  message: string;
  data: {
    data: {
      cards: ApiCards;
      distribution: ApiDistributionItem[];
      rows: ApiRowItem[];
    };
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface PaymentRow {
  id: number;
  tanggal: string; // ISO
  metode: Exclude<PaymentMethod, 'Semua'>;
  jumlahTransaksi: number;
  totalPembayaran: number;
  biayaAdmin: number;
  penerimaanBersih: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const mapDistributionLabel = (tipe: DistributionType): Exclude<PaymentMethod, 'Semua'> => {
  if (tipe === 'transfer_bank') return 'Transfer Bank';
  if (tipe === 'e_wallet') return 'E-Wallet';
  return 'Tunai';
};

export default function PaymentSummaryPage() {
  const [metodeFilter, setMetodeFilter] = useState<PaymentMethod>('Semua');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [cards, setCards] = useState<ApiCards>({
    total_transaksi: 0,
    total_pembayaran: 0,
    total_biaya: 0,
    penerimaan_bersih: 0,
  });
  const [distribution, setDistribution] = useState<ApiDistributionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentSummary = async () => {
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
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('page', '1');
      params.append('limit', '50');

      const url = `${API_BASE_URL}/reports/ringkasan_pembayaran?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP error! status: ${response.status}`);
      }

      const json: ApiPaymentSummaryResponse = await response.json();

      const apiData = json.data.data;
      setCards(apiData.cards);
      setDistribution(apiData.distribution || []);

      const mappedRows: PaymentRow[] = (apiData.rows || []).map((row, idx) => ({
        id: idx + 1,
        tanggal: row.tanggal,
        metode: mapDistributionLabel(row.metode_pembayaran),
        jumlahTransaksi: row.jumlah_transaksi,
        totalPembayaran: row.total_pembayaran,
        biayaAdmin: row.biaya_admin,
        penerimaanBersih: row.penerimaan_bersih,
      }));

      setRows(mappedRows);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal memuat ringkasan pembayaran';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchMethod =
        metodeFilter === 'Semua' ? true : row.metode === metodeFilter;

      const tgl = row.tanggal.slice(0, 10);
      const afterStart = startDate ? tgl >= startDate : true;
      const beforeEnd = endDate ? tgl <= endDate : true;

      return matchMethod && afterStart && beforeEnd;
    });
  }, [rows, metodeFilter, startDate, endDate]);

  const totalTransaksi = cards.total_transaksi;
  const totalPembayaran = cards.total_pembayaran;
  const totalBiaya = cards.total_biaya;
  const penerimaanBersih = cards.penerimaan_bersih;

  const byMethod = useMemo(() => {
    const base = {
      Tunai: 0,
      'Transfer Bank': 0,
      'E-Wallet': 0,
    } as Record<Exclude<PaymentMethod, 'Semua'>, number>;

    for (const item of distribution) {
      const label = mapDistributionLabel(item.tipe);
      base[label] += item.total;
    }
    return base;
  }, [distribution]);

  const maxMethodValue = Math.max(...Object.values(byMethod), 1);

  const handleApplyFilter = () => {
    fetchPaymentSummary();
  };

  const handleExport = () => {
    // Sementara hanya alert, nanti bisa diganti export CSV/Excel
    alert('Fitur export belum diimplementasikan. Silakan integrasikan dengan export CSV/Excel.');
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-0 2xl:pl-0 2xl:pl-64 pb-10">
      <Sidebar />

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Ringkasan Pembayaran
            </h1>
            <p className="text-gray-600 text-sm">
              Analisis metode pembayaran dan transaksi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <span className="ri-shopping-bag-3-line text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Transaksi</p>
              <p className="text-xl font-bold text-gray-900">
                {totalTransaksi}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <span className="ri-wallet-3-line text-emerald-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Pembayaran</p>
              <p className="text-xl font-bold text-emerald-700">
                {formatCurrency(totalPembayaran)}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <span className="ri-percent-line text-rose-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Biaya</p>
              <p className="text-xl font-bold text-rose-600">
                {formatCurrency(totalBiaya)}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <span className="ri-safe-2-line text-violet-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Penerimaan Bersih</p>
              <p className="text-xl font-bold text-violet-700">
                {formatCurrency(penerimaanBersih)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Distribusi Metode Pembayaran
            </h2>
            <p className="text-xs text-gray-500">
              Perbandingan nilai pembayaran per metode.
            </p>
          </div>
          <div className="p-5 space-y-4">
            {(['Tunai', 'Transfer Bank', 'E-Wallet'] as const).map((metode) => {
              const value = byMethod[metode];
              const percentage =
                maxMethodValue === 0 ? 0 : (value / maxMethodValue) * 100;

              const colorClass =
                metode === 'Tunai'
                  ? 'bg-emerald-500'
                  : metode === 'Transfer Bank'
                  ? 'bg-blue-600'
                  : 'bg-violet-500';

              return (
                <div key={metode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">{metode}</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(value)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full ${colorClass} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center border-b border-gray-200">
            <div className="flex items-center gap-2">
              <select
                value={metodeFilter}
                onChange={(e) =>
                  setMetodeFilter(e.target.value as PaymentMethod)
                }
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Semua">Semua Metode</option>
                <option value="Tunai">Tunai</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="E-Wallet">E-Wallet</option>
              </select>
            </div>

            <div className="flex items-center gap-2 ml-0 md:ml-auto">
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyFilter}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-xs font-medium text-white hover:bg-emerald-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="ri-filter-3-line text-sm" />
                Terapkan
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <span className="ri-download-2-line text-sm" />
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Metode Pembayaran
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Jumlah Transaksi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Pembayaran
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Biaya Admin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Penerimaan Bersih
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {error && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                )}
                {!error && filteredRows.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Tidak ada data pembayaran.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Memuat data ringkasan pembayaran...
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredRows.map((row, index) => {
                  const bersih = row.totalPembayaran - row.biayaAdmin;
                  const chipClass =
                    row.metode === 'Tunai'
                      ? 'bg-emerald-50 text-emerald-700'
                      : row.metode === 'Transfer Bank'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-violet-50 text-violet-700';

                  return (
                    <tr key={`${row.tanggal}-${index}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {new Date(row.tanggal).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${chipClass}`}
                        >
                          {row.metode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {row.jumlahTransaksi} transaksi
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(row.totalPembayaran)}
                      </td>
                      <td className="px-4 py-3 text-sm text-rose-600 whitespace-nowrap">
                        {row.biayaAdmin === 0
                          ? 'Rp 0'
                          : `-${formatCurrency(row.biayaAdmin)}`}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-700 whitespace-nowrap">
                        {formatCurrency(bersih)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


