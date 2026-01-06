'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL, getUserStall, createEmployee, updateEmployee, deleteEmployee, Employee, UserStallResponse } from '@/utils/api';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    notelp: '',
    level: 'kasir' as 'kasir' | 'supervisor' | 'admin',
    pin: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper untuk mendapatkan JWT PIN
  const getJwtPin = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jwt_pin');
    }
    return null;
  };

  // Helper untuk notifikasi
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    try {
      const { useMainStore } = require('@/utils/stores');
      const { setNotificationError, setNotificationSuccess } = useMainStore.getState();
      if (type === 'success' && setNotificationSuccess) {
        setNotificationSuccess(message);
      } else if (type === 'error' && setNotificationError) {
        setNotificationError(message);
      } else {
        alert(message);
      }
    } catch {
      alert(message);
    }
  };

  // Format tanggal
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
  };

  // Load employees
  const loadEmployees = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const jwtPin = getJwtPin();
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const response: UserStallResponse = await getUserStall(jwtPin);
      setEmployees(response.data.users);
      setFilteredEmployees(response.data.users);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memuat data karyawan');
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter employees berdasarkan search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = employees.filter((emp) => {
        return (
          emp.nama.toLowerCase().includes(query) ||
          emp.kode.toLowerCase().includes(query) ||
          emp.notelp.includes(query) ||
          emp.level.toLowerCase().includes(query)
        );
      });
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees]);

  // Load on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  // Stats
  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status).length,
    admin: employees.filter((e) => e.level.toLowerCase() === 'admin').length,
    kasir: employees.filter((e) => e.level.toLowerCase() === 'kasir').length,
  };

  // Handle add employee
  const handleAddEmployee = () => {
    setFormData({
      nama: '',
      notelp: '',
      level: 'kasir',
      pin: '',
    });
    setShowAddModal(true);
  };

  // Handle edit employee
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      nama: employee.nama,
      notelp: employee.notelp,
      level: employee.level as 'kasir' | 'supervisor' | 'admin',
      pin: '',
    });
    setShowEditModal(true);
  };

  // Handle detail employee
  const handleDetailEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  // Handle save employee
  const handleSaveEmployee = async (isEdit: boolean) => {
    try {
      setIsSubmitting(true);
      const jwtPin = getJwtPin();
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      // Validasi
      if (!formData.nama.trim()) {
        throw new Error('Nama lengkap harus diisi');
      }
      if (!formData.notelp.trim()) {
        throw new Error('Nomor telepon harus diisi');
      }
      if (formData.pin && formData.pin.length > 0 && formData.pin.length !== 6) {
        throw new Error('PIN harus 6 digit');
      }

      if (isEdit && selectedEmployee) {
        const isAdmin = selectedEmployee.level.toLowerCase() === 'admin';
        // Admin tidak bisa diubah level dan nomor teleponnya
        const finalLevel = isAdmin ? selectedEmployee.level : formData.level;
        const finalNotelp = isAdmin ? selectedEmployee.notelp : formData.notelp;

        await updateEmployee(
          selectedEmployee.id,
          {
            nama: formData.nama.trim(),
            notelp: finalNotelp,
            level: finalLevel,
            pin: formData.pin.trim() || undefined,
          },
          jwtPin
        );

        showNotification('Data karyawan berhasil diperbarui', 'success');
      } else {
        await createEmployee(
          {
            nama: formData.nama.trim(),
            notelp: formData.notelp.trim(),
            level: formData.level,
            pin: formData.pin.trim() || undefined,
          },
          jwtPin
        );

        showNotification('Karyawan berhasil ditambahkan', 'success');
      }

      // Refresh data setelah operasi berhasil (sebelum tutup modal)
      await loadEmployees();
      
      // Tutup modal dan reset form setelah data di-refresh
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedEmployee(null);
      setFormData({
        nama: '',
        notelp: '',
        level: 'kasir',
        pin: '',
      });
    } catch (err: any) {
      showNotification(err?.message || 'Gagal menyimpan data karyawan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async (employee: Employee) => {
    if (employee.level.toLowerCase() === 'admin') {
      showNotification('Admin tidak bisa dihapus', 'error');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${employee.nama}?`)) {
      return;
    }

    try {
      const jwtPin = getJwtPin();
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      await deleteEmployee(employee.id, jwtPin);
      showNotification('Karyawan berhasil dihapus', 'success');
      await loadEmployees();
    } catch (err: any) {
      showNotification(err?.message || 'Gagal menghapus karyawan', 'error');
    }
  };

  // Get level icon
  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'admin':
        return 'ri-admin-line';
      case 'kasir':
        return 'ri-shopping-cart-line';
      case 'supervisor':
        return 'ri-user-star-line';
      default:
        return 'ri-user-line';
    }
  };

  // Get level display name
  const getLevelDisplay = (level: string) => {
    switch (level.toLowerCase()) {
      case 'admin':
        return 'Admin';
      case 'kasir':
        return 'Kasir';
      case 'supervisor':
        return 'Supervisor';
      default:
        return level;
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter((p) => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const isEditAdmin = Boolean(selectedEmployee && selectedEmployee.level.toLowerCase() === 'admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pl-0 lg:pl-64 pb-10">
      <Sidebar />

      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
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
            <button
              onClick={handleAddEmployee}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
            >
              <i className="ri-add-line"></i>
              <span className="hidden sm:inline">Tambah Karyawan</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Cari karyawan berdasarkan nama, kode, telepon, atau level..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <i className="ri-group-line text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-green-600 text-xl"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-gray-600">Aktif</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <i className="ri-admin-line text-purple-600 text-xl"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.admin}</p>
                <p className="text-xs text-gray-600">Admin</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <i className="ri-shopping-cart-line text-orange-600 text-xl"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.kasir}</p>
                <p className="text-xs text-gray-600">Kasir</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 px-6 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-gray-500">Memuat data karyawan...</p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 px-6 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <i className="ri-error-warning-line text-5xl text-red-300"></i>
              <p className="text-sm font-medium text-gray-500">{errorMessage}</p>
              <button
                onClick={loadEmployees}
                className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                <i className="ri-refresh-line mr-2"></i>
                Coba Lagi
              </button>
            </div>
          </div>
        ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 px-6 py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <i className="ri-user-settings-line text-5xl text-gray-300"></i>
              <p className="text-sm font-medium text-gray-500">
                {searchQuery ? 'Tidak ada karyawan yang ditemukan' : 'Belum ada karyawan'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleAddEmployee}
                  className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  <i className="ri-add-line mr-2"></i>
                  Tambah Karyawan
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEmployees.map((employee, index) => (
              <div
                key={employee.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleDetailEmployee(employee)}
                style={{
                  animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-semibold text-gray-700">
                      {getInitials(employee.nama)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{employee.nama}</h3>
                      {employee.status && (
                        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">
                        <i className={getLevelIcon(employee.level)}></i>
                        {getLevelDisplay(employee.level)}
                      </span>
                      <span className="text-xs text-gray-500">{employee.kode}</span>
                      <span className="text-xs text-gray-500">
                        <i className="ri-phone-line mr-1"></i>
                        {employee.notelp}
                      </span>
                      {employee.last_login && (
                        <span className="text-xs text-gray-500">
                          <i className="ri-time-line mr-1"></i>
                          {formatDate(employee.last_login)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEmployee(employee);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <i className="ri-edit-line text-gray-600"></i>
                    </button>
                    {employee.level.toLowerCase() !== 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEmployee(employee);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <i className="ri-delete-bin-line text-red-500"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <i className="ri-user-add-line text-gray-700 text-xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Tambah Karyawan</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <i className="ri-close-line text-gray-600 text-xl"></i>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEmployee(false);
              }}
              className="p-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon *
                </label>
                <input
                  type="tel"
                  value={formData.notelp}
                  onChange={(e) => setFormData({ ...formData, notelp: e.target.value })}
                  placeholder="08xxx atau 628xxx"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Format: 08xxx atau 628xxx</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
                <div className="grid grid-cols-2 gap-3">
                  {['supervisor', 'kasir'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, level: level as any })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.level === level
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <i
                          className={`${getLevelIcon(level)} text-2xl ${
                            formData.level === level ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        ></i>
                        <span
                          className={`text-sm font-medium ${
                            formData.level === level ? 'text-emerald-600' : 'text-gray-700'
                          }`}
                        >
                          {getLevelDisplay(level)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN (6 digit)
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setFormData({ ...formData, pin: value });
                  }}
                  placeholder="Masukkan PIN (opsional)"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="mt-1 text-xs text-gray-500">PIN untuk login (opsional)</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    'Tambah'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEmployee && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <i className="ri-edit-line text-gray-700 text-xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Karyawan</h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <i className="ri-close-line text-gray-600 text-xl"></i>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEmployee(true);
              }}
              className="p-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon *
                </label>
                <input
                  type="tel"
                  value={formData.notelp}
                  onChange={(e) => setFormData({ ...formData, notelp: e.target.value })}
                  placeholder="08xxx atau 628xxx"
                  disabled={isEditAdmin}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
                {isEditAdmin && (
                  <p className="mt-1 text-xs text-amber-600">
                    Nomor telepon admin tidak bisa diubah
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
                <div className="grid grid-cols-3 gap-3">
                  {(isEditAdmin ? ['admin'] : ['supervisor', 'kasir']).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        if (!isEditAdmin) {
                          setFormData({ ...formData, level: level as any });
                        }
                      }}
                      disabled={isEditAdmin}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.level === level
                          ? 'border-emerald-500 bg-emerald-50'
                          : isEditAdmin
                          ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <i
                          className={`${getLevelIcon(level)} text-2xl ${
                            formData.level === level ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        ></i>
                        <span
                          className={`text-sm font-medium ${
                            formData.level === level ? 'text-emerald-600' : 'text-gray-700'
                          }`}
                        >
                          {getLevelDisplay(level)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {isEditAdmin && (
                  <p className="mt-1 text-xs text-amber-600">Level admin tidak bisa diubah</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN (6 digit)
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setFormData({ ...formData, pin: value });
                  }}
                  placeholder="Kosongkan jika tidak ingin mengubah PIN"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Kosongkan jika tidak ingin mengubah PIN
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Detail Karyawan</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 text-white"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              <p className="text-sm text-white/90">{selectedEmployee.kode}</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 mb-4">
                  <span className="text-3xl font-semibold text-gray-700">
                    {getInitials(selectedEmployee.nama)}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedEmployee.nama}</h4>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                  <i className={getLevelIcon(selectedEmployee.level)}></i>
                  {getLevelDisplay(selectedEmployee.level)}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-user-line text-gray-600"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Nama</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedEmployee.nama}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-barcode-line text-gray-600"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Kode</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedEmployee.kode}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-phone-line text-gray-600"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Nomor Telepon</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedEmployee.notelp}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-information-line text-gray-600"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <p
                      className={`text-sm font-semibold ${
                        selectedEmployee.status ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {selectedEmployee.status ? 'Aktif' : 'Tidak Aktif'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-calendar-line text-gray-600"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Dibuat</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDateTime(selectedEmployee.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-refresh-line text-gray-600"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Diperbarui</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDateTime(selectedEmployee.updated_at)}
                    </p>
                  </div>
                </div>

                {selectedEmployee.last_login && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <i className="ri-login-box-line text-gray-600"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Login Terakhir</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDateTime(selectedEmployee.last_login)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEditEmployee(selectedEmployee);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-edit-line"></i>
                  Edit
                </button>
                {selectedEmployee.level.toLowerCase() !== 'admin' && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleDeleteEmployee(selectedEmployee);
                    }}
                    className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="ri-delete-bin-line"></i>
                    Hapus
                  </button>
                )}
              </div>
          </div>
        </div>
      </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}