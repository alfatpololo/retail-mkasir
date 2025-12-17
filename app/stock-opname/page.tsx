'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

interface ApiStockOpnameItem {
  id: number;
  tanggal: string;
  kode_opname: string;
  total_item: number;
  sudah_dicek: number;
  sesuai: number;
  selisih: number;
  status: 'draft' | 'proses' | 'selesai' | string;
  status_label: string;
  user: string;
  total_selisih_nilai: number;
}

interface ApiStockOpnameSummary {
  draft: number;
  proses: number;
  selesai: number;
  total_opname: number;
}

interface ApiStockOpnameResponse {
  success: boolean;
  message: string;
  data: {
    data: {
      data: ApiStockOpnameItem[];
      summary: ApiStockOpnameSummary;
    };
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

type StatusFilter = 'Semua Status' | 'Draft' | 'Proses' | 'Selesai';

interface StockOpnameItem {
  id: number;
  tanggal: string;
  kodeOpname: string;
  totalItem: number;
  sudahDicek: number;
  sesuai: number;
  selisih: number;
  status: string;
  statusLabel: string;
  user: string;
  totalSelisihNilai: number;
}

interface StockOpnameSummary {
  draft: number;
  proses: number;
  selesai: number;
  totalOpname: number;
}

export default function StockOpnamePage() {
  const [items, setItems] = useState<StockOpnameItem[]>([]);
  const [summary, setSummary] = useState<StockOpnameSummary>({
    draft: 0,
    proses: 0,
    selesai: 0,
    totalOpname: 0,
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua Status');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions: StatusFilter[] = ['Semua Status', 'Draft', 'Proses', 'Selesai'];

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    if (statusFilter === 'Draft') params.set('status', 'draft');
    if (statusFilter === 'Proses') params.set('status', 'proses');
    if (statusFilter === 'Selesai') params.set('status', 'selesai');

    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);

    return params.toString();
  }, [page, limit, searchQuery, statusFilter, startDate, endDate]);

  const fetchStockOpname = async () => {
    try {
      setLoading(true);
      setError(null);

      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const url = `${API_BASE_URL}/stock/opname?${queryParams}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const json: ApiStockOpnameResponse = await response.json();

      const apiItems = json.data.data.data || [];
      const apiSummary = json.data.data.summary;

      const mapped: StockOpnameItem[] = apiItems.map((item) => ({
        id: item.id,
        tanggal: item.tanggal,
        kodeOpname: item.kode_opname,
        totalItem: item.total_item,
        sudahDicek: item.sudah_dicek,
        sesuai: item.sesuai,
        selisih: item.selisih,
        status: item.status,
        statusLabel: item.status_label,
        user: item.user,
        totalSelisihNilai: item.total_selisih_nilai,
      }));

      setItems(mapped);
      setSummary({
        draft: apiSummary.draft,
        proses: apiSummary.proses,
        selesai: apiSummary.selesai,
        totalOpname: apiSummary.total_opname,
      });

      setPage(json.data.page);
      setTotalPages(json.data.total_pages);
      setTotalItems(json.data.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal memuat data stok opname';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockOpname();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const handleResetFilter = () => {
    setSearchQuery('');
    setStatusFilter('Semua Status');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getStatusColors = (status: string) => {
    if (status === 'selesai' || status.toLowerCase() === 'selesai') {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    if (status === 'proses' || status.toLowerCase() === 'proses') {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-0 2xl:pl-64">
      <Sidebar />

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Stok Opname
            </h1>
            <p className="text-gray-600 text-sm">
              Kelola dan verifikasi stok fisik barang
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1.5">
            <div className="text-xs font-medium text-gray-500 uppercase">
              Total Opname
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {summary.totalOpname}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1.5">
            <div className="text-xs font-medium text-gray-500 uppercase">
              Selesai
            </div>
            <div className="text-2xl font-bold text-green-600">
              {summary.selesai}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1.5">
            <div className="text-xs font-medium text-gray-500 uppercase">
              Proses
            </div>
            <div className="text-2xl font-bold text-amber-500">
              {summary.proses}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1.5">
            <div className="text-xs font-medium text-gray-500 uppercase">
              Draft
            </div>
            <div className="text-2xl font-bold text-gray-600">
              {summary.draft}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl mb-6">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1 flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1 relative">
                <span className="ri-search-line w-5 h-5 flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari kode opname..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="w-full md:w-48">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
              >
                Reset
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 text-sm text-red-600 border-b border-gray-200">
              {error}
            </div>
          )}

          {loading && !error && (
            <div className="px-4 py-4 text-sm text-gray-600 border-b border-gray-200">
              Memuat data stok opname...
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Kode Opname
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Total Item
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Sudah Dicek
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Sesuai
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Selisih
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    User
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Total Selisih Nilai
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Tidak ada stok opname.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {item.tanggal}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                        {item.kodeOpname}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {item.totalItem} item
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {item.sudahDicek} item
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                        {item.sesuai} item
                      </td>
                      <td className="px-4 py-3 text-right text-red-500 font-semibold">
                        {item.selisih} item
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColors(
                            item.status
                          )}`}
                        >
                          {item.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {item.user}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                        {item.totalSelisihNilai.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0,
                        })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Menampilkan {items.length} dari {totalItems} data (halaman {page} dari{' '}
              {totalPages})
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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


