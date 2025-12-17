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
    <div className="min-h-screen bg-gray-50 pl-0 2xl:pl-64">
      <Sidebar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Pembelian Stok
            </h1>
            <p className="text-gray-600 text-sm">
              {loading
                ? 'Memuat data pembelian...'
                : `${totalData} baris pembelian stok`}
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors cursor-pointer flex items-center gap-2"
          >
            <span className="ri-add-line w-5 h-5 flex items-center justify-center" />
            Tambah Pembelian
          </button>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
              <span className="ri-shopping-bag-3-line text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Item</p>
              <p className="text-lg font-bold text-emerald-700">
                {totalItem}
              </p>
            </div>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <span className="ri-stack-line text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Qty</p>
              <p className="text-lg font-bold text-blue-700">{totalQty}</p>
            </div>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-rose-50 border border-rose-100">
            <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center mr-3">
              <span className="ri-money-cny-box-line text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Belanja</p>
              <p className="text-lg font-bold text-rose-700">
                {formatCurrency(totalBelanja)}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-gray-200 mb-4">
          <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      No. Invoice
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Nama Produk
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Satuan
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Harga
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Stok Sebelum
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Stok Sesudah
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Nilai Stok
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {formatDate(item.tanggal)}
                      </td>
                      <td className="px-4 py-2">{item.supplier || '-'}</td>
                      <td className="px-4 py-2">{item.noInvoice}</td>
                      <td className="px-4 py-2">{item.sku}</td>
                      <td className="px-4 py-2">{item.namaProduk}</td>
                      <td className="px-4 py-2 text-right">{item.qty}</td>
                      <td className="px-4 py-2">{item.satuan || '-'}</td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(item.harga)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.stokSebelum}
                      </td>
                      <td className="px-4 py-2 text-right text-emerald-600 font-semibold">
                        {item.stokSesudah}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(item.nilaiStok)}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 cursor-pointer"
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


