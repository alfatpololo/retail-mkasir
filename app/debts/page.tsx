'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

interface TransactionMethod {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  nama: string;
  tipe: string;
  tipe_biaya: string;
  aktif: boolean;
  urutan: number;
}

interface PiutangDetail {
  id: number;
  created_at: string;
  updated_at: string;
  id_piutang: number;
  nominal: number;
  catatan: string;
  transaction_method_id: number;
  tgl_dibayarkan: string;
  stall_id: number;
  transaction_method: TransactionMethod;
}

interface Transaction {
  id: number;
  created_at: string;
  updated_at: string;
  stall_id: number;
  bukakas_id: number;
  user_id: number;
  customer_id: number;
  transaction_method_id: number | null;
  nomor_transaksi: string;
  nomor_meja?: string;
  waktu_pesan: string;
  waktu_bayar: string | null;
  subtotal: number;
  diskon: number;
  pajak: number;
  biaya_lainnya: number;
  grand_total: number;
  nominal_bayar: number;
  kembalian: number;
  tipe: string;
  status: string;
  dibayar: boolean;
  pembayaran_melalui: string;
  catatan?: string;
  nama_pelanggan: string;
  batal: boolean;
  jatuh_tempo?: string;
}

interface ApiPiutang {
  id: number;
  created_at: string;
  updated_at: string;
  transaction_id: number;
  nama: string;
  nominal: number;
  catatan?: string;
  tgl_dibayarkan?: string;
  jatuh_tempo?: string;
  status: boolean;
  stall_id: number;
  transaction: Transaction;
  piutang_details?: PiutangDetail[];
  total_dibayar?: number;
  status_bayaran: string;
}

