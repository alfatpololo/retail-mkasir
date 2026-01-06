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
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (status === 'proses' || status.toLowerCase() === 'proses') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pl-0 lg:pl-64 pb-10">
      <Sidebar />

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Stok Opname
            </h1>
            <p className="text-gray-600 text-sm">
              Kelola dan verifikasi stok fisik barang
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="ri-file-list-3-line text-white text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 mb-1">Total Opname</p>
              <p className="text-2xl font-bold text-emerald-600">
                {summary.totalOpname}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="ri-checkbox-circle-line text-white text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 mb-1">Selesai</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.selesai}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="ri-time-line text-white text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 mb-1">Proses</p>
              <p className="text-2xl font-bold text-amber-600">
                {summary.proses}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-gray-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="ri-draft-line text-white text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 mb-1">Draft</p>
              <p className="text-2xl font-bold text-gray-600">
                {summary.draft}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm mb-6">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-end gap-3">
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
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Kode Opname
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Item
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Sudah Dicek
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Sesuai
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Selisih
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Selisih Nilai
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
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
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.tanggal}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.kodeOpname}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-700">
                        <span className="font-medium">{item.totalItem}</span>
                        <span className="text-gray-500 ml-1">item</span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-700">
                        <span className="font-medium">{item.sudahDicek}</span>
                        <span className="text-gray-500 ml-1">item</span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-emerald-600 font-semibold">
                        {item.sesuai} item
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-red-600 font-semibold">
                        {item.selisih} item
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColors(
                            item.status
                          )}`}
                        >
                          {item.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.user}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900 font-semibold">
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

          <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold">{items.length}</span> dari <span className="font-semibold">{totalItems}</span> data (halaman <span className="font-semibold">{page}</span> dari <span className="font-semibold">{totalPages}</span>)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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


