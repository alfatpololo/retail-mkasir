'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

interface ApiEmployee {
  id: number;
  nama: string;
  kode: string;
  notelp: string;
  level: string;
  status: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiEmployeesResponse {
  success: boolean;
  message: string;
  data: {
    data: ApiEmployee[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface Employee {
  id: string;
  name: string;
  code: string;
  phone: string;
  level: string;
  status: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    code: '',
    level: 'Kasir',
    pin: ''
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [currentUserLevel, setCurrentUserLevel] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Ambil level dan ID user yang sedang login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Coba ambil dari currentUser terlebih dahulu
      const currentUserStr = localStorage.getItem('currentUser');
      let level = null;
      let userId = null;
      
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          level = currentUser.level || null;
          userId = currentUser.id || currentUser.user_id;
        } catch (e) {
          console.error('Error parsing currentUser:', e);
        }
      }
      
      // Fallback: coba ambil dari pin_session jika level belum ditemukan
      if (!level) {
        const pinSessionStr = localStorage.getItem('pin_session');
        if (pinSessionStr) {
          try {
            const pinSession = JSON.parse(pinSessionStr);
            level = pinSession.level || null;
            if (!userId) {
              userId = pinSession.user_id || null;
            }
          } catch (e) {
            console.error('Error parsing pin_session:', e);
          }
        }
      }
      
      setCurrentUserLevel(level ? String(level).trim() : null);
      setCurrentUserId(userId ? String(userId) : null);
      console.log('Current user loaded:', { 
        level: level ? String(level).trim() : null, 
        userId: userId ? String(userId) : null,
        currentUserStr,
        pinSessionStr: localStorage.getItem('pin_session') ? 'exists' : 'not found'
      });
    }
  }, []);

  const fetchEmployees = async (currentPage: number, search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      let url = `${API_BASE_URL}/master/users?page=${currentPage}&limit=${limit}`;
      if (search && search.trim() !== '') {
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
        // Fallback ke user-stall jika /master/users tidak ada
        if (response.status === 404) {
          const fallbackResponse = await fetch(`${API_BASE_URL}/user-stall`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwtPin}`,
            },
          });

          if (!fallbackResponse.ok) {
            throw new Error('Gagal memuat data karyawan');
          }

          const fallbackData = await fallbackResponse.json();
          const mapped: Employee[] = (fallbackData.data?.users || []).map((item: any) => ({
            id: String(item.id),
            name: item.nama,
            code: item.kode || '-',
            phone: item.notelp || '-',
            level: item.level || 'Kasir',
            status: item.status ?? true,
            lastLogin: item.last_login,
            createdAt: item.created_at,
          }));

          setEmployees(mapped);
          setTotalItems(fallbackData.data?.total || mapped.length);
          setTotalPages(1);
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const json: ApiEmployeesResponse = await response.json();

      const mapped: Employee[] = json.data.data.map((item) => ({
        id: String(item.id),
        name: item.nama,
        code: item.kode || '-',
        phone: item.notelp || '-',
        level: item.level || 'Kasir',
        status: item.status ?? true,
        lastLogin: item.last_login,
        createdAt: item.created_at,
      }));

      setEmployees(mapped);
      setPage(json.data.page);
      setTotalPages(json.data.total_pages);
      setTotalItems(json.data.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal memuat data karyawan';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(page, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchEmployees(1, searchQuery);
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset sidebar state saat window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1536) {
        setSidebarCollapsed(true);
      }
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

      const url = editingEmployee
        ? `${API_BASE_URL}/master/users/${editingEmployee.id}`
        : `${API_BASE_URL}/master/users`;

      const response = await fetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
        body: JSON.stringify({
          nama: formData.name,
          notelp: formData.phone,
          kode: formData.code,
          level: formData.level,
          pin: formData.pin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // Reset form dan tutup modal
      setFormData({ name: '', phone: '', code: '', level: 'Kasir', pin: '' });
      setShowModal(false);
      setShowEditModal(false);
      setEditingEmployee(null);

      // Refresh data employees
      fetchEmployees(page, searchQuery);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal menyimpan data karyawan';
      alert(message);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      phone: employee.phone,
      code: employee.code,
      level: employee.level,
      pin: '', // Jangan tampilkan PIN yang sudah ada
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus karyawan ini?')) return;

    try {
      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan.');
      }

      const response = await fetch(`${API_BASE_URL}/master/users/${id}`, {
        method: 'DELETE',
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

      // Refresh data employees
      fetchEmployees(page, searchQuery);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal menghapus karyawan';
      alert(message);
    }
  };


  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative pb-10">
      {/* Static sidebar for desktop (2xl up) */}
      <div className="hidden 2xl:block fixed left-0 top-0 bottom-0 w-64 z-50">
        <Sidebar />
      </div>

      {/* Sidebar overlay for tablet */}
      {!sidebarCollapsed && (
        <div className="hidden md:block 2xl:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarCollapsed(true)}
          ></div>
          <div className="absolute left-0 top-0 bottom-0 w-[10.5rem] md:w-[13rem] lg:w-[15rem] xl:w-[17rem] bg-white shadow-xl z-50 overflow-y-auto">
            <Sidebar isOverlay={true} />
          </div>
        </div>
      )}

      {/* Show Sidebar Indicator for Tablet */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden md:block 2xl:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 w-12 h-20 bg-white rounded-r-full items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 group flex"
          aria-label="Show sidebar"
        >
          <div className="flex items-center -space-x-3">
            <i
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors"
              style={{
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0s',
              }}
            ></i>
            <i
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors"
              style={{
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0.3s',
              }}
            ></i>
          </div>
        </button>
      )}

      {/* Mobile Sidebar */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSidebar(false)}
          ></div>
          <div className="absolute left-0 top-0 bottom-0 w-[10.5rem] bg-white shadow-xl z-50 overflow-y-auto">
            <Sidebar isOverlay={true} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0 2xl:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <i className="ri-menu-line text-xl text-gray-700"></i>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Karyawan</h1>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
                <i className="ri-user-settings-line text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Karyawan
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Kelola data dan akses karyawan kasir Anda.
                </p>
              </div>
            </div>
            {currentUserLevel && currentUserLevel.toLowerCase().trim() === 'admin' && (
              <button
                onClick={() => {
                  setFormData({ name: '', phone: '', code: '', level: 'Kasir', pin: '' });
                  setEditingEmployee(null);
                  setShowModal(true);
                }}
                className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <i className="ri-add-line text-lg"></i>
                <span className="hidden sm:inline">Tambah Karyawan</span>
                <span className="sm:hidden">Tambah</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6">
          {/* Search & Filter */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 mb-4 md:mb-6">
            <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row gap-3 md:items-center">
              <div className="flex-1 relative">
                <span className="ri-search-line w-5 h-5 flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></span>
                <input
                  type="text"
                  placeholder="Cari nama, kode, atau nomor telepon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {currentUserLevel && currentUserLevel.toLowerCase().trim() === 'admin' && (
                <button
                  onClick={() => {
                    setFormData({ name: '', phone: '', code: '', level: 'Kasir', pin: '' });
                    setEditingEmployee(null);
                    setShowModal(true);
                  }}
                  className="md:hidden px-4 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <i className="ri-add-line text-lg"></i>
                  Tambah Karyawan
                </button>
              )}
            </div>

            {/* Statistics Cards */}
            {!loading && !error && employees.length > 0 && (
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {/* Total User */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-md">
                        <i className="ri-user-line text-white text-lg"></i>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Total User</div>
                    <div className="text-xl md:text-2xl font-bold text-blue-600">
                      {employees.length}
                    </div>
                  </div>

                  {/* Total Aktif */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md">
                        <i className="ri-checkbox-circle-fill text-white text-lg"></i>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Total Aktif</div>
                    <div className="text-xl md:text-2xl font-bold text-emerald-600">
                      {employees.filter(emp => emp.status).length}
                    </div>
                  </div>

                  {/* Jumlah Admin */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center shadow-md">
                        <i className="ri-admin-line text-white text-lg"></i>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Admin</div>
                    <div className="text-xl md:text-2xl font-bold text-purple-600">
                      {employees.filter(emp => emp.level.toLowerCase().trim() === 'admin').length}
                    </div>
                  </div>

                  {/* Jumlah Kasir */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shadow-md">
                        <i className="ri-user-3-line text-white text-lg"></i>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Kasir</div>
                    <div className="text-xl md:text-2xl font-bold text-amber-600">
                      {employees.filter(emp => emp.level.toLowerCase().trim() === 'kasir').length}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Employees List */}
            <div className="p-4 md:p-6">
              {loading && (
                <div className="text-center py-12">
                  <i className="ri-loader-4-line text-4xl text-emerald-500 animate-spin"></i>
                  <p className="mt-4 text-sm text-gray-600">Memuat data karyawan...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-12">
                  <i className="ri-error-warning-line text-4xl text-red-500"></i>
                  <p className="mt-4 text-sm text-red-600">{error}</p>
                  <button
                    onClick={() => fetchEmployees(page, searchQuery)}
                    className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}

              {!loading && !error && filteredEmployees.length === 0 && (
                <div className="text-center py-12">
                  <i className="ri-user-settings-line text-5xl text-gray-300"></i>
                  <p className="mt-4 text-sm font-medium text-gray-500">
                    {searchQuery ? 'Karyawan tidak ditemukan' : 'Belum ada data karyawan'}
                  </p>
                  {!searchQuery && currentUserLevel && currentUserLevel.toLowerCase().trim() === 'admin' && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                    >
                      Tambah Karyawan Pertama
                    </button>
                  )}
                </div>
              )}

              {!loading && !error && filteredEmployees.length > 0 && (
                <div className="space-y-3">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {employee.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {employee.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                employee.status
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {employee.status ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <i className="ri-hashtag text-gray-400"></i>
                              {employee.code}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-phone-line text-gray-400"></i>
                              {employee.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-shield-user-line text-gray-400"></i>
                              {employee.level}
                            </span>
                            {employee.lastLogin && (
                              <span className="flex items-center gap-1">
                                <i className="ri-time-line text-gray-400"></i>
                                Login: {new Date(employee.lastLogin).toLocaleDateString('id-ID')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {(() => {
                          const currentLevel = currentUserLevel ? currentUserLevel.toLowerCase().trim() : null;
                          const employeeLevel = employee.level ? employee.level.toLowerCase().trim() : null;
                          const isOwnProfile = employee.id === currentUserId;
                          
                          let canEdit = false;
                          
                          // Admin: bisa edit semua (termasuk dirinya sendiri)
                          if (currentLevel === 'admin') {
                            canEdit = true;
                          }
                          // Supervisor: bisa edit kasir dan dirinya sendiri, tidak bisa edit admin atau supervisor lain
                          else if (currentLevel === 'supervisor') {
                            canEdit = (employeeLevel === 'kasir') || isOwnProfile;
                          }
                          // Kasir: tidak ada akses edit
                          // (canEdit tetap false)
                          
                          if (canEdit) {
                            return (
                              <button
                                onClick={() => handleEdit(employee)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                                title="Edit"
                              >
                                <i className="ri-pencil-line"></i>
                              </button>
                            );
                          }
                          return null;
                        })()}
                        {(() => {
                          const currentLevel = currentUserLevel ? currentUserLevel.toLowerCase().trim() : null;
                          const employeeLevel = employee.level ? employee.level.toLowerCase().trim() : null;
                          const isOwnProfile = employee.id === currentUserId;
                          
                          let canDelete = false;
                          
                          // Admin: bisa hapus supervisor dan kasir, tidak bisa hapus admin (termasuk dirinya sendiri)
                          if (currentLevel === 'admin') {
                            canDelete = (employeeLevel === 'supervisor' || employeeLevel === 'kasir') && !isOwnProfile;
                          }
                          // Supervisor: bisa hapus kasir, tidak bisa hapus admin atau supervisor (termasuk dirinya sendiri)
                          else if (currentLevel === 'supervisor') {
                            canDelete = (employeeLevel === 'kasir') && !isOwnProfile;
                          }
                          // Kasir: tidak ada akses delete
                          // (canDelete tetap false)
                          
                          if (canDelete) {
                            return (
                              <button
                                onClick={() => handleDelete(employee.id)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                                title="Hapus"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && !error && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Menampilkan {employees.length} dari {totalItems} karyawan
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                    <span className="px-4 py-2 text-sm font-medium text-gray-700">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowEditModal(false);
                    setEditingEmployee(null);
                    setFormData({ name: '', phone: '', code: '', level: 'Kasir', pin: '' });
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode Karyawan
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Masukkan kode karyawan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level Akses <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Kasir">Kasir</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN {!editingEmployee && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingEmployee}
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={editingEmployee ? 'Kosongkan jika tidak ingin mengubah PIN' : 'Masukkan PIN (min. 4 digit)'}
                  minLength={editingEmployee ? 0 : 4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setShowEditModal(false);
                    setEditingEmployee(null);
                    setFormData({ name: '', phone: '', code: '', level: 'Kasir', pin: '' });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                >
                  {editingEmployee ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