interface ApiPiutangsResponse {
  success: boolean;
  message: string;
  data: {
    data: ApiPiutang[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface DebtItem {
  id: string;
  customerName: string;
  phone?: string;
  total: number;
  method: string;
  status: string;
  createdAt: string;
  nomorTransaksi: string;
  totalDibayar?: number;
  statusBayaran: string;
  jatuhTempo?: string;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [allDebts, setAllDebts] = useState<DebtItem[]>([]); // Untuk summary
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [jatuhTempoFilter, setJatuhTempoFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(1); // Default Cash (1)
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);

  // Fetch summary data (all piutangs untuk summary)
  const fetchSummary = async () => {
    try {
      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        return;
      }

      // Fetch semua data untuk summary (limit besar)
      const response = await fetch(`${API_BASE_URL}/piutangs?page=1&limit=1000`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        return;
      }

      const data: ApiPiutangsResponse = await response.json();

      if (data.success && data.data.data) {
        const transformedDebts: DebtItem[] = data.data.data.map((piutang) => {
          let method = '-';
          // Jika belum bayar, method tetap "-"
          if (piutang.status_bayaran !== 'belum bayar') {
          if (piutang.piutang_details && piutang.piutang_details.length > 0) {
            method = piutang.piutang_details[0].transaction_method?.nama || 'Tunai';
            } else {
              method = 'Tunai';
            }
          }

          let statusText = 'Belum Lunas';
          if (piutang.status_bayaran === 'lunas') {
            statusText = 'Lunas';
          } else if (piutang.status_bayaran === 'belum bayar') {
            statusText = 'Belum Bayar';
          }

          return {
            id: String(piutang.id),
            customerName: piutang.nama || piutang.transaction.nama_pelanggan || 'Guest',
            phone: '-',
            total: piutang.nominal,
            method: method,
            status: statusText,
            createdAt: piutang.created_at,
            nomorTransaksi: piutang.transaction.nomor_transaksi,
            totalDibayar: piutang.total_dibayar,
            statusBayaran: piutang.status_bayaran,
            jatuhTempo: piutang.jatuh_tempo,
          };
        });

        setAllDebts(transformedDebts);
      }
    } catch (err) {
      console.error('Failed to fetch summary', err);
    }
  };

  const fetchPiutangs = async (currentPage: number = page) => {
    try {
      setLoading(true);
      setError(null);

      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', String(limit));
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (statusFilter !== 'Semua') {
        if (statusFilter === 'Lunas') {
          params.append('status', 'lunas');
        } else if (statusFilter === 'Belum Bayar') {
          params.append('status', 'belum bayar');
        } else if (statusFilter === 'Belum Lunas') {
          // Tidak ada filter khusus untuk "Belum Lunas", kita filter di client
        }
      }
      
      if (startDate) {
        params.append('start_date', startDate);
      }
      
      if (endDate) {
        params.append('end_date', endDate);
      }

      const response = await fetch(`${API_BASE_URL}/piutangs?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ApiPiutangsResponse = await response.json();

      if (data.success && data.data.data) {
        const transformedDebts: DebtItem[] = data.data.data.map((piutang) => {
          // Ambil metode pembayaran dari piutang_details atau transaction
          let method = '-';
          // Jika belum bayar, method tetap "-"
          if (piutang.status_bayaran !== 'belum bayar') {
          if (piutang.piutang_details && piutang.piutang_details.length > 0) {
            method = piutang.piutang_details[0].transaction_method?.nama || 'Tunai';
          } else if (piutang.transaction.transaction_method_id) {
            method = 'Tunai'; // Default jika tidak ada detail
            }
          }

          // Format status bayaran
          let statusText = 'Belum Lunas';
          if (piutang.status_bayaran === 'lunas') {
            statusText = 'Lunas';
          } else if (piutang.status_bayaran === 'belum bayar') {
            statusText = 'Belum Bayar';
          }

          return {
            id: String(piutang.id),
            customerName: piutang.nama || piutang.transaction.nama_pelanggan || 'Guest',
            phone: '-', // API tidak menyediakan phone di response
            total: piutang.nominal,
            method: method,
            status: statusText,
            createdAt: piutang.created_at,
            nomorTransaksi: piutang.transaction.nomor_transaksi,
            totalDibayar: piutang.total_dibayar,
            statusBayaran: piutang.status_bayaran,
            jatuhTempo: piutang.jatuh_tempo,
          };
        });

        setDebts(transformedDebts);
        setTotalPages(data.data.total_pages);
        setTotalItems(data.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch piutangs', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data piutang');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary from all debts
  const summary = useMemo(() => {
    const totalHutang = allDebts.reduce((sum, debt) => sum + debt.total, 0);
    const uniqueCustomers = new Set(allDebts.map(debt => debt.customerName)).size;
    const totalDibayarkan = allDebts.reduce((sum, debt) => sum + (debt.totalDibayar || 0), 0);
    const totalBelumDibayarkan = allDebts
      .filter(debt => debt.statusBayaran !== 'lunas')
      .reduce((sum, debt) => sum + debt.total, 0);

    return {
      totalHutang,
      totalUserHutang: uniqueCustomers,
      totalDibayarkan,
      totalBelumDibayarkan,
    };
  }, [allDebts]);

  // Filter debts berdasarkan status dan jatuh tempo
  const filteredDebts = useMemo(() => {
    let filtered = debts;

    // Filter berdasarkan status
    if (statusFilter !== 'Semua') {
      filtered = filtered.filter(debt => {
      if (statusFilter === 'Lunas') return debt.statusBayaran === 'lunas';
      if (statusFilter === 'Belum Bayar') return debt.statusBayaran === 'belum bayar';
      if (statusFilter === 'Belum Lunas') return debt.statusBayaran !== 'lunas' && debt.statusBayaran !== 'belum bayar';
      return true;
    });
    }

    // Filter berdasarkan jatuh tempo
    if (jatuhTempoFilter !== 'Semua') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(debt => {
        if (jatuhTempoFilter === 'Tidak Ada') {
          return !debt.jatuhTempo;
        }

        if (!debt.jatuhTempo) {
          return false;
        }
        
        const jatuhTempoDate = new Date(debt.jatuhTempo);
        jatuhTempoDate.setHours(0, 0, 0, 0);
        const jatuhTempoTime = jatuhTempoDate.getTime();
        const todayTime = today.getTime();

        if (jatuhTempoFilter === 'Sudah Jatuh Tempo') {
          return jatuhTempoTime < todayTime && debt.statusBayaran !== 'lunas';
        }
        if (jatuhTempoFilter === 'Belum Jatuh Tempo') {
          return jatuhTempoTime >= todayTime;
        }
        if (jatuhTempoFilter === 'Hari Ini') {
          return jatuhTempoTime === todayTime;
        }
        return true;
      });
    }

    return filtered;
  }, [debts, statusFilter, jatuhTempoFilter]);

  useEffect(() => {
    fetchPiutangs(page);
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Reset page saat filter berubah
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    } else {
      fetchPiutangs(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, jatuhTempoFilter, searchQuery, startDate, endDate]);

  // Handle open pay modal
  const handleOpenPayModal = (debt: DebtItem) => {
    setSelectedDebt(debt);
    const remaining = debt.total - (debt.totalDibayar || 0);
    setPaymentAmount(remaining.toString());
    setPaymentNote('');
    setPaymentMethodId(1); // Default Cash
    setShowPayModal(true);
  };

  // Handle pay debt
  const handlePayDebt = async () => {
    if (!selectedDebt || !paymentMethodId || !paymentAmount) {
      alert('Mohon lengkapi semua field');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Nominal pembayaran tidak valid');
      return;
    }

    const remaining = selectedDebt.total - (selectedDebt.totalDibayar || 0);
    if (amount > remaining) {
      alert(`Nominal pembayaran tidak boleh lebih dari sisa hutang (Rp ${remaining.toLocaleString('id-ID')})`);
      return;
    }

    try {
      setIsPaying(true);
      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan');
      }

      // Prepare request body sesuai dengan handler Go
      const requestBody: {
        id_piutang: number;
        nominal: number;
        catatan?: string;
        transaction_method_id?: number;
        tgl_dibayarkan?: string;
      } = {
        id_piutang: Number(selectedDebt.id),
        nominal: amount,
      };

      if (paymentNote.trim()) {
        requestBody.catatan = paymentNote.trim();
      }

      if (paymentMethodId) {
        requestBody.transaction_method_id = paymentMethodId;
      }

      // Set tgl_dibayarkan ke waktu sekarang
      const now = new Date();
      requestBody.tgl_dibayarkan = now.toISOString();

      const response = await fetch(`${API_BASE_URL}/piutang-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal melakukan pembayaran');
      }

      alert('Pembayaran berhasil!');
      setShowPayModal(false);
      setSelectedDebt(null);
      setPaymentAmount('');
      setPaymentNote('');
      setPaymentMethodId(1);
      
      // Refresh data
      fetchPiutangs(page);
      fetchSummary();
    } catch (err) {
      console.error('Failed to pay debt', err);
      alert(err instanceof Error ? err.message : 'Gagal melakukan pembayaran');
    } finally {
      setIsPaying(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <i className="ri-exchange-dollar-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Data Piutang</h1>
              <p className="text-gray-600 text-xs sm:text-sm">Daftar transaksi yang ditandai piutang</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <i className="ri-exchange-dollar-line text-white text-lg"></i>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-700">Total Hutang</p>
                <p className="text-xl font-bold text-emerald-900">Rp {summary.totalHutang.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <i className="ri-user-line text-white text-lg"></i>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-700">Total User Hutang</p>
                <p className="text-xl font-bold text-blue-900">{summary.totalUserHutang}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border border-green-200 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-white text-lg"></i>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-green-700">Total Dibayarkan</p>
                <p className="text-lg font-bold text-green-900">Rp {summary.totalDibayarkan.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5 border border-red-200 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                <i className="ri-alert-line text-white text-lg"></i>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-red-700">Total Belum Dibayarkan</p>
                <p className="text-lg font-bold text-red-900">Rp {summary.totalBelumDibayarkan.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 space-y-4">
          {/* Search dan Filter Tanggal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari Nama Pelanggan
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pelanggan..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter Status:</label>
          <div className="flex flex-wrap gap-2">
            {['Semua', 'Lunas', 'Belum Bayar', 'Belum Lunas'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status}
              </button>
            ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter Jatuh Tempo:</label>
            <div className="flex flex-wrap gap-2">
              {['Semua', 'Sudah Jatuh Tempo', 'Belum Jatuh Tempo', 'Hari Ini', 'Tidak Ada'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setJatuhTempoFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    jatuhTempoFilter === filter
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <div className="max-h-[calc(100vh-18rem)] overflow-y-auto scrollbar-hide">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Pelanggan</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Telepon</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Metode</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Jatuh Tempo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <p className="text-sm font-medium text-gray-500">Memuat data...</p>
                      </div>
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <i className="ri-error-warning-line text-4xl text-red-300"></i>
                        <p className="text-sm font-medium text-red-500">{error}</p>
                        <button
                          onClick={() => fetchPiutangs(page)}
                          className="mt-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredDebts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <i className="ri-exchange-dollar-line text-4xl text-gray-300"></i>
                        <p className="text-sm font-medium text-gray-500">
                          {statusFilter === 'Semua' ? 'Tidak ada data piutang' : `Tidak ada data piutang dengan status "${statusFilter}"`}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredDebts.map((debt) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const todayTime = today.getTime();
                  
                  let isOverdue = false;
                  if (debt.jatuhTempo) {
                    const jatuhTempoDate = new Date(debt.jatuhTempo);
                    jatuhTempoDate.setHours(0, 0, 0, 0);
                    isOverdue = jatuhTempoDate.getTime() < todayTime && debt.statusBayaran !== 'lunas';
                  }
                  
                  return (
                    <tr 
                      key={debt.id} 
                      className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
                      onClick={() => debt.statusBayaran !== 'lunas' && handleOpenPayModal(debt)}
                    >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold flex items-center justify-center shadow-md">
                          {debt.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{debt.customerName}</p>
                          <p className="text-xs text-gray-500 font-mono">{debt.nomorTransaksi}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{debt.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-emerald-600">Rp {debt.total.toLocaleString('id-ID')}</span>
                        {debt.totalDibayar !== undefined && debt.totalDibayar > 0 && (
                          <span className="text-xs text-gray-500">Dibayar: Rp {debt.totalDibayar.toLocaleString('id-ID')}</span>
                        )}
                      </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {debt.method === '-' ? (
                          <span className="text-sm text-gray-400">-</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {debt.method}
                          </span>
                        )}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        debt.statusBayaran === 'lunas' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : debt.statusBayaran === 'belum bayar'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {debt.status}
                      </span>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {debt.jatuhTempo ? (
                          <span className={`${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                            {new Date(debt.jatuhTempo).toLocaleDateString('id-ID', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric'
                            })}
                            {isOverdue && (
                              <span className="ml-2 px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                                Terlambat
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(debt.createdAt).toLocaleDateString('id-ID', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {debt.statusBayaran !== 'lunas' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPayModal(debt);
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                          >
                            Bayar
                          </button>
                        )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-5 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold text-gray-900">{filteredDebts.length}</span> dari <span className="font-semibold text-gray-900">{totalItems}</span> piutang <span className="hidden sm:inline">(halaman {page} dari {totalPages})</span>
              {statusFilter !== 'Semua' && (
                <span className="ml-2 text-emerald-600">• Filter: {statusFilter}</span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
                className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 active:bg-gray-50 sm:hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
              >
                <i className="ri-arrow-left-line mr-1"></i>
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || loading}
                className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium active:bg-emerald-700 sm:hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[44px] touch-manipulation"
              >
                Berikutnya
                <i className="ri-arrow-right-line ml-1"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Pembayaran Utang */}
      {showPayModal && selectedDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Bayar Utang</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedDebt.customerName}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedDebt(null);
                    setPaymentAmount('');
                    setPaymentNote('');
                    setPaymentMethodId(1);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <i className="ri-close-line text-xl text-gray-600"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Total Utang:</span>
                  <span className="text-lg font-bold text-gray-900">Rp {selectedDebt.total.toLocaleString('id-ID')}</span>
                </div>
                {selectedDebt.totalDibayar !== undefined && selectedDebt.totalDibayar > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Sudah Dibayar:</span>
                    <span className="text-sm font-semibold text-emerald-600">Rp {selectedDebt.totalDibayar.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Sisa Utang:</span>
                  <span className="text-lg font-bold text-emerald-600">
                    Rp {(selectedDebt.total - (selectedDebt.totalDibayar || 0)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nominal Pembayaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Masukkan nominal pembayaran"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="1"
                  max={selectedDebt.total - (selectedDebt.totalDibayar || 0)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethodId(1)}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethodId === 1
                        ? 'bg-green-50 text-green-700 border-2 border-green-500'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethodId(2)}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethodId === 2
                        ? 'bg-green-50 text-green-700 border-2 border-green-500'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Debit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethodId(4)}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethodId === 4
                        ? 'bg-green-50 text-green-700 border-2 border-green-500'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    QRIS
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Catatan pembayaran..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedDebt(null);
                    setPaymentAmount('');
                    setPaymentNote('');
                    setPaymentMethodId(1);
                  }}
                  disabled={isPaying}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handlePayDebt}
                  disabled={isPaying || !paymentAmount || !paymentMethodId}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPaying ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </span>
                  ) : (
                    'Bayar Utang'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

