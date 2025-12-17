'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

type QuickFilter = 'Semua' | 'Hari Ini' | 'Minggu Ini' | 'Bulan Ini';

interface ApiTransactionCustomer {
  nama: string;
}

interface ApiTransactionUser {
  nama: string;
}

interface ApiTransactionMethod {
  nama: string;
}

interface ApiTransactionDetail {
  nama_produk: string;
  qty: number;
  harga_jual: number;
  subtotal: number;
  diskon: number;
}

interface ApiTransaction {
  id: number;
  nomor_transaksi: string;
  waktu_pesan: string;
  subtotal: number;
  diskon: number;
  pajak: number;
  biaya_lainnya: number;
  grand_total: number;
  nominal_bayar: number;
  kembalian: number;
  total_profit: number;
  customer?: ApiTransactionCustomer | null;
  user?: ApiTransactionUser | null;
  nama_pelanggan?: string | null;
  transaction_method?: ApiTransactionMethod | null;
  transaction_details: ApiTransactionDetail[];
}

interface ApiTransactionsResponse {
  success: boolean;
  message: string;
  data: {
    data: ApiTransaction[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface Transaction {
  id: number;
  nomorTransaksi: string;
  tanggal: Date;
  subtotal: number;
  diskon: number;
  pajak: number;
  biayaLainnya: number;
  grandTotal: number;
  nominalBayar: number;
  kembalian: number;
  totalProfit: number;
  pelanggan: string;
  kasir: string;
  metodePembayaran: string;
  items: {
    namaProduk: string;
    qty: number;
    hargaJual: number;
    subtotal: number;
    diskon: number;
  }[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('Hari Ini');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)

  // Reset sidebar state saat window resize untuk memastikan konsistensi
  useEffect(() => {
    const handleResize = () => {
      // Jika window menjadi 2xl atau lebih besar, reset tablet sidebar
      if (window.innerWidth >= 1536) {
        setSidebarCollapsed(true);
      }
      // Jika window menjadi md atau lebih kecil, reset mobile sidebar
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        // Reset selected transaction ketika filter/search/page berubah
        setSelectedTransaction(null);

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
        params.set('limit', '20');

        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }

        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (quickFilter === 'Hari Ini') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        } else if (quickFilter === 'Minggu Ini') {
          const weekday = now.getDay() === 0 ? 7 : now.getDay();
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - (weekday - 1)
          );
          endDate = now;
        } else if (quickFilter === 'Bulan Ini') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
        } else if (quickFilter === 'Semua') {
          startDate = null;
          endDate = null;
        }

        if (customStart && customEnd) {
          const start = new Date(customStart);
          const end = new Date(customEnd);
          if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            startDate = start;
            endDate = new Date(
              end.getFullYear(),
              end.getMonth(),
              end.getDate(),
              23,
              59,
              59
            );
          }
        }

        if (startDate && endDate) {
          const toApiDate = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
              2,
              '0'
            )}-${String(d.getDate()).padStart(2, '0')}`;

          params.set('start_date', toApiDate(startDate));
          params.set('end_date', toApiDate(endDate));
        }

        const response = await fetch(
          `${API_BASE_URL}/transactions?${params.toString()}`,
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

        const json: ApiTransactionsResponse = await response.json();

        const mapped: Transaction[] = json.data.data.map((trx) => ({
          id: trx.id,
          nomorTransaksi: trx.nomor_transaksi,
          tanggal: new Date(trx.waktu_pesan),
          subtotal: trx.subtotal,
          diskon: trx.diskon,
          pajak: trx.pajak,
          biayaLainnya: trx.biaya_lainnya,
          grandTotal: trx.grand_total,
          nominalBayar: trx.nominal_bayar,
          kembalian: trx.kembalian,
          totalProfit: trx.total_profit,
          pelanggan:
            trx.customer?.nama || trx.nama_pelanggan || '-',
          kasir: trx.user?.nama || '-',
          metodePembayaran: trx.transaction_method?.nama || 'Cash',
          items: (trx.transaction_details || []).map((item) => ({
            namaProduk: item.nama_produk,
            qty: item.qty,
            hargaJual: item.harga_jual,
            subtotal: item.subtotal,
            diskon: item.diskon,
          })),
        }));

        setTransactions(mapped);
        setTotalItems(json.data.total);
        setTotalPages(json.data.total_pages);
        
        // Reset selected transaction jika tidak ada transaksi atau transaksi yang dipilih tidak ada lagi di list
        if (mapped.length === 0) {
          setSelectedTransaction(null);
        } else {
          setSelectedTransaction((prev) => {
            if (!prev) return null;
            const stillExists = mapped.some(t => t.id === prev.id);
            return stillExists ? prev : null;
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Gagal memuat transaksi';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, quickFilter, searchQuery, customStart, customEnd]);

  const totalGrand = useMemo(
    () => transactions.reduce((sum, t) => sum + t.grandTotal, 0),
    [transactions]
  );

  const totalProfit = useMemo(
    () => transactions.reduce((sum, t) => sum + t.totalProfit, 0),
    [transactions]
  );

  const handlePrintReceipt = () => {
    if (!selectedTransaction) return;

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const printArea = document.getElementById('transactions-receipt-print');
    if (!printArea) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const styles = `
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 11px;
          margin: 0;
          padding: 10px;
        }
        .receipt-container {
          width: 280px;
          margin: 0 auto;
        }
        .receipt-header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }
        .receipt-header h1 {
          font-size: 13px;
          margin: 0;
        }
        .receipt-header p {
          margin: 2px 0;
        }
        .receipt-section-title {
          font-weight: 600;
          margin: 4px 0;
        }
        .items-header, .items-row {
          display: flex;
          font-size: 10px;
        }
        .items-header {
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
          margin-bottom: 2px;
        }
        .items-row {
          padding: 2px 0;
          border-bottom: 1px dashed #ddd;
        }
        .items-name {
          flex: 1;
        }
        .items-qty {
          width: 35px;
          text-align: center;
        }
        .items-total {
          width: 70px;
          text-align: right;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
          font-size: 10px;
        }
        .summary-row.total {
          font-weight: 700;
          border-top: 1px dashed #000;
          margin-top: 4px;
          padding-top: 4px;
        }
        .footer {
          text-align: center;
          margin-top: 10px;
          border-top: 1px dashed #000;
          padding-top: 6px;
        }
      </style>
    `;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Struk ${selectedTransaction.nomorTransaksi}</title>
          ${styles}
        </head>
        <body>
          <div class="receipt-container">
            ${printArea.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative pb-10">
      {/* Static sidebar for desktop (2xl up - very large screens only) */}
      <div className="hidden 2xl:block fixed left-0 top-0 bottom-0 w-64 z-50">
        <Sidebar />
      </div>

      {/* Sidebar overlay for tablet (md, lg, xl - all tablets including landscape) */}
      {!sidebarCollapsed && (
        <div className="hidden md:block 2xl:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarCollapsed(true)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[10.5rem] md:w-[13rem] lg:w-[15rem] xl:w-[17rem] bg-white shadow-xl z-50 overflow-y-auto">
            <Sidebar isOverlay={true} />
          </div>
        </div>
      )}

      {/* Show Sidebar Indicator for Tablet (md, lg, xl - all tablets including landscape, when collapsed) */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden md:flex 2xl:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 w-12 h-20 bg-white rounded-r-full items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 group"
          aria-label="Show sidebar"
        >
          <div className="flex items-center -space-x-3">
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0s'
              }}
            ></i>
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0.3s'
              }}
            ></i>
          </div>
        </button>
      )}
      
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white z-50 overflow-y-auto">
            <Sidebar isOverlay={true} />
          </div>
        </div>
      )}

      {/* Show Sidebar Indicator for Mobile (when collapsed) */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 w-12 h-20 bg-white rounded-r-full items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 group flex"
          aria-label="Show sidebar"
        >
          <div className="flex items-center -space-x-3">
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0s'
              }}
            ></i>
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0.3s'
              }}
            ></i>
          </div>
        </button>
      )}

      <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 2xl:pl-72 2xl:pr-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <i className="ri-file-list-3-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Riwayat Transaksi
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm">
                Pantau transaksi penjualan lengkap dengan filter tanggal dan pencarian
              </p>
            </div>
          </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={selectedTransaction ? "lg:col-span-7" : "lg:col-span-12"}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
                <div className="p-5 md:p-6 border-b border-gray-200 space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <span className="ri-search-line w-5 h-5 flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></span>
                    <input
                      type="text"
                      placeholder="Cari nomor transaksi atau nama pelanggan..."
                      value={searchQuery}
                      onChange={(e) => {
                        setPage(1);
                        setSearchQuery(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => {
                        setPage(1);
                        setCustomStart(e.target.value);
                      }}
                      className="px-3 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px] flex-1"
                    />
                    <span className="text-xs text-gray-400">s/d</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => {
                        setPage(1);
                        setCustomEnd(e.target.value);
                      }}
                      className="px-3 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px] flex-1"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['Semua', 'Hari Ini', 'Minggu Ini', 'Bulan Ini'] as QuickFilter[]).map(
                    (filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setPage(1);
                          setQuickFilter(filter);
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                          quickFilter === filter
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {filter}
                      </button>
                    )
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
                      <span className="ri-receipt-line text-white text-xl"></span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Total Transaksi</p>
                      <p className="text-lg font-bold text-blue-700">
                        {totalItems}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
                      <span className="ri-money-dollar-circle-line text-white text-xl"></span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        Total Pendapatan
                      </p>
                      <p className="text-lg font-bold text-amber-700">
                        {formatCurrency(totalGrand)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
                      <span className="ri-line-chart-line text-white text-xl"></span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        Total Keuntungan
                      </p>
                      <p className="text-lg font-bold text-emerald-700">
                        {formatCurrency(totalProfit)}
                      </p>
                    </div>
                  </div>
                </div>
                </div>

                {error && (
                  <div className="px-5 py-4 text-sm text-red-600 bg-red-50 border-t border-red-100 flex items-center gap-2">
                    <i className="ri-error-warning-line"></i>
                    {error}
                  </div>
                )}

                {loading && !error && (
                  <div className="px-5 py-8 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      Memuat data transaksi...
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <div className="max-h-[calc(100vh-28rem)] overflow-y-auto scrollbar-hide">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-y border-gray-200 sticky top-0 z-20">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                        Tanggal
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                        No. Transaksi
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                        Total
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                        Pelanggan
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                        Metode
                      </th>
                      <th className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {!loading && transactions.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-12 text-center"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <i className="ri-file-list-3-line text-4xl text-gray-300"></i>
                            <p className="text-sm font-medium text-gray-500">Tidak ada transaksi</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {transactions.map((transaction) => {
                      const isSelected =
                        selectedTransaction?.id === transaction.id;
                      return (
                        <tr
                          key={transaction.id}
                          className={`cursor-pointer transition-colors hover:bg-emerald-50/30 ${
                            isSelected ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                          }`}
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {formatDate(transaction.tanggal)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {transaction.tanggal.toLocaleTimeString(
                                  'id-ID',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  }
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {transaction.nomorTransaksi}
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-emerald-600 whitespace-nowrap text-right">
                            {formatCurrency(transaction.grandTotal)}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {transaction.pelanggan}
                          </td>
                          <td className="px-5 py-4 text-sm whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {transaction.metodePembayaran}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer">
                              <i className="ri-eye-line"></i>
                              Detail
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-5 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold text-gray-900">{transactions.length}</span> dari <span className="font-semibold text-gray-900">{totalItems}</span> transaksi
                  <span className="hidden sm:inline"> (halaman {page} dari {totalPages})</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1 || loading}
                    className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 active:bg-white sm:hover:bg-white active:border-gray-400 sm:hover:border-gray-400 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                  >
                    <i className="ri-arrow-left-line mr-1"></i>
                    Sebelumnya
                  </button>
                <button
                    type="button"
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={page === totalPages || loading}
                    className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium active:bg-emerald-600 sm:hover:bg-emerald-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[44px] touch-manipulation"
                  >
                    Berikutnya
                    <i className="ri-arrow-right-line ml-1"></i>
                  </button>
                </div>
                </div>
              </div>
            </div>

            {selectedTransaction && (
              <div className="hidden lg:block lg:col-span-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 h-full flex flex-col sticky top-6">
                  <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50/50 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="ri-receipt-line text-emerald-600 text-lg"></span>
                <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Detail Struk
                    </p>
                    <p className="text-xs text-gray-500">
                      Pilih transaksi di kiri untuk melihat struk
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  disabled={!selectedTransaction}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
                >
                  <i className="ri-printer-line"></i>
                  Cetak Struk
                </button>
                </div>

              {selectedTransaction ? (
                <div
                  id="transactions-receipt-print"
                  className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
                >
                  <div className="text-center border-b border-dashed border-gray-300 pb-5">
                    <p className="text-base font-bold text-gray-900 tracking-wide">
                      STRUK TRANSAKSI
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedTransaction.kasir !== '-'
                        ? `Kasir: ${selectedTransaction.kasir}`
                        : 'Kasir: -'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(selectedTransaction.tanggal)}
                    </p>
                    <p className="text-xs text-gray-500">
                      No: {selectedTransaction.nomorTransaksi}
                    </p>
                    {selectedTransaction.pelanggan !== '-' && (
                      <p className="text-xs text-gray-500">
                        Pelanggan: {selectedTransaction.pelanggan}
                      </p>
                    )}
              </div>

              <div>
                    <div className="flex text-xs font-semibold text-gray-600 pb-2 border-b border-gray-200">
                      <span className="flex-1">Item</span>
                      <span className="w-10 text-center">Qty</span>
                      <span className="w-24 text-right">Total</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                  {selectedTransaction.items.map((item, index) => (
                        <div
                          key={`${item.namaProduk}-${index}`}
                          className="py-2.5 text-xs"
                        >
                          <div className="flex items-start">
                            <span className="flex-1 font-medium text-gray-900">
                              {item.namaProduk}
                            </span>
                            <span className="w-10 text-center text-gray-700">
                              {item.qty}
                            </span>
                            <span className="w-24 text-right font-semibold text-gray-900">
                              {formatCurrency(item.subtotal)}
                            </span>
                      </div>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            {formatCurrency(item.hargaJual)} x {item.qty}
                            {item.diskon > 0 &&
                              ` (diskon ${formatCurrency(item.diskon)})`}
                          </p>
                    </div>
                  ))}
                </div>
              </div>

                  <div className="pt-3 border-t border-gray-200 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                    </div>
                    {selectedTransaction.diskon > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Diskon</span>
                        <span>
                          -{formatCurrency(selectedTransaction.diskon)}
                        </span>
                      </div>
                    )}
                    {selectedTransaction.pajak > 0 && (
                      <div className="flex justify-between">
                        <span>Pajak</span>
                        <span>{formatCurrency(selectedTransaction.pajak)}</span>
                      </div>
                    )}
                    {selectedTransaction.biayaLainnya > 0 && (
                      <div className="flex justify-between">
                        <span>Biaya Lainnya</span>
                        <span>
                          {formatCurrency(selectedTransaction.biayaLainnya)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm pt-2 border-t border-dashed border-gray-300 mt-2">
                      <span>Total</span>
                      <span>{formatCurrency(selectedTransaction.grandTotal)}</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-600">
                        Bayar ({selectedTransaction.metodePembayaran})
                      </span>
                      <span className="text-xs font-semibold text-gray-900">
                        {formatCurrency(selectedTransaction.nominalBayar)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Kembalian</span>
                      <span className="text-xs font-semibold text-emerald-600">
                        {formatCurrency(selectedTransaction.kembalian)}
                      </span>
                </div>
              </div>

                  <div className="pt-4 text-center border-t border-dashed border-gray-300 mt-2">
                    <p className="text-xs font-semibold text-gray-700">
                      Terima kasih
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Selamat berbelanja kembali
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                  <span className="ri-receipt-line text-4xl text-gray-300 mb-3"></span>
                  <p className="text-sm font-medium text-gray-700">
                    Belum ada transaksi yang dipilih
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Klik salah satu baris transaksi di sebelah kiri untuk
                    melihat detail struk.
                  </p>
                </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
