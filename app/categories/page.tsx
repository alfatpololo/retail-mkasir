'use client';

import { FormEvent, useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';

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
  const [categoryProductsPage, setCategoryProductsPage] = useState(1);
  const [categoryProductsTotalPages, setCategoryProductsTotalPages] = useState(1);
  const [categoryProductsTotalItems, setCategoryProductsTotalItems] = useState(0);
  const [categoryProductsLoading, setCategoryProductsLoading] = useState(false);
  const [categoryProductsError, setCategoryProductsError] = useState<string | null>(null);

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan kategori produk';
      setError(message);
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

  const handleDelete = async (id: number) => {
    try {
      if (!confirm('Yakin ingin menghapus kategori ini?')) return;

      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const response = await fetch(`${API_BASE_URL}/master/product-categories/${id}`, {
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus kategori produk';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Categories</h1>
            <p className="text-gray-600">Manage your product categories</p>
          </div>
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
            className="px-5 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <span className="ri-add-line w-5 h-5 flex items-center justify-center"></span>
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {loading && (
            <div className="col-span-3 text-center text-gray-500 py-10">
              Memuat kategori produk...
            </div>
          )}

          {!loading && error && (
            <div className="col-span-3 text-center text-red-500 py-10">
              {error}
            </div>
          )}

          {!loading && !error && categories.length === 0 && (
            <div className="col-span-3 text-center text-gray-500 py-10">
              Tidak ada kategori produk.
            </div>
          )}

          {!loading && !error && categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleOpenDetail(category)}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <span
                    className="ri-price-tag-3-line w-6 h-6 flex items-center justify-center"
                    style={{ color: category.color }}
                  ></span>
                </div>
                <div className="flex gap-1 ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(category);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <span className="ri-edit-line w-4 h-4 flex items-center justify-center text-gray-600"></span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(category.id);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 cursor-pointer"
                  >
                    <span className="ri-delete-bin-line w-4 h-4 flex items-center justify-center text-red-500"></span>
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center justify-between gap-2">
                <span>{category.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    category.status === 1
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {category.status === 1 ? 'Aktif' : 'Nonaktif'}
                </span>
              </h3>
              {category.deskripsi && (
                <p className="text-sm text-gray-500 mb-1 line-clamp-2">{category.deskripsi}</p>
              )}
              <p className="text-xs text-gray-400">
                Urutan: {category.urutan} • {category.productCount} products
              </p>
            </div>
          ))}
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
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages || loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              Berikutnya
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
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Menyimpan...' : editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedCategory.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Produk: {selectedCategory.productCount}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <span className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
              </button>
            </div>

            {categoryProductsError && (
              <div className="px-5 py-3 text-sm text-red-600 border-b border-gray-200">
                {categoryProductsError}
              </div>
            )}

            {categoryProductsLoading && categoryProducts.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-500">Memuat produk...</p>
              </div>
            )}

            {!categoryProductsLoading && !categoryProductsError && categoryProducts.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-500">Produk tidak ditemukan.</p>
              </div>
            )}

            {!categoryProductsLoading && categoryProducts.length > 0 && (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 border border-gray-200 rounded-xl p-3"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="ri-image-2-line text-gray-400"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <div className="ml-2 text-sm font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(product.price)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Halaman {categoryProductsPage} dari {categoryProductsTotalPages} (
                    {categoryProductsTotalItems} produk)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeDetailPage(categoryProductsPage - 1)
                      }
                      disabled={
                        categoryProductsPage === 1 || categoryProductsLoading
                      }
                      className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                    >
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
                      className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
