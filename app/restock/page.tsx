'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

interface ApiPurchaseRow {
  id: number;
  tanggal: string;
  supplier: string;
  no_invoice: string;
  sku: string;
  nama_produk: string;
  qty: number;
  satuan: string;
  harga: number;
  stok_sebelum: number;
  stok_sesudah: number;
  nilai_stok: number;
  status: string;
}

interface ApiPurchaseSummary {
  nilai_stok: number;
  stok_sebelum: number;
  stok_sesudah: number;
  total_belanja: number;
  total_item: number;
  total_qty: number;
}

interface ApiPurchaseResponse {
  success: boolean;
  message: string;
  data: {
    data: {
      data: ApiPurchaseRow[];
      summary: ApiPurchaseSummary;
    };
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface PembelianStokData {
  tanggal: Date;
  supplier: string;
  noInvoice: string;
  sku: string;
  namaProduk: string;
  qty: number;
  satuan: string;
  harga: number;
  stokSebelum: number;
  stokSesudah: number;
  nilaiStok: number;
  status: string;
}

function mapStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'received':
      return 'Selesai';
    case 'pending':
      return 'Pending';
    case 'cancelled':
      return 'Dibatalkan';
    default:
      return status;
  }
}

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function RestockPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [rows, setRows] = useState<PembelianStokData[]>([]);
  const [totalItem, setTotalItem] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const [totalBelanja, setTotalBelanja] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPembelian() {
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
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const res = await fetch(
        `${API_BASE_URL}/stock/purchase?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP error ${res.status}`);
      }

      const json: ApiPurchaseResponse = await res.json();

      const apiRows = json.data.data.data || [];
      const summary = json.data.data.summary;

      const mappedRows: PembelianStokData[] = apiRows.map((row) => ({
        tanggal: new Date(
          // backend kirim "dd/MM/yyyy"
          row.tanggal.split('/').reverse().join('-')
        ),
        supplier: row.supplier,
        noInvoice: row.no_invoice,
        sku: row.sku,
        namaProduk: row.nama_produk,
        qty: row.qty,
        satuan: row.satuan,
        harga: row.harga,
        stokSebelum: row.stok_sebelum,
        stokSesudah: row.stok_sesudah,
        nilaiStok: row.nilai_stok,
        status: row.status,
      }));

      setRows(mappedRows);
      setTotalItem(summary.total_item);
      setTotalQty(summary.total_qty);
      setTotalBelanja(summary.total_belanja);
      setTotalPages(json.data.total_pages);
      setTotalData(json.data.total);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal memuat data pembelian';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPembelian();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, startDate, endDate, status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pl-0 lg:pl-64 pb-10">
      <Sidebar />

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pembelian Stok
            </h1>
            <p className="text-gray-600 text-sm">
              {loading
                ? 'Memuat data pembelian...'
                : `${totalData} baris pembelian stok`}
            </p>
          </div>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="ri-shopping-bag-3-line text-white text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 mb-1">Total Item</p>
              <p className="text-2xl font-bold text-emerald-600">
                {totalItem}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="ri-stack-line text-white text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 mb-1">Total Qty</p>
              <p className="text-2xl font-bold text-blue-600">{totalQty}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="ri-money-cny-box-line text-white text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 mb-1">Total Belanja</p>
              <p className="text-2xl font-bold text-rose-600">
                {formatCurrency(totalBelanja)}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm mb-6">
          <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center bg-gray-50/50 border-b border-gray-200">
            <div className="flex-1 relative">
              <span className="ri-search-line w-5 h-5 flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama produk / SKU / nomor invoice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => {
                  setPage(1);
                  fetchPembelian();
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua Status</option>
                <option value="received">Selesai</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 border-b border-gray-200">
              {error}
            </div>
          )}

          {loading && (
            <div className="px-4 py-6 text-sm text-gray-500">
              Memuat data pembelian...
            </div>
          )}

          {!loading && rows.length === 0 && !error && (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              Tidak ada data pembelian stok.
            </div>
          )}

          {!loading && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      No. Invoice
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Nama Produk
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Satuan
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Harga
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Stok Sebelum
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Stok Sesudah
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Nilai Stok
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {rows.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(item.tanggal)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{item.supplier || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap font-medium">{item.noInvoice}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{item.sku}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap font-medium">{item.namaProduk}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 text-right whitespace-nowrap font-medium">{item.qty}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{item.satuan || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 text-right whitespace-nowrap">
                        {formatCurrency(item.harga)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 text-right whitespace-nowrap">
                        {item.stokSebelum}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-emerald-600 font-semibold whitespace-nowrap">
                        {item.stokSesudah}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right whitespace-nowrap font-semibold">
                        {formatCurrency(item.nilaiStok)}
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">
                        {mapStatus(item.status) === 'Selesai' ? (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {mapStatus(item.status)}
                          </span>
                        ) : mapStatus(item.status) === 'Pending' ? (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            {mapStatus(item.status)}
                          </span>
                        ) : (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                            {mapStatus(item.status)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-4 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <span className="text-gray-600">
              Halaman <span className="font-semibold">{page}</span> dari <span className="font-semibold">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white cursor-pointer bg-white transition-colors"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 cursor-pointer transition-colors"
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


