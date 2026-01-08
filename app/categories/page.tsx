'use client';

import { FormEvent, useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ToastNotification from '@/components/ToastNotification';
import { API_BASE_URL } from '@/utils/api';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

interface ApiCategory {
  id: number;
  stall_id: number;
  nama: string;
  deskripsi: string;
  gambar: string | null;
  gambar_url?: string;
  urutan: number;
  status: number;
  product_count: number;
  created_at: string;
  updated_at: string;
}

interface ApiProductCategoriesResponse {
  success: boolean;
  message: string;
  data: {
    data: ApiCategory[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

const COLOR_PALETTE = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444', '#14B8A6'];

interface Category {
  id: number;
  name: string;
  deskripsi: string;
  urutan: number;
  status: number;
  color: string;
  productCount: number;
}

interface ApiProduct {
  id: number;
  nama: string;
  sku: string;
  harga: number;
  gambar_url?: string;
}

interface ApiProductsResponse {
  success: boolean;
  message: string;
  data: {
    data: ApiProduct[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface CategoryProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  image: string;
}

interface CategoryFormData {
  nama: string;
  deskripsi: string;
  urutan: number;
  status: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    nama: '',
    deskripsi: '',
    urutan: 1,
    status: 1,
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<CategoryProduct[]>([]);
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)
  const [categoryProductsPage, setCategoryProductsPage] = useState(1);
  const [categoryProductsTotalPages, setCategoryProductsTotalPages] = useState(1);
  const [categoryProductsTotalItems, setCategoryProductsTotalItems] = useState(0);
  const [categoryProductsLoading, setCategoryProductsLoading] = useState(false);
  const [categoryProductsError, setCategoryProductsError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const fetchCategories = async (currentPage: number) => {
    try {
      setLoading(true);
      setError(null);

      // Ambil JWT PIN dari localStorage (diset saat login PIN)
      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const response = await fetch(
        `${API_BASE_URL}/master/product-categories?page=${currentPage}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtPin}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const json: ApiProductCategoriesResponse = await response.json();

      const mappedCategories: Category[] = json.data.data.map((item) => {
        const color = COLOR_PALETTE[item.id % COLOR_PALETTE.length];
        return {
          id: item.id,
          name: item.nama,
          deskripsi: item.deskripsi,
          urutan: item.urutan,
          status: item.status,
          color,
          productCount: item.product_count,
        };
      });

      setCategories(mappedCategories);
      setPage(json.data.page);
      setTotalPages(json.data.total_pages);
      setTotalItems(json.data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat kategori produk';
      setError(message);
      setNotificationMessage(message);
      setNotificationType('error');
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const payload = {
        nama: formData.nama,
        deskripsi: formData.deskripsi,
        urutan: Number(formData.urutan) || 0,
        status: Number(formData.status) || 0,
      };

      const url = editingCategory
        ? `${API_BASE_URL}/master/product-categories/${editingCategory.id}`
        : `${API_BASE_URL}/master/product-categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtPin}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      await fetchCategories(page);
      setShowModal(false);
      setEditingCategory(null);
      setFormData({
        nama: '',
        deskripsi: '',
        urutan: 1,
        status: 1,
      });
      setNotificationMessage(editingCategory ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan');
      setNotificationType('success');
      setShowNotification(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan kategori produk';
      setError(message);
      setNotificationMessage(message);
      setNotificationType('error');
      setShowNotification(true);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      nama: category.name,
      deskripsi: category.deskripsi,
      urutan: category.urutan,
      status: category.status,
    });
    setShowModal(true);
  };

  const fetchCategoryProducts = async (category: Category, currentPage: number) => {
    try {
      setCategoryProductsLoading(true);
      setCategoryProductsError(null);

      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        setCategoryProductsError(
          'JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.'
        );
        setCategoryProductsLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/master/products?page=${currentPage}&limit=20&category_id=${category.id}&tampil=1`,
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

      const json: ApiProductsResponse = await response.json();

      const mapped: CategoryProduct[] = json.data.data.map((item) => ({
        id: item.id,
        name: item.nama,
        sku: item.sku,
        price: item.harga,
        image: item.gambar_url || '',
      }));

      setCategoryProducts(mapped);
      setCategoryProductsPage(json.data.page);
      setCategoryProductsTotalPages(json.data.total_pages);
      setCategoryProductsTotalItems(json.data.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal memuat produk kategori';
      setCategoryProductsError(message);
    } finally {
      setCategoryProductsLoading(false);
    }
  };

  const handleOpenDetail = (category: Category) => {
    setSelectedCategory(category);
    setShowDetailModal(true);
    setCategoryProducts([]);
    setCategoryProductsPage(1);
    setCategoryProductsTotalPages(1);
    setCategoryProductsTotalItems(0);
    fetchCategoryProducts(category, 1);
  };

  const handleChangeDetailPage = (nextPage: number) => {
    if (!selectedCategory) return;
    if (nextPage < 1 || nextPage > categoryProductsTotalPages) return;
    fetchCategoryProducts(selectedCategory, nextPage);
  };

  const handleDeleteClick = (id: number) => {
    setCategoryToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const response = await fetch(`${API_BASE_URL}/master/product-categories/${categoryToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtPin}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      await fetchCategories(page);
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      setNotificationMessage('Kategori berhasil dihapus');
      setNotificationType('success');
      setShowNotification(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus kategori produk';
      setNotificationMessage(message);
      setNotificationType('error');
      setShowNotification(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
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
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200">
              <i className="ri-price-tag-3-line text-emerald-600 text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-1 sm:mb-2">Kategori Produk</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Kelola kategori produk Anda</p>
            </div>
          </div>
          {hasPermission(PERMISSIONS.CATEGORY_CREATE) && (
            <button
              onClick={() => {
                setEditingCategory(null);
                setFormData({
                  nama: '',
                  deskripsi: '',
                  urutan: 1,
                  status: 1,
                });
                setShowModal(true);
              }}
              className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px]"
            >
              <i className="ri-add-line text-base sm:text-lg"></i>
              Tambah Kategori
            </button>
          )}
          </div>

          <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden">
            {loading && (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-2 text-emerald-600">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  Memuat kategori produk...
                </div>
              </div>
            )}

            {!loading && error && (
              <div className="text-center py-16">
                <div className="inline-flex flex-col items-center gap-2 text-red-500">
                  <i className="ri-error-warning-line text-4xl"></i>
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && categories.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex flex-col items-center gap-3">
                  <i className="ri-price-tag-3-line text-5xl text-gray-300"></i>
                  <p className="text-gray-500 font-medium">Tidak ada kategori produk</p>
                </div>
              </div>
            )}

            {!loading && !error && categories.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-emerald-200 bg-emerald-50/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                        Nama Kategori
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                        Deskripsi
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                        Urutan
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                        Produk
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        onClick={() => handleOpenDetail(category)}
                        className="hover:bg-emerald-50/30 transition-colors duration-150 cursor-pointer group"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <i className="ri-price-tag-3-line text-lg text-emerald-600"></i>
                            </div>
                            <span className="text-sm font-medium text-gray-900 group-hover:text-emerald-700">
                              {category.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600 line-clamp-1 max-w-md">
                            {category.deskripsi || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-gray-600">{category.urutan}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-medium text-emerald-700">{category.productCount}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                              category.status === 1
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {category.status === 1 ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {hasPermission(PERMISSIONS.CATEGORY_UPDATE) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(category);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 transition-colors duration-150"
                                title="Edit"
                              >
                                <i className="ri-edit-line text-sm"></i>
                              </button>
                            )}
                            {hasPermission(PERMISSIONS.CATEGORY_DELETE) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(category.id);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors duration-150"
                                title="Hapus"
                              >
                                <i className="ri-delete-bin-line text-sm"></i>
                              </button>
                            )}
                            {!hasPermission(PERMISSIONS.CATEGORY_UPDATE) && !hasPermission(PERMISSIONS.CATEGORY_DELETE) && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Menampilkan halaman {page} dari {totalPages} ({totalItems} kategori)
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
              className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium active:bg-emerald-700 sm:hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
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
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Kategori</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama kategori"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Masukkan deskripsi kategori (opsional)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urutan</label>
                  <input
                    type="number"
                    value={formData.urutan}
                    onChange={(e) =>
                      setFormData({ ...formData, urutan: Number(e.target.value) || 0 })
                    }
                    min={0}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: Number(e.target.value) as 0 | 1 })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value={1}>Aktif</option>
                    <option value={0}>Nonaktif</option>
                  </select>
                </div>
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
                  disabled={saving}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium active:bg-emerald-700 sm:hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                >
                  {saving ? 'Menyimpan...' : editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4 animate-fade-in" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-slide-up overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header - Sticky */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 bg-emerald-50 border-b border-emerald-200 flex-shrink-0">
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    <i className="ri-price-tag-3-line text-2xl sm:text-3xl text-emerald-600"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-2xl font-semibold text-gray-800 mb-1 truncate">
                      {selectedCategory.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <p className="text-xs sm:text-sm text-emerald-700 flex items-center gap-1.5">
                        <i className="ri-box-3-line"></i>
                        {selectedCategory.productCount} produk
                      </p>
                      {selectedCategory.deskripsi && (
                        <span className="text-xs text-gray-500 line-clamp-1 hidden sm:inline">
                          {selectedCategory.deskripsi}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all cursor-pointer active:scale-95 flex-shrink-0"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            {categoryProductsError && (
              <div className="px-6 py-4 text-sm text-red-600 border-b border-red-100 bg-red-50 flex items-center gap-2">
                <i className="ri-error-warning-line text-lg"></i>
                {categoryProductsError}
              </div>
            )}

            {categoryProductsLoading && categoryProducts.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-gray-500">Memuat produk...</p>
                </div>
              </div>
            )}

            {!categoryProductsLoading && !categoryProductsError && categoryProducts.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="text-center">
                  <i className="ri-inbox-line text-5xl text-gray-300 mb-3"></i>
                  <p className="text-sm font-medium text-gray-500">Produk tidak ditemukan</p>
                  <p className="text-xs text-gray-400 mt-1">Kategori ini belum memiliki produk</p>
                </div>
              </div>
            )}

            {!categoryProductsLoading && categoryProducts.length > 0 && (
              <>
                <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white scrollbar-hide">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md hover:border-gray-300 transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden mb-3">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="ri-image-2-line text-4xl text-gray-400"></span>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-gray-900 transition-colors min-h-[2.5rem]">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded mb-3 w-fit">
                            {product.sku}
                          </p>
                          <div className="mt-auto">
                            <p className="text-base font-semibold text-gray-800">
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-white rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-gray-600 text-center sm:text-left">
                    Halaman <span className="font-semibold text-gray-900">{categoryProductsPage}</span> dari{' '}
                    <span className="font-semibold text-gray-900">{categoryProductsTotalPages}</span> (
                    <span className="font-semibold text-gray-900">{categoryProductsTotalItems}</span> produk)
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeDetailPage(categoryProductsPage - 1)
                      }
                      disabled={
                        categoryProductsPage === 1 || categoryProductsLoading
                      }
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-50 sm:hover:bg-gray-50 cursor-pointer text-sm font-medium text-gray-700 transition-all min-h-[44px] touch-manipulation"
                    >
                      <i className="ri-arrow-left-line mr-1"></i>
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeDetailPage(categoryProductsPage + 1)
                      }
                      disabled={
                        categoryProductsPage === categoryProductsTotalPages ||
                        categoryProductsLoading
                      }
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed active:bg-emerald-700 sm:hover:bg-emerald-700 cursor-pointer text-sm font-medium transition-all min-h-[44px] touch-manipulation"
                    >
                      Berikutnya
                      <i className="ri-arrow-right-line ml-1"></i>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-error-warning-line text-2xl text-red-600"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Konfirmasi Hapus</h3>
                  <p className="text-sm text-gray-500 mt-1">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Yakin ingin menghapus kategori ini?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setCategoryToDelete(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium active:bg-gray-200 sm:hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap min-h-[44px] touch-manipulation"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium active:bg-red-700 sm:hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap min-h-[44px] touch-manipulation"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <ToastNotification
        show={showNotification}
        message={notificationMessage}
        type={notificationType}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
}
