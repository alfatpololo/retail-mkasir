'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import { getBukakasId } from '@/utils/cashierSession';
import Sidebar from '@/components/Sidebar';

interface Expense {
  id: number;
  kategori?: string;
  category?: string;
  deskripsi?: string;
  description?: string;
  jumlah?: number;
  amount?: number;
  tanggal?: string;
  date?: string;
  created_at?: string;
  jenis?: string;
  nama?: string;
  nominal?: number;
  catatan?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const DataPengeluaran = () => {
  const router = useRouter();
  
  // Notification helpers
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // Fallback to alert since stores module doesn't exist
    alert(message);
  };

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 1
  });

  // Filter states
  const [selectedJenisFilter, setSelectedJenisFilter] = useState('Semua');
  const jenisFilters = ['Semua', 'Operasional', 'Investasi', 'Lainnya'];
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [formData, setFormData] = useState({
    kategori: '',
    deskripsi: '',
    jumlah: '',
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'oprasional'
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)

  const itemsPerPage = 20;

  // Helper function to format currency
  const formatCurrency = (amount: number | string | undefined | null): string => {
    if (!amount) return 'Rp 0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'Rp 0';
    return `Rp ${numAmount.toLocaleString('id-ID')}`;
  };

  // Helper function to format currency input (remove formatting)
  const formatCurrencyInput = (value: string): string => {
    // Remove all non-digit characters
    return value.replace(/\D/g, '');
  };

  // Helper function to validate form
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.kategori || formData.kategori.trim() === '') {
      errors.kategori = 'Kategori/Nama harus diisi';
    }
    
    if (!formData.deskripsi || formData.deskripsi.trim() === '') {
      errors.deskripsi = 'Deskripsi harus diisi';
    }
    
    if (!formData.jumlah || formData.jumlah.trim() === '') {
      errors.jumlah = 'Jumlah harus diisi';
    } else {
      const amount = parseFloat(formData.jumlah);
      if (isNaN(amount) || amount <= 0) {
        errors.jumlah = 'Jumlah harus lebih dari 0';
      }
    }
    
    if (!formData.tanggal) {
      errors.tanggal = 'Tanggal harus diisi';
    }
    
    if (!formData.jenis) {
      errors.jenis = 'Jenis pengeluaran harus dipilih';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper function to format date
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Helper function to format datetime
  const formatDateTime = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
  };

  // Helper function to get jenis color
  const getJenisColor = (jenis: string | undefined): string => {
    if (!jenis) return '#6366F1';
    const jenisLower = jenis.toLowerCase();
    if (jenisLower === 'oprasional' || jenisLower === 'operasional') {
      return '#F97316'; // Orange
    } else if (jenisLower === 'investasi') {
      return '#3B82F6'; // Blue
    } else if (jenisLower === 'lainnya' || jenisLower === 'lain-lain') {
      return '#6B7280'; // Gray
    }
    return '#6366F1'; // Default
  };

  // Helper function to get jenis display name
  const getJenisDisplay = (jenis: string | undefined): string => {
    if (!jenis) return '-';
    const jenisLower = jenis.toLowerCase();
    if (jenisLower === 'oprasional' || jenisLower === 'operasional') {
      return 'Operasional';
    } else if (jenisLower === 'investasi') {
      return 'Investasi';
    } else if (jenisLower === 'lainnya' || jenisLower === 'lain-lain') {
      return 'Lainnya';
    }
    return jenis;
  };

  // Get JWT PIN from localStorage
  const getJwtPin = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jwt_pin');
    }
    return null;
  };

  // Fetch on mount and when page/search/filters change
  useEffect(() => {
    const loadData = async () => {
    try {
      console.log('=== FETCHING EXPENSES ===');
        console.log('Page:', currentPage);
        console.log('Search:', searchQuery);
        console.log('Jenis Filter:', selectedJenisFilter);
        console.log('Date Range:', startDate, '-', endDate);
      
      setIsLoading(true);
      
      const jwtPin = getJwtPin();
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }
      
      const params = new URLSearchParams();
        params.set('page', String(currentPage));
      params.set('limit', String(itemsPerPage));
      
      // Add search if exists
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }
        
        // Add jenis filter if not "Semua"
        if (selectedJenisFilter !== 'Semua') {
          const jenisValue = selectedJenisFilter.toLowerCase();
          params.set('jenis', jenisValue);
        }
        
        // Add date range filter if exists
        if (startDate) {
          params.set('start_date', startDate);
        }
        if (endDate) {
          params.set('end_date', endDate);
      }
      
      console.log('API params:', params.toString());
      
      const response = await fetch(
          `${API_BASE_URL}/pengeluaran?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { message?: string }));
        throw new Error(
          (errorData as { message?: string })?.message || `HTTP error! status: ${response.status}`
        );
      }
      
      const json = await response.json() as { success?: boolean; data?: { data?: Expense[]; total?: number; page?: number; limit?: number; total_pages?: number } | Expense[]; message?: string };
      
      console.log('=== API RESPONSE ===');
      console.log('Full response:', JSON.stringify(json, null, 2));
      
        // Handle API response structure: { success: true, data: { data: [...], total, page, limit, total_pages } }
        let responseData: Expense[] = [];
        let paginationData: Pagination = {
          total: 0,
          page: 1,
          limit: 20,
          total_pages: 1
        };

        if (json?.success === true && json?.data) {
          // Standard API response structure
          if (Array.isArray(json.data)) {
            responseData = json.data;
            paginationData = {
              total: json.data.length,
              page: 1,
              limit: 20,
              total_pages: 1
            };
          } else {
            responseData = json.data.data || [];
            paginationData = {
              total: json.data.total || 0,
              page: json.data.page || 1,
              limit: json.data.limit || 20,
              total_pages: json.data.total_pages || 1
            };
          }
        } else {
          // Fallback for different response structures
          if (Array.isArray(json?.data)) {
            responseData = json.data;
            paginationData = {
              total: json.data.length,
              page: 1,
              limit: 20,
              total_pages: 1
            };
          } else {
            if (Array.isArray(json?.data)) {
              responseData = json.data;
              paginationData = {
                total: json.data.length,
                page: 1,
                limit: 20,
                total_pages: 1
              };
            } else if (json?.data && typeof json.data === 'object' && 'data' in json.data) {
              const dataObj = json.data as { data?: Expense[]; total?: number; page?: number; limit?: number; total_pages?: number };
              responseData = dataObj.data || [];
              paginationData = {
                total: dataObj.total || 0,
                page: dataObj.page || 1,
                limit: dataObj.limit || 20,
                total_pages: dataObj.total_pages || 1
              };
            } else {
              responseData = [];
              paginationData = {
                total: 0,
                page: 1,
                limit: 20,
                total_pages: 1
              };
            }
          }
        }
      
      console.log('Expenses count:', responseData.length);
      console.log('Pagination:', JSON.stringify(paginationData, null, 2));
      
      setExpenses(responseData);
      setPagination(paginationData);
      
      console.log('✅ Expenses loaded successfully');
      setIsLoading(false);
      
    } catch (err) {
      console.error('=== FETCH EXPENSES ERROR ===');
      console.error('Error:', err);
      
      setIsLoading(false);
      
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat data pengeluaran';
      showNotification(errorMessage, 'error');
      setExpenses([]);
    }
  };

    loadData();
  }, [currentPage, searchQuery, selectedJenisFilter, startDate, endDate]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, selectedJenisFilter, startDate, endDate]);

  // Debounce search
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timer = setTimeout(() => {
      // Search is handled in the main useEffect
    }, 500);
    
    setSearchDebounce(timer);
    
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchQuery]);

  // Calculate stats from expenses data
  const stats = React.useMemo(() => {
    // Calculate total amount
    const totalAmount = expenses.reduce((sum, expense) => {
      const amount = expense.nominal || expense.jumlah || expense.amount || 0;
      return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
    }, 0);
    
    // Calculate total per jenis
    const totalPerJenis = {
      oprasional: 0,
      investasi: 0,
      lainnya: 0
    };
    
    expenses.forEach(expense => {
      const jenis = (expense.jenis || '').toLowerCase();
      const amount = expense.nominal || expense.jumlah || expense.amount || 0;
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      if (jenis === 'oprasional' || jenis === 'operasional') {
        totalPerJenis.oprasional += numAmount;
      } else if (jenis === 'investasi') {
        totalPerJenis.investasi += numAmount;
      } else if (jenis === 'lainnya' || jenis === 'lain-lain') {
        totalPerJenis.lainnya += numAmount;
      }
    });
    
    return {
      totalAmount,
      totalItems: expenses.length,
      totalPerJenis
    };
  }, [expenses]);

  const handleViewDetail = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDetailModal(true);
  };

  const handleAddExpense = () => {
    setFormData({
      kategori: '',
      deskripsi: '',
      jumlah: '',
      tanggal: new Date().toISOString().split('T')[0],
      jenis: 'oprasional'
    });
    setShowAddModal(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    const amount = expense.nominal || expense.jumlah || expense.amount || 0;
    const dateStr = expense.tanggal || expense.date || expense.created_at;
    const jenis = expense.jenis || 'oprasional';
    setFormData({
      kategori: expense.nama || expense.kategori || expense.category || '',
      deskripsi: expense.catatan || expense.deskripsi || expense.description || '',
      jumlah: typeof amount === 'number' ? String(amount) : String(amount || ''),
      tanggal: dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      jenis: jenis.toLowerCase()
    });
    setShowEditModal(true);
  };

  const handleSaveExpense = async (isEdit = false) => {
    try {
      // Validate form
      if (!validateForm()) {
        showNotification('Mohon lengkapi semua field dengan benar', 'error');
        return;
      }

      const jwtPin = getJwtPin();
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      setIsSaving(true);

      // Convert date to ISO format
      const tanggalDate = new Date(formData.tanggal);
      const tanggalISO = tanggalDate.toISOString();

      const payload: {
        nama: string;
        nominal: number;
        jenis: string;
        tanggal: string;
        catatan?: string;
        bukakas_id?: number;
      } = {
        nama: formData.kategori,
        nominal: parseFloat(formData.jumlah),
        jenis: formData.jenis,
        tanggal: tanggalISO,
      };

      // Add catatan if not empty
      if (formData.deskripsi && formData.deskripsi.trim()) {
        payload.catatan = formData.deskripsi;
      }

      // Add bukakas_id hanya saat menambah (bukan edit)
      if (!isEdit) {
        const bukakasId = getBukakasId();
        if (bukakasId) {
          payload.bukakas_id = bukakasId;
        }
      }

      if (isEdit && !selectedExpense) {
        throw new Error('Data pengeluaran tidak ditemukan');
      }

      const url = isEdit 
        ? `${API_BASE_URL}/pengeluaran/${selectedExpense!.id}`
        : `${API_BASE_URL}/pengeluaran`;
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { message?: string }));
        throw new Error(
          (errorData as { message?: string })?.message || `HTTP error! status: ${response.status}`
        );
      }

      showNotification(`Pengeluaran berhasil ${isEdit ? 'diupdate' : 'ditambahkan'}!`, 'success');

      setShowAddModal(false);
      setShowEditModal(false);
      setFormErrors({});
      setFormData({
        kategori: '',
        deskripsi: '',
        jumlah: '',
        tanggal: new Date().toISOString().split('T')[0],
        jenis: 'oprasional'
      });

      // Refresh list
      if (currentPage === 1) {
        // Force refresh by temporarily changing page
        setCurrentPage(2);
        setTimeout(() => setCurrentPage(1), 100);
      } else {
        setCurrentPage(1);
      }

      setIsSaving(false);

    } catch (err) {
      console.error('=== SAVE EXPENSE ERROR ===');
      console.error('Error:', err);
      
      setIsSaving(false);
      const errorMessage = err instanceof Error ? err.message : `Gagal ${isEdit ? 'mengupdate' : 'menambahkan'} pengeluaran`;
      showNotification(errorMessage, 'error');
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    console.log('=== DELETE EXPENSE ===');
    console.log('Expense:', expense);
    
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pengeluaran ini?`)) {
      return;
    }
    
    try {
      const jwtPin = getJwtPin();
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      console.log('Deleting expense ID:', expense.id);
      
      const response = await fetch(
        `${API_BASE_URL}/pengeluaran/${expense.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { message?: string }));
        throw new Error(
          (errorData as { message?: string })?.message || `HTTP error! status: ${response.status}`
        );
      }
      
      console.log('Delete response: Success');
      
      showNotification('Pengeluaran berhasil dihapus!', 'success');
      
      // Refresh list
      if (currentPage === 1) {
        // Force refresh by temporarily changing page
        setCurrentPage(2);
        setTimeout(() => setCurrentPage(1), 100);
      } else {
        setCurrentPage(1);
      }
      
    } catch (err) {
      console.error('=== DELETE ERROR ===');
      console.error('Error:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus pengeluaran';
      showNotification(errorMessage, 'error');
    }
  };

  const handleExport = async () => {
    try {
      console.log('=== EXPORTING EXPENSES ===');
      setIsExporting(true);
      
      const jwtPin = getJwtPin();
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      // Fetch ALL expenses with large limit (using current filters)
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '999999'); // Large number to get all data
      
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      
      // Add jenis filter if not "Semua"
      if (selectedJenisFilter !== 'Semua') {
        const jenisValue = selectedJenisFilter.toLowerCase();
        params.set('jenis', jenisValue);
      }
      
      // Add date range filter if exists
      if (startDate) {
        params.set('start_date', startDate);
      }
      if (endDate) {
        params.set('end_date', endDate);
      }
      
      console.log('Export params:', params.toString());
      
      const response = await fetch(
        `${API_BASE_URL}/pengeluaran?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { message?: string }));
        throw new Error(
          (errorData as { message?: string })?.message || `HTTP error! status: ${response.status}`
        );
      }

      const json = await response.json() as { success?: boolean; data?: { data?: Expense[] } | Expense[] };
      
      // Handle API response structure
      let allExpenses: Expense[] = [];
      if (json?.success === true && json?.data) {
        if (Array.isArray(json.data)) {
          allExpenses = json.data;
        } else if ('data' in json.data && Array.isArray(json.data.data)) {
          allExpenses = json.data.data;
        }
      } else {
        if (Array.isArray(json?.data)) {
          allExpenses = json.data;
        } else if (json?.data && typeof json.data === 'object' && 'data' in json.data) {
          const dataObj = json.data as { data?: Expense[] };
          allExpenses = dataObj.data || [];
        } else {
          allExpenses = [];
        }
      }
      
      console.log('Exporting', allExpenses.length, 'expenses');
      
      // Transform to Excel format
      const excelData = allExpenses.map((expense, index) => {
        return {
          'No': index + 1,
          'Tanggal': formatDate(expense.tanggal || expense.date || expense.created_at),
          'Kategori': expense.nama || expense.kategori || expense.category || '-',
          'Jenis': expense.jenis ? getJenisDisplay(expense.jenis) : '-',
          'Deskripsi': expense.catatan || expense.deskripsi || expense.description || '-',
          'Jumlah': expense.nominal || expense.jumlah || expense.amount || 0,
          'Dibuat': formatDateTime(expense.created_at)
        };
      });
      
      // Convert to CSV format (simpler, no library needed)
      const headers = Object.keys(excelData[0] || {});
      const csvRows = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(',')
        )
      ];
      const csvContent = csvRows.join('\n');
      
      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Data_Pengeluaran_${timestamp}.csv`;
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      console.log('✅ Export successful');
      
      showNotification(`Data pengeluaran berhasil diexport! (${allExpenses.length} data)`, 'success');
      
      setIsExporting(false);
      
    } catch (err) {
      console.error('=== EXPORT ERROR ===');
      console.error('Error:', err);
      
      setIsExporting(false);
      
      const errorMessage = err instanceof Error ? err.message : 'Gagal export data pengeluaran';
      showNotification(errorMessage, 'error');
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
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.back()}
              style={styles.backButton}
              className="hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all"
              title="Kembali"
            >
              <i className="ri-arrow-left-line" style={{ fontSize: '20px' }}></i>
            </button>
            <div>
              <h1 style={styles.title}>Data Pengeluaran</h1>
              <p style={styles.subtitle}>Kelola catatan pengeluaran operasional toko</p>
            </div>
          </div>
          <button 
            className="expense-add-button"
            style={styles.addButton} 
            onClick={handleAddExpense}
          >
            <i className="ri-add-line" style={{ fontSize: '20px' }}></i>
            <span>Tambah Pengeluaran</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsContainer}>
          <div style={styles.mainStatCard}>
            <div style={styles.mainStatContent}>
              <div>
                <div style={styles.mainStatLabel}>Total Pengeluaran</div>
                <div style={styles.mainStatValue}>{formatCurrency(stats.totalAmount)}</div>
                <div style={styles.mainStatSubtext}>{stats.totalItems} transaksi</div>
              </div>
              <div style={styles.mainStatIcon}>
                <i className="ri-file-list-line" style={{ fontSize: '32px', color: 'white' }}></i>
              </div>
            </div>
          </div>
          <div style={styles.jenisStatsGrid}>
            <div style={{...styles.jenisStatCard, borderColor: getJenisColor('oprasional') + '40', backgroundColor: getJenisColor('oprasional') + '08'}}>
              <div style={{...styles.jenisStatLabel, color: getJenisColor('oprasional')}}>Operasional</div>
              <div style={styles.jenisStatValue}>{formatCurrency(stats.totalPerJenis.oprasional)}</div>
            </div>
            <div style={{...styles.jenisStatCard, borderColor: getJenisColor('investasi') + '40', backgroundColor: getJenisColor('investasi') + '08'}}>
              <div style={{...styles.jenisStatLabel, color: getJenisColor('investasi')}}>Investasi</div>
              <div style={styles.jenisStatValue}>{formatCurrency(stats.totalPerJenis.investasi)}</div>
            </div>
            <div style={{...styles.jenisStatCard, borderColor: getJenisColor('lainnya') + '40', backgroundColor: getJenisColor('lainnya') + '08'}}>
              <div style={{...styles.jenisStatLabel, color: getJenisColor('lainnya')}}>Lainnya</div>
              <div style={styles.jenisStatValue}>{formatCurrency(stats.totalPerJenis.lainnya)}</div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div style={styles.actionsBar}>
          <div style={styles.searchWrapper}>
            <i className="ri-search-line" style={{...styles.searchIcon, fontSize: '20px'}}></i>
            <input
              type="text"
              className="expense-form-input"
              placeholder="Cari pengeluaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
              disabled={isLoading}
            />
            {searchQuery && (
              <button
                className="expense-clear-search"
                style={styles.clearSearchButton}
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div style={styles.actionButtons}>
            <button 
              className="expense-filter-button"
              style={styles.filterButton}
              onClick={() => setShowFilterModal(true)}
              title="Filter"
            >
              <i className="ri-filter-line" style={{ fontSize: '18px' }}></i>
              <span>Filter</span>
            </button>
            <button 
              className="expense-export-button"
              style={{
                ...styles.exportButton,
                opacity: isExporting || isLoading ? 0.6 : 1,
                cursor: isExporting || isLoading ? 'not-allowed' : 'pointer'
              }}
              onClick={handleExport}
              disabled={isExporting || isLoading}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <i className="ri-download-line" style={{ fontSize: '18px' }}></i>
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        {(selectedJenisFilter !== 'Semua' || startDate || endDate) && (
          <div style={styles.filterChips}>
            {selectedJenisFilter !== 'Semua' && (
              <div style={styles.filterChip}>
                <span>Jenis: {selectedJenisFilter}</span>
                <button
                  className="expense-filter-chip-close"
                  style={styles.filterChipClose}
                  onClick={() => {
                    setSelectedJenisFilter('Semua');
                    setCurrentPage(1);
                  }}
                >
                  ×
                </button>
              </div>
            )}
            {(startDate || endDate) && (
              <div style={styles.filterChip}>
                <span>
                  {startDate && endDate 
                    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                    : startDate 
                    ? `Dari: ${formatDate(startDate)}`
                    : `Sampai: ${formatDate(endDate)}`}
                </span>
                <button
                  style={styles.filterChipClose}
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setCurrentPage(1);
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        {/* Expenses Table */}
        <div style={styles.tableSection}>
          {isLoading ? (
            <div style={styles.loadingContainer}>
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p style={styles.loadingText}>Memuat data pengeluaran...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div style={styles.emptyState}>
              <i className="ri-file-list-line" style={{ fontSize: '48px', color: '#D1D5DB' }}></i>
              <p style={styles.emptyText}>
                {searchQuery ? 'Tidak ada pengeluaran yang sesuai dengan pencarian' : 'Belum ada data pengeluaran'}
              </p>
            </div>
          ) : (
            <>
              <div style={styles.tableContainer}>
                <div style={styles.tableHeader}>
                  <div style={{...styles.tableHeaderCell, flex: 1.5}}>Tanggal</div>
                  <div style={{...styles.tableHeaderCell, flex: 1.5}}>Kategori</div>
                  <div style={{...styles.tableHeaderCell, flex: 2}}>Deskripsi</div>
                  <div style={{...styles.tableHeaderCell, flex: 1.5}}>Jumlah</div>
                  <div style={{...styles.tableHeaderCell, flex: 0.8}}>Aksi</div>
                </div>

                <div style={styles.tableBody}>
                  {expenses.map((expense) => (
                    <div key={expense.id} className="expense-table-row" style={styles.tableRow}>
                      <div style={{...styles.tableCell, flex: 1.5}}>
                        <div style={styles.dateCell}>
                          <div style={styles.dateText}>
                            {formatDate(expense.tanggal || expense.date || expense.created_at)}
                          </div>
                          <div style={styles.timeText}>
                            {formatDateTime(expense.created_at).split(', ')[1] || '-'}
                          </div>
                        </div>
                      </div>
                      <div style={{...styles.tableCell, flex: 1.5}}>
                        <div style={styles.categoryInfo}>
                          <div style={styles.categoryName}>
                            {expense.nama || expense.kategori || expense.category || '-'}
                          </div>
                          {expense.jenis && (
                            <span style={{
                              ...styles.jenisBadge,
                              backgroundColor: getJenisColor(expense.jenis) + '20',
                              color: getJenisColor(expense.jenis)
                            }}>
                              {getJenisDisplay(expense.jenis)}
                        </span>
                          )}
                        </div>
                      </div>
                      <div style={{...styles.tableCell, flex: 2}}>
                        <span style={styles.descriptionText}>
                          {expense.catatan || expense.deskripsi || expense.description || '-'}
                        </span>
                      </div>
                      <div style={{...styles.tableCell, flex: 1.5}}>
                        <span style={styles.amountText}>
                          {formatCurrency(expense.nominal || expense.jumlah || expense.amount || 0)}
                        </span>
                      </div>
                      <div style={{...styles.tableCell, flex: 0.8}}>
                        <div style={styles.actionIcons}>
                          <button 
                            className="expense-icon-button"
                            style={styles.iconButton}
                            onClick={() => handleViewDetail(expense)}
                            title="Lihat Detail"
                          >
                            <i className="ri-eye-line" style={{ fontSize: '16px', color: '#6B7280' }}></i>
                          </button>
                          <button 
                            className="expense-icon-button"
                            style={styles.iconButton}
                            onClick={() => handleEditExpense(expense)}
                            title="Edit"
                          >
                            <i className="ri-edit-line" style={{ fontSize: '16px', color: '#6B7280' }}></i>
                          </button>
                          <button 
                            className="expense-icon-button"
                            style={styles.iconButton}
                            onClick={() => handleDeleteExpense(expense)}
                            title="Hapus"
                          >
                            <i className="ri-delete-bin-line" style={{ fontSize: '16px', color: '#EF4444' }}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div style={styles.pagination}>
                  <div style={styles.paginationInfo}>
                    Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-
                    {Math.min(currentPage * itemsPerPage, pagination.total)} dari {pagination.total} pengeluaran
                  </div>
                  <div style={styles.paginationButtons}>
                    <button
                      className="expense-page-button"
                      style={{
                        ...styles.pageButton,
                        ...(currentPage === 1 ? styles.pageButtonDisabled : {})
                      }}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="ri-arrow-left-s-line" style={{ fontSize: '18px' }}></i>
                    </button>
                    
                    {[...Array(Math.min(pagination.total_pages, 5))].map((_, index) => {
                      let pageNumber;
                      if (pagination.total_pages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= pagination.total_pages - 2) {
                        pageNumber = pagination.total_pages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }

                      return (
                        <button
                          key={pageNumber}
                          className="expense-page-number"
                          style={{
                            ...styles.pageNumber,
                            ...(currentPage === pageNumber ? styles.pageNumberActive : {})
                          }}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      className="expense-page-button"
                      style={{
                        ...styles.pageButton,
                        ...(currentPage === pagination.total_pages ? styles.pageButtonDisabled : {})
                      }}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.total_pages}
                    >
                      <i className="ri-arrow-right-s-line" style={{ fontSize: '18px' }}></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Tambah Pengeluaran</h2>
              <button className="expense-modal-close" style={styles.modalCloseButton} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Kategori/Nama *</label>
                <input
                  type="text"
                  className="expense-form-input"
                  value={formData.kategori}
                  onChange={(e) => {
                    setFormData({...formData, kategori: e.target.value});
                    if (formErrors.kategori) {
                      setFormErrors({...formErrors, kategori: ''});
                    }
                  }}
                  placeholder="Contoh: Listrik, Gaji, dll"
                  style={{
                    ...styles.formInput,
                    ...(formErrors.kategori ? styles.formInputError : {})
                  }}
                />
                {formErrors.kategori && (
                  <div style={styles.formErrorText}>{formErrors.kategori}</div>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Jenis Pengeluaran *</label>
                <select
                  className="expense-form-input"
                  value={formData.jenis}
                  onChange={(e) => {
                    setFormData({...formData, jenis: e.target.value});
                    if (formErrors.jenis) {
                      setFormErrors({...formErrors, jenis: ''});
                    }
                  }}
                  style={{
                    ...styles.formInput,
                    ...(formErrors.jenis ? styles.formInputError : {})
                  }}
                >
                  <option value="oprasional">Operasional</option>
                  <option value="investasi">Investasi</option>
                  <option value="lainnya">Lainnya</option>
                </select>
                {formErrors.jenis && (
                  <div style={styles.formErrorText}>{formErrors.jenis}</div>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Deskripsi *</label>
                <textarea
                  className="expense-form-input"
                  value={formData.deskripsi}
                  onChange={(e) => {
                    setFormData({...formData, deskripsi: e.target.value});
                    if (formErrors.deskripsi) {
                      setFormErrors({...formErrors, deskripsi: ''});
                    }
                  }}
                  placeholder="Deskripsi pengeluaran"
                  rows={3}
                  style={{
                    ...styles.formTextarea,
                    ...(formErrors.deskripsi ? styles.formInputError : {})
                  }}
                />
                {formErrors.deskripsi && (
                  <div style={styles.formErrorText}>{formErrors.deskripsi}</div>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Jumlah (Rp) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    fontSize: '14px'
                  }}>Rp</span>
                <input
                    type="text"
                    className="expense-form-input"
                    value={formData.jumlah ? parseFloat(formData.jumlah).toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      setFormData({...formData, jumlah: formatted});
                      if (formErrors.jumlah) {
                        setFormErrors({...formErrors, jumlah: ''});
                      }
                    }}
                  placeholder="0"
                    style={{
                      ...styles.formInput,
                      paddingLeft: '40px',
                      ...(formErrors.jumlah ? styles.formInputError : {})
                    }}
                  />
                </div>
                {formErrors.jumlah && (
                  <div style={styles.formErrorText}>{formErrors.jumlah}</div>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tanggal *</label>
                <input
                  type="date"
                  className="expense-form-input"
                  value={formData.tanggal}
                  onChange={(e) => {
                    setFormData({...formData, tanggal: e.target.value});
                    if (formErrors.tanggal) {
                      setFormErrors({...formErrors, tanggal: ''});
                    }
                  }}
                  style={{
                    ...styles.formInput,
                    ...(formErrors.tanggal ? styles.formInputError : {})
                  }}
                />
                {formErrors.tanggal && (
                  <div style={styles.formErrorText}>{formErrors.tanggal}</div>
                )}
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                className="expense-modal-cancel-button"
                style={styles.modalCancelButton} 
                onClick={() => {
                  setShowAddModal(false);
                  setFormErrors({});
                }}
                disabled={isSaving}
              >
                Batal
              </button>
              <button 
                className="expense-modal-save-button"
                style={{
                  ...styles.modalSaveButton,
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }} 
                onClick={() => handleSaveExpense(false)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Pengeluaran</h2>
              <button style={styles.modalCloseButton} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Kategori/Nama *</label>
                <input
                  type="text"
                  className="expense-form-input"
                  value={formData.kategori}
                  onChange={(e) => {
                    setFormData({...formData, kategori: e.target.value});
                    if (formErrors.kategori) {
                      setFormErrors({...formErrors, kategori: ''});
                    }
                  }}
                  placeholder="Contoh: Listrik, Gaji, dll"
                  style={{
                    ...styles.formInput,
                    ...(formErrors.kategori ? styles.formInputError : {})
                  }}
                />
                {formErrors.kategori && (
                  <div style={styles.formErrorText}>{formErrors.kategori}</div>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Jenis Pengeluaran *</label>
                <select
                  className="expense-form-input"
                  value={formData.jenis}
                  onChange={(e) => {
                    setFormData({...formData, jenis: e.target.value});
                    if (formErrors.jenis) {
                      setFormErrors({...formErrors, jenis: ''});
                    }
                  }}
                  style={{
                    ...styles.formInput,
                    ...(formErrors.jenis ? styles.formInputError : {})
                  }}
                >
                  <option value="oprasional">Operasional</option>
                  <option value="investasi">Investasi</option>
                  <option value="lainnya">Lainnya</option>
                </select>
                {formErrors.jenis && (
                  <div style={styles.formErrorText}>{formErrors.jenis}</div>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Deskripsi *</label>
                <textarea
                  className="expense-form-input"
                  value={formData.deskripsi}
                  onChange={(e) => {
                    setFormData({...formData, deskripsi: e.target.value});
                    if (formErrors.deskripsi) {
                      setFormErrors({...formErrors, deskripsi: ''});
                    }
                  }}
                  placeholder="Deskripsi pengeluaran"
                  rows={3}
                  style={{
                    ...styles.formTextarea,
                    ...(formErrors.deskripsi ? styles.formInputError : {})
                  }}
                />
                {formErrors.deskripsi && (
                  <div style={styles.formErrorText}>{formErrors.deskripsi}</div>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Jumlah (Rp) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    fontSize: '14px'
                  }}>Rp</span>
                <input
                    type="text"
                    className="expense-form-input"
                    value={formData.jumlah ? parseFloat(formData.jumlah).toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      setFormData({...formData, jumlah: formatted});
                      if (formErrors.jumlah) {
                        setFormErrors({...formErrors, jumlah: ''});
                      }
                    }}
                  placeholder="0"
                    style={{
                      ...styles.formInput,
                      paddingLeft: '40px',
                      ...(formErrors.jumlah ? styles.formInputError : {})
                    }}
                  />
                </div>
                {formErrors.jumlah && (
                  <div style={styles.formErrorText}>{formErrors.jumlah}</div>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tanggal *</label>
                <input
                  type="date"
                  className="expense-form-input"
                  value={formData.tanggal}
                  onChange={(e) => {
                    setFormData({...formData, tanggal: e.target.value});
                    if (formErrors.tanggal) {
                      setFormErrors({...formErrors, tanggal: ''});
                    }
                  }}
                  style={{
                    ...styles.formInput,
                    ...(formErrors.tanggal ? styles.formInputError : {})
                  }}
                />
                {formErrors.tanggal && (
                  <div style={styles.formErrorText}>{formErrors.tanggal}</div>
                )}
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.modalCancelButton} 
                onClick={() => {
                  setShowEditModal(false);
                  setFormErrors({});
                }}
                disabled={isSaving}
              >
                Batal
              </button>
              <button 
                style={{
                  ...styles.modalSaveButton,
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }} 
                onClick={() => handleSaveExpense(true)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Mengupdate...</span>
                  </>
                ) : (
                  'Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedExpense && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Detail Pengeluaran</h2>
              <button style={styles.modalCloseButton} onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Tanggal</div>
                <div style={styles.detailValue}>
                  {formatDate(selectedExpense.tanggal || selectedExpense.date || selectedExpense.created_at)}
                </div>
              </div>
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Kategori</div>
                <div style={styles.detailValue}>
                  {selectedExpense.nama || selectedExpense.kategori || selectedExpense.category || '-'}
                </div>
              </div>
              {selectedExpense.jenis && (
                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Jenis</div>
                  <div style={styles.detailValue}>
                    <span style={{
                      ...styles.jenisBadge,
                      backgroundColor: getJenisColor(selectedExpense.jenis) + '20',
                      color: getJenisColor(selectedExpense.jenis)
                    }}>
                      {getJenisDisplay(selectedExpense.jenis)}
                    </span>
                  </div>
                </div>
              )}
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Deskripsi</div>
                <div style={styles.detailValue}>
                  {selectedExpense.catatan || selectedExpense.deskripsi || selectedExpense.description || '-'}
                </div>
              </div>
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Jumlah</div>
                <div style={styles.detailValue}>
                  {formatCurrency(selectedExpense.nominal || selectedExpense.jumlah || selectedExpense.amount || 0)}
                </div>
              </div>
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Dibuat</div>
                <div style={styles.detailValue}>
                  {formatDateTime(selectedExpense.created_at)}
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.modalCancelButton} onClick={() => setShowDetailModal(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div style={styles.modalOverlay} onClick={() => setShowFilterModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Filter</h2>
              <button style={styles.modalCloseButton} onClick={() => setShowFilterModal(false)}>×</button>
    </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Jenis Pengeluaran</label>
                <select
                  value={selectedJenisFilter}
                  onChange={(e) => setSelectedJenisFilter(e.target.value)}
                  style={styles.formInput}
                >
                  {jenisFilters.map((jenis) => (
                    <option key={jenis} value={jenis}>{jenis}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tanggal Akhir</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={styles.formInput}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.modalCancelButton} 
                onClick={() => {
                  setSelectedJenisFilter('Semua');
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
              >
                Reset
              </button>
              <button 
                style={styles.modalSaveButton} 
                onClick={() => {
                  setShowFilterModal(false);
                  setCurrentPage(1);
                }}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#F8F9FA",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingTop: "0px",
    marginBottom: "40px",
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    backgroundColor: 'white',
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1F2937',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: '#059669',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
  },
  statsContainer: {
    marginBottom: '24px'
  },
  mainStatCard: {
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '12px'
  },
  mainStatContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  mainStatLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '4px'
  },
  mainStatValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '4px'
  },
  mainStatSubtext: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  mainStatIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  jenisStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  jenisStatCard: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid',
    backgroundColor: 'white'
  },
  jenisStatLabel: {
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '6px'
  },
  jenisStatValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1F2937'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '24px'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  statIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statInfo: {
    flex: 1
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '13px',
    color: '#6B7280'
  },
  actionsBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  searchWrapper: {
    position: 'relative' as const,
    flex: 1,
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '12px',
    color: '#9CA3AF',
    pointerEvents: 'none' as const
  },
  searchInput: {
    width: '100%',
    height: '44px',
    padding: '0 40px 0 44px',
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  clearSearchButton: {
    position: 'absolute' as const,
    right: '12px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    border: 'none',
    borderRadius: '50%',
    color: '#6B7280',
    fontSize: '18px',
    lineHeight: '1',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  actionButtons: {
    display: 'flex',
    gap: '12px'
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 16px',
    height: '44px',
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#6B7280',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 16px',
    height: '44px',
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#6B7280',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  filterChips: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap' as const
  },
  filterChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: '#F3F4F6',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#374151'
  },
  filterChipClose: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#D1D5DB',
    color: '#6B7280',
    fontSize: '14px',
    lineHeight: '1',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  },
  tableSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #E5E7EB',
    minHeight: '400px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '16px'
  },
  loadingText: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '16px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0
  },
  tableContainer: {
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '20px'
  },
  tableHeader: {
    display: 'flex',
    backgroundColor: '#F9FAFB',
    padding: '12px 16px',
    borderBottom: '1px solid #E5E7EB'
  },
  tableHeaderCell: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase'
  },
  tableBody: {
    backgroundColor: 'white'
  },
  tableRow: {
    display: 'flex',
    padding: '16px',
    borderBottom: '1px solid #E5E7EB',
    alignItems: 'center',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  tableCell: {
    fontSize: '14px',
    color: '#1F2937',
    display: 'flex',
    alignItems: 'center'
  },
  dateCell: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  dateText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1F2937'
  },
  timeText: {
    fontSize: '12px',
    color: '#9CA3AF'
  },
  categoryInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },
  categoryName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1F2937'
  },
  categoryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#DBEAFE',
    color: '#1E40AF'
  },
  jenisBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    width: 'fit-content'
  },
  descriptionText: {
    fontSize: '14px',
    color: '#1F2937'
  },
  amountText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#EF4444'
  },
  actionIcons: {
    display: 'flex',
    gap: '6px'
  },
  iconButton: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#6B7280'
  },
  paginationButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  pageButton: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#6B7280'
  },
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  pageNumber: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280'
  },
  pageNumberActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    color: 'white'
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #E5E7EB'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1F2937',
    margin: 0
  },
  modalCloseButton: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '20px',
    color: '#6B7280'
  },
  modalBody: {
    padding: '20px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const
  },
  formInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
  },
  formErrorText: {
    fontSize: '12px',
    color: '#EF4444',
    marginTop: '4px'
  },
  formTextarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px',
    borderTop: '1px solid #E5E7EB'
  },
  modalCancelButton: {
    padding: '10px 20px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#6B7280',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  modalSaveButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#059669',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #F3F4F6'
  },
  detailLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280'
  },
  detailValue: {
    fontSize: '14px',
    color: '#1F2937',
    textAlign: 'right' as const
  }
};

export default DataPengeluaran;
