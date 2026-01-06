'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';
import CustomerDetailModal from './CustomerDetailModal';
import TransactionHistoryModal from './TransactionHistoryModal';
import { Customer } from './types';

interface ApiTransactionItem {
  id: number;
  nama_produk: string;
  qty: number;
  harga_jual: number;
  subtotal: number;
}

interface ApiTransaction {
  id: number;
  nomor_transaksi: string;
  waktu_pesan: string;
  grand_total: number;
  status: string;
  metode_pembayaran: string;
  items: ApiTransactionItem[];
}

interface ApiCustomerDetail {
  target: string;
  value: string;
}

interface ApiCustomer {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  stall_id: number;
  nama: string;
  total_transaksi: number;
  total_belanja: number;
  riwayat_transaksi?: ApiTransaction[];
  customer_details?: ApiCustomerDetail[];
}

interface ApiCustomersResponse {
  success: boolean;
  message: string;
  data: {
    data: ApiCustomer[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// Avatar colors
const avatarColors = ['#F97316', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)

  // Helper function to get customer details by target
  const getCustomerDetail = (customer: ApiCustomer, target: string): string => {
    if (!customer.customer_details || !Array.isArray(customer.customer_details)) {
      return '';
    }
    const detail = customer.customer_details.find((d) => d.target === target);
    return detail ? detail.value : '';
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    if (!amount) return 'Rp 0';
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Transform API data to UI format
  const transformCustomerData = (apiCustomer: ApiCustomer, index: number): Customer => {
    const phone = getCustomerDetail(apiCustomer, 'phone');
    const email = getCustomerDetail(apiCustomer, 'email');
    const address = getCustomerDetail(apiCustomer, 'address');

    return {
      id: String(apiCustomer.id),
      name: apiCustomer.nama || 'Tidak ada nama',
      initial: apiCustomer.nama ? apiCustomer.nama.charAt(0).toUpperCase() : '?',
      avatarBg: avatarColors[index % avatarColors.length],
      email: email || '-',
      phone: phone || '-',
      joinDate: formatDate(apiCustomer.created_at),
      address: address || '-',
      totalTransactions: apiCustomer.total_transaksi || 0,
      totalSpending: formatCurrency(apiCustomer.total_belanja || 0),
      totalSpendingRaw: apiCustomer.total_belanja || 0,
      status: 'Reguler',
      customer_details: apiCustomer.customer_details || [],
      created_at: apiCustomer.created_at,
    };
  };

  const fetchCustomers = async (currentPage: number, search: string = '') => {
    try {
      setLoading(true);
      setError(null);

      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      let url = `${API_BASE_URL}/master/customers?page=${currentPage}&limit=${limit}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const json: ApiCustomersResponse = await response.json();

      const mapped: Customer[] = json.data.data.map((item, index) =>
        transformCustomerData(item, index)
      );

      setCustomers(mapped);
      setPage(json.data.page);
      setTotalPages(json.data.total_pages);
      setTotalItems(json.data.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal memuat pelanggan';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(page, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (page !== 1 && searchQuery) {
      setPage(1);
    }
  }, [searchQuery]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const response = await fetch(`${API_BASE_URL}/master/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
        body: JSON.stringify({
          nama: formData.name,
          phone: formData.phone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // Reset form dan tutup modal
      setFormData({ name: '', phone: '' });
      setShowModal(false);
      
      // Refresh data customers
      fetchCustomers(page, searchQuery);
      alert('Pelanggan berhasil ditambahkan!');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal menambahkan pelanggan';
      alert(message);
    }
  };

  // Calculate stats from customers data
  const stats = useMemo(() => {
    // Calculate VIP (customers with 30+ transactions or 10M+ spending)
    const vipCount = customers.filter(
      (c) => c.totalTransactions >= 30 || c.totalSpendingRaw >= 10000000
    ).length;

    // Calculate new customers (joined in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCount = customers.filter((c) => {
      const joinDate = new Date(c.created_at);
      return joinDate >= thirtyDaysAgo;
    }).length;

    // Calculate active customers (have at least 1 transaction)
    const activeCount = customers.filter((c) => c.totalTransactions > 0).length;

    return [
      {
        icon: 'ri-user-line',
        iconBg: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        value: totalItems.toString(),
        label: 'Total Pelanggan',
      },
      {
        icon: 'ri-vip-crown-line',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
        value: vipCount.toString(),
        label: 'Pelanggan VIP',
      },
      {
        icon: 'ri-user-add-line',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        value: newCount.toString(),
        label: 'Pelanggan Baru',
      },
      {
        icon: 'ri-user-star-line',
        iconBg: 'bg-pink-50',
        iconColor: 'text-pink-600',
        value: activeCount.toString(),
        label: 'Pelanggan Aktif',
      },
    ];
  }, [customers, totalItems]);

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleViewTransactions = () => {
    setShowDetailModal(false);
    setShowTransactionModal(true);
  };

  const handleEditCustomer = () => {
    alert(`Edit data pelanggan: ${selectedCustomer?.name}\n\nFitur edit coming soon!`);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus ${customer.name}?`
      )
    ) {
      return;
    }

    try {
      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan');
      }

      const response = await fetch(`${API_BASE_URL}/master/customers/${customer.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert(`${customer.name} berhasil dihapus!`);
      fetchCustomers(page, searchQuery);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `Gagal menghapus ${customer.name}`;
      alert(message);
    }
  };

  // Helper function to escape CSV values
  const escapeCsvValue = (value: string | number): string => {
    const stringValue = String(value);
    // If value contains comma, quote, or newline, wrap it in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan');
      }

      // Fetch ALL customers with large limit
      let url = `${API_BASE_URL}/master/customers?page=1&limit=999999`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data untuk export');
      }

      const json: ApiCustomersResponse = await response.json();
      const allCustomers = json.data.data || [];

      // Create CSV content
      const headers = ['No', 'Nama', 'Email', 'Telepon', 'Alamat', 'Tanggal Bergabung', 'Total Transaksi', 'Total Belanja', 'Status'];
      const csvRows = [headers.map(escapeCsvValue).join(',')];

      allCustomers.forEach((customer, index) => {
        const phone = getCustomerDetail(customer, 'phone');
        const email = getCustomerDetail(customer, 'email');
        const address = getCustomerDetail(customer, 'address');

        const row = [
          index + 1,
          customer.nama || '-',
          email || '-',
          phone || '-',
          address || '-',
          formatDate(customer.created_at),
          customer.total_transaksi || 0,
          customer.total_belanja || 0,
          'Reguler',
        ];

        csvRows.push(row.map(escapeCsvValue).join(','));
      });

      // Create CSV string with BOM for UTF-8 (better Excel compatibility)
      const csvContent = '\uFEFF' + csvRows.join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Data_Pelanggan_${timestamp}.csv`;

      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      alert(`Data pelanggan berhasil diexport! (${allCustomers.length} data)`);
      setIsExporting(false);
    } catch (err) {
      setIsExporting(false);
      const message =
        err instanceof Error ? err.message : 'Gagal export data pelanggan';
      alert(message);
    }
  };

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <i className="ri-user-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Data Pelanggan</h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Kelola informasi pelanggan dan riwayat transaksi mereka
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base min-h-[44px]"
          >
            <i className="ri-user-add-line text-base sm:text-lg"></i>
            Tambah Pelanggan
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3">
              <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <i className={`${stat.icon} ${stat.iconColor} text-xl`}></i>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 truncate">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Cari pelanggan berdasarkan nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm"
                title="Hapus pencarian"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting || loading}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <i className="ri-download-line"></i>
                <span>Export</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-gray-100">
            {loading && (
              <div className="px-4 py-12 text-center">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Memuat data pelanggan...</span>
                </div>
              </div>
            )}
            {!loading && error && (
              <div className="px-4 py-12 text-center">
                <div className="inline-flex flex-col items-center gap-2 text-red-500">
                  <i className="ri-error-warning-line text-3xl"></i>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            )}
            {!loading && !error && customers.length === 0 && (
              <div className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <i className="ri-user-line text-3xl text-gray-300"></i>
                  <p className="text-sm font-medium text-gray-500">Tidak ada pelanggan</p>
                </div>
              </div>
            )}
                {!loading && !error && customers.map((customer) => (
              <div key={customer.id} className="p-4 active:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0"
                      style={{ backgroundColor: customer.avatarBg }}
                    >
                      {customer.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{customer.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Bergabung {customer.joinDate}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewDetail(customer)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg active:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer touch-manipulation"
                      title="Lihat Detail"
                    >
                      <i className="ri-eye-line text-lg"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg active:bg-red-50 text-red-500 transition-colors cursor-pointer touch-manipulation"
                      title="Hapus"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {customer.totalTransactions} transaksi
                  </span>
                  <span className="text-sm font-bold text-emerald-600">{customer.totalSpending}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <div className="max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-hide">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Pelanggan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Total Transaksi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Total Belanja
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center"
                    >
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        Memuat data pelanggan...
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center"
                    >
                      <div className="inline-flex flex-col items-center gap-2 text-red-500">
                        <i className="ri-error-warning-line text-4xl"></i>
                        <p className="font-medium">{error}</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && !error && customers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <i className="ri-user-line text-4xl text-gray-300"></i>
                        <p className="text-sm font-medium text-gray-500">Tidak ada pelanggan</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                          style={{ backgroundColor: customer.avatarBg }}
                        >
                          {customer.initial}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">Bergabung {customer.joinDate}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {customer.email !== '-' && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <i className="ri-mail-line text-gray-400"></i>
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone !== '-' && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <i className="ri-phone-line text-gray-400"></i>
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.email === '-' && customer.phone === '-' && (
                          <span className="text-sm text-gray-400">Tidak ada kontak</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {customer.totalTransactions} transaksi
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-emerald-600">{customer.totalSpending}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(customer)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
                          title="Lihat Detail"
                        >
                          <i className="ri-eye-line text-base"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <i className="ri-delete-bin-line text-base"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Menampilkan <span className="font-semibold text-gray-900">{customers.length}</span> dari <span className="font-semibold text-gray-900">{totalItems}</span> pelanggan <span className="hidden sm:inline">(halaman {page} dari {totalPages})</span>
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
              className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium active:bg-emerald-600 sm:hover:bg-emerald-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[44px] touch-manipulation"
            >
              Berikutnya
              <i className="ri-arrow-right-line ml-1"></i>
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Add Customer</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <span className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium active:bg-gray-200 sm:hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap min-h-[44px] touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-semibold active:bg-emerald-600 sm:hover:bg-emerald-600 transition-colors cursor-pointer whitespace-nowrap min-h-[44px] touch-manipulation"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <CustomerDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        customer={selectedCustomer}
        onEdit={handleEditCustomer}
        onViewTransactions={handleViewTransactions}
      />

      <TransactionHistoryModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        customer={selectedCustomer}
      />
    </div>
  );
}
