'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

interface KelolaStokSummary {
  totalProduk: number;
  stokAwal: number;
  stokMasuk: number;
  terjual: number;
  stokAkhir: number;
}

interface KelolaStokItem {
  id: number;
  sku: string;
  nama: string;
  jenis: string;
  satuan: string;
  stokAwal: number;
  stokMasuk: number;
  terjual: number;
  stokAkhir: number;
}

interface KelolaStokApiResponse {
  success: boolean;
  message: string;
  data: {
    data: KelolaStokItem[];
    summary: KelolaStokSummary;
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('id-ID').format(value || 0);

export default function KelolaStokPage() {
  const [items, setItems] = useState<KelolaStokItem[]>([]);
  const [summary, setSummary] = useState<KelolaStokSummary>({
    totalProduk: 0,
    stokAwal: 0,
    stokMasuk: 0,
    terjual: 0,
    stokAkhir: 0,
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedJumlahStok, setSelectedJumlahStok] = useState('Semua');
  const [selectedKolom, setSelectedKolom] = useState('Semua Kolom');

  // debounce pencarian
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchKelolaStok = async (currentPage: number) => {
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
      params.set('page', String(currentPage));
      params.set('limit', String(limit));
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      if (startDate) {
        params.set('start_date', startDate);
      }
      if (endDate) {
        params.set('end_date', endDate);
      }

      const response = await fetch(
        `${API_BASE_URL}/stock/kelola?${params.toString()}`,
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

      const json: KelolaStokApiResponse | any = await response.json();

      // Struktur API:
      // data: {
      //   data: { data: [...], summary: {...} },
      //   total, page, limit, total_pages
      // }
      const inner = json?.data?.data;
      const rawList = Array.isArray(inner?.data) ? inner.data : [];
      const rawSummary = inner?.summary;

      const mappedItems: KelolaStokItem[] = rawList.map((item: any) => ({
        id: Number(item.product_id ?? item.id ?? 0),
        sku: String(item.sku ?? ''),
        nama: String(item.nama ?? ''),
        jenis: String(item.jenis ?? ''),
        satuan: String(item.satuan ?? ''),
        stokAwal: Number(item.stok_awal ?? item.stokAwal ?? 0),
        stokMasuk: Number(item.stok_masuk ?? item.stokMasuk ?? 0),
        terjual: Number(item.terjual ?? 0),
        stokAkhir: Number(item.stok_akhir ?? item.stokAkhir ?? 0),
      }));

      setItems(mappedItems);
      setSummary(
        rawSummary
          ? {
              totalProduk: Number(rawSummary.totalProduk ?? rawSummary.total_produk ?? 0),
              stokAwal: Number(rawSummary.stokAwal ?? rawSummary.stok_awal ?? 0),
              stokMasuk: Number(rawSummary.stokMasuk ?? rawSummary.stok_masuk ?? 0),
              terjual: Number(rawSummary.terjual ?? rawSummary.total_terjual ?? 0),
              stokAkhir: Number(rawSummary.stokAkhir ?? rawSummary.stok_akhir ?? 0),
            }
          : {
              totalProduk: 0,
              stokAwal: 0,
              stokMasuk: 0,
              terjual: 0,
              stokAkhir: 0,
            }
      );
      setPage(json?.data?.page ?? 1);
      setTotalPages(json?.data?.total_pages ?? 1);
      setTotalItems(json?.data?.total ?? mappedItems.length);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal memuat data kelola stok';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelolaStok(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, startDate, endDate]);

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setSelectedJumlahStok('Semua');
    setSelectedKolom('Semua Kolom');
    setPage(1);
  };

  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) {
      return [];
    }

    let data = [...items];

    // filter jumlah stok (sederhana, bisa disesuaikan lagi sesuai kebutuhan)
    if (selectedJumlahStok !== 'Semua') {
      data = data.filter((item) => {
        if (selectedJumlahStok === 'Stok Rendah') {
          return item.stokAkhir <= 10;
        }
        if (selectedJumlahStok === 'Stok Normal') {
          return item.stokAkhir > 10 && item.stokAkhir <= 100;
        }
        if (selectedJumlahStok === 'Stok Tinggi') {
          return item.stokAkhir > 100;
        }
        return true;
      });
    }

    // selectedKolom belum mengubah data, hanya placeholder untuk pengaturan kolom
    return data;
  }, [items, selectedJumlahStok, selectedKolom]);

  return (
    <div className="min-h-screen bg-gray-50 pl-0 2xl:pl-64">
      <Sidebar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Kelola Stok
          </h1>
          <p className="text-gray-600 text-sm">
            Pantau dan kelola pergerakan stok barang Anda.
          </p>
        </div>

        {/* Ringkasan */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 flex flex-col justify-between">
            <div className="text-xs text-gray-500 mb-1">Total Produk</div>
            <div className="text-lg md:text-xl font-bold text-emerald-600">
              {formatNumber(summary.totalProduk)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 flex flex-col justify-between">
            <div className="text-xs text-gray-500 mb-1">Stok Awal</div>
            <div className="text-lg md:text-xl font-bold text-blue-600">
              {formatNumber(summary.stokAwal)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 flex flex-col justify-between">
            <div className="text-xs text-gray-500 mb-1">Stok Masuk</div>
            <div className="text-lg md:text-xl font-bold text-emerald-600">
              {formatNumber(summary.stokMasuk)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 flex flex-col justify-between">
            <div className="text-xs text-gray-500 mb-1">Terjual</div>
            <div className="text-lg md:text-xl font-bold text-orange-500">
              {formatNumber(summary.terjual)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 flex flex-col justify-between">
            <div className="text-xs text-gray-500 mb-1">Stok Akhir</div>
            <div className="text-lg md:text-xl font-bold text-lime-600">
              {formatNumber(summary.stokAkhir)}
            </div>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 mb-6 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="ri-search-line w-5 h-5 flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></span>
              <input
                type="text"
                placeholder="Cari nama / SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 md:gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Tanggal Akhir</label>
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
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                Jumlah Stok
              </label>
              <select
                value={selectedJumlahStok}
                onChange={(e) => setSelectedJumlahStok(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Semua">Semua</option>
                <option value="Stok Rendah">Stok Rendah</option>
                <option value="Stok Normal">Stok Normal</option>
                <option value="Stok Tinggi">Stok Tinggi</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                Sertakan Kolom
              </label>
              <select
                value={selectedKolom}
                onChange={(e) => setSelectedKolom(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Semua Kolom">Semua Kolom</option>
                <option value="Kolom Utama">Kolom Utama</option>
                <option value="Kolom Detail">Kolom Detail</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 cursor-pointer whitespace-nowrap"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Tabel / List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading && (
            <div className="px-6 py-8 text-center text-gray-500 text-sm">
              Memuat data kelola stok...
            </div>
          )}

          {!loading && filteredItems.length === 0 && !error && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              Tidak ada data stok.
            </div>
          )}

          {!loading && filteredItems.length > 0 && (
            <>
              {/* Mobile: kartu list */}
              <div className="block md:hidden divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.nama}
                        </p>
                        <p className="text-xs text-gray-500">{item.sku}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <p className="text-gray-500">Jenis</p>
                        <p className="font-medium text-gray-800">{item.jenis}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500">Satuan</p>
                        <p className="font-medium text-gray-800">
                          {item.satuan}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="space-y-1">
                        <p className="text-gray-500">Awal</p>
                        <p className="font-semibold text-blue-600">
                          {formatNumber(item.stokAwal)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500">Masuk</p>
                        <p className="font-semibold text-emerald-600">
                          {formatNumber(item.stokMasuk)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500">Terjual</p>
                        <p className="font-semibold text-orange-500">
                          {formatNumber(item.terjual)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500">Akhir</p>
                        <p className="font-semibold text-lime-600">
                          {formatNumber(item.stokAkhir)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: tabel */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Jenis
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Awal
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Masuk
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Terjual
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Akhir
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Satuan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {item.sku}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {item.nama}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {item.jenis}
                        </td>
                        <td className="px-6 py-3 text-sm text-right font-semibold text-blue-600">
                          {formatNumber(item.stokAwal)}
                        </td>
                        <td className="px-6 py-3 text-sm text-right font-semibold text-emerald-600">
                          {formatNumber(item.stokMasuk)}
                        </td>
                        <td className="px-6 py-3 text-sm text-right font-semibold text-orange-500">
                          {formatNumber(item.terjual)}
                        </td>
                        <td className="px-6 py-3 text-sm text-right font-semibold text-lime-600">
                          {formatNumber(item.stokAkhir)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {item.satuan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-600">
              Menampilkan {filteredItems.length} dari {totalItems} data (halaman{' '}
              {page} dari {totalPages})
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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


