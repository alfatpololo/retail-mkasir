'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import EditProductModal from '@/components/EditProductModal';
import { API_BASE_URL } from '@/utils/api';

interface ApiProductCategory {
  id: number;
  nama: string;
}

interface ApiProduct {
  id: number;
  stall_id: number;
  product_category_id: number;
  product_sub_category_id?: number;
  sku: string;
  barcode: string;
  nama: string;
  deskripsi: string;
  satuan: string | null;
  gambar: string;
  gambar_url: string;
  harga: number;
  harga_modal: number;
  stok: number;
  stok_minimum: number;
  akses_custom: boolean;
  aktif: boolean;
  urutan: number;
  tipe_produk: string;
  tampil: number;
  created_at: string;
  updated_at: string;
  stall_nama: string;
  product_category?: ApiProductCategory;
  product_qty?: {
    id: number;
    qty: string;
    harga_jual: string;
    operator: string;
  }[];
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

interface ApiProductCategoriesResponse {
  success: boolean;
  message: string;
  data: {
    data: ApiProductCategory[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  placeholderText?: string;
  costPrice?: number;
  sellPrice?: number;
  unit?: string;
   productCategoryId?: number;
   stokMinimum?: number;
   deskripsi?: string;
   tampil?: number;
   aksesCustom?: boolean;
   productQtyJson?: {
     qty: number;
     harga_jual: number;
     operator: string;
   }[];
}

export default function ProductsPage() {
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<ApiProductCategory[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)

  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    categoryId: '',
    costPrice: '',
    sellPrice: '',
    stock: '',
    stokMinimum: '',
    deskripsi: '',
    unit: 'pcs',
    tampil: '1',
    aksesCustom: '0',
    imageFile: null as File | null,
  });
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [productQtyRows, setProductQtyRows] = useState<
    { qty: string; harga_jual: string; operator: string }[]
  >([{ qty: '', harga_jual: '', operator: 'equals' }]);

  // State & ref untuk scanner barcode sederhana (kamera)
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getPlaceholderText = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return 'PR';
    const words = trimmed.split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    const first = words[0][0] || '';
    const second = words[1][0] || '';
    return `${first}${second}`.toUpperCase();
  };

  const fetchCategories = async () => {
    try {
      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        // kalau belum login PIN, biarkan select kosong tanpa error
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/master/product-categories?page=1&limit=100`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const json: ApiProductCategoriesResponse = await response.json();
      setCategoryOptions(json.data.data || []);
    } catch {
      // abaikan error kategori
    }
  };

  const fetchProducts = async (currentPage: number) => {
    try {
      setLoading(true);
      setError(null);

      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        setError('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/master/products?page=${currentPage}&limit=${limit}`,
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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const json: ApiProductsResponse = await response.json();

      const mappedProducts: Product[] = json.data.data.map((item) => ({
        id: item.id,
        name: item.nama,
        sku: item.sku,
        category: item.product_category?.nama || '-',
        price: item.harga,
        stock: item.stok,
        image: item.gambar_url || '',
        placeholderText: getPlaceholderText(item.nama),
        costPrice: item.harga_modal,
        sellPrice: item.harga,
        unit: item.satuan || 'pcs',
        productCategoryId: item.product_category_id,
        stokMinimum: item.stok_minimum,
        deskripsi: item.deskripsi,
        tampil: item.tampil,
        aksesCustom: item.akses_custom,
        productQtyJson: item.product_qty?.map((q) => ({
          qty: Number(q.qty),
          harga_jual: Number(q.harga_jual),
          operator: q.operator,
        })),
      }));

      setProducts(mappedProducts);
      setPage(json.data.page);
      setTotalPages(json.data.total_pages);
      setTotalItems(json.data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat produk';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Ambil daftar produk setiap kali halaman berubah
  useEffect(() => {
    fetchProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Ambil kategori produk sekali saat komponen pertama kali dirender
  useEffect(() => {
    fetchCategories();
  }, []);

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

  // Jalankan / hentikan kamera ketika modal scanner dibuka / ditutup
  useEffect(() => {
    if (!showScanner) {
      // stop stream kalau ada
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsScanning(false);
      setScannerError(null);
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      try {
        setScannerError(null);
        setIsScanning(true);

        if (!navigator.mediaDevices?.getUserMedia) {
          setScannerError('Browser tidak mendukung akses kamera.');
          setIsScanning(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Gunakan BarcodeDetector jika tersedia di browser
        // @ts-ignore
        const BarcodeDetectorCtor = (window as any).BarcodeDetector;
        if (!BarcodeDetectorCtor) {
          setScannerError(
            'Browser tidak mendukung BarcodeDetector. Scanner hanya bisa dipakai dengan scanner fisik (alat scan yang mengetikkan kode ke input).'
          );
          setIsScanning(false);
          return;
        }

        // @ts-ignore
        const detector = new BarcodeDetectorCtor({
          formats: ['code_128', 'ean_13', 'ean_8', 'upc_a'],
        });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const scanFrame = async () => {
          if (cancelled || !videoRef.current || !context) return;

          const video = videoRef.current;
          if (video.readyState !== 4) {
            requestAnimationFrame(scanFrame);
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const barcodes = await detector.detect(canvas);
            if (barcodes.length > 0) {
              const code = (barcodes[0] as any).rawValue || (barcodes[0] as any).value || '';
              if (code) {
                setNewProduct((prev) => ({
                  ...prev,
                  sku: String(code),
                }));
                setShowScanner(false);
                return;
              }
            }
          } catch {
            // abaikan error baca per frame
          }

          requestAnimationFrame(scanFrame);
        };

        requestAnimationFrame(scanFrame);
      } catch {
        setScannerError('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.');
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [showScanner]);

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      return;
    }

    try {
      setDeletingProductId(productId);
      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        setError('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
        setDeletingProductId(null);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/master/products/${productId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal menghapus produk');
      }

      await fetchProducts(page);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus produk';
      setError(message);
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleSaveProduct = async (updatedProduct: any) => {
    try {
      setIsSubmitting(true);
      const jwtPin =
        typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        setError('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
        setIsSubmitting(false);
        return;
      }

      const aksesCustom =
        typeof updatedProduct.aksesCustom === 'boolean'
          ? updatedProduct.aksesCustom
          : false;

      const productQtyJson =
        updatedProduct.productQtyJson && aksesCustom
          ? updatedProduct.productQtyJson
          : [];

      const payload = {
        nama: updatedProduct.name,
        sku: updatedProduct.sku,
        satuan: updatedProduct.unit || '',
        product_category_id: Number(
          updatedProduct.productCategoryId ||
            categoryOptions.find((c) => c.nama === updatedProduct.category)?.id ||
            0
        ),
        harga: Number(updatedProduct.sellPrice),
        harga_modal: Number(updatedProduct.costPrice ?? 0),
        stok_minimum: Number(updatedProduct.stokMinimum ?? 0),
        deskripsi: updatedProduct.deskripsi ?? '',
        tampil: Number(updatedProduct.tampil ?? 1),
        akses_custom: aksesCustom,
        product_qty_json: productQtyJson,
      };

      let response: Response;

      if (updatedProduct.imageFile) {
        const formData = new FormData();
        formData.append('nama', payload.nama);
        formData.append('sku', payload.sku);
        formData.append('satuan', payload.satuan);
        formData.append(
          'product_category_id',
          String(payload.product_category_id)
        );
        formData.append('harga', String(payload.harga));
        formData.append('harga_modal', String(payload.harga_modal));
        formData.append('stok_minimum', String(payload.stok_minimum));
        formData.append('deskripsi', payload.deskripsi || '');
        formData.append('tampil', String(payload.tampil));
        formData.append('akses_custom', payload.akses_custom ? '1' : '0');
        if (payload.product_qty_json && payload.product_qty_json.length > 0) {
          formData.append(
            'product_qty_json',
            JSON.stringify(payload.product_qty_json)
          );
        }
        formData.append('gambar', updatedProduct.imageFile);

        response = await fetch(
          `${API_BASE_URL}/master/products/${updatedProduct.id}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${jwtPin}`,
            },
            body: formData,
          }
        );
      } else {
        response = await fetch(
          `${API_BASE_URL}/master/products/${updatedProduct.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwtPin}`,
            },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal mengupdate produk');
      }

      await fetchProducts(page);

      setEditingProduct(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengupdate produk';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

      if (!jwtPin) {
        setError('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
        setIsSubmitting(false);
        return;
      }

      const aksesCustom = newProduct.aksesCustom === '1';
      const productQtyJson = aksesCustom
        ? productQtyRows
            .filter(
              (row) =>
                row.qty !== '' && row.harga_jual !== '' && row.operator.trim() !== ''
            )
            .map((row) => ({
              qty: Number(row.qty),
              harga_jual: Number(row.harga_jual),
              operator: row.operator,
            }))
        : [];

      const payload = {
        nama: newProduct.name,
        sku: newProduct.sku,
        satuan: newProduct.unit || '',
        product_category_id: Number(newProduct.categoryId),
        harga: Number(newProduct.sellPrice),
        harga_modal: Number(newProduct.costPrice),
        stok: Number(newProduct.stock || 0),
        stok_minimum: Number(newProduct.stokMinimum || 0),
        deskripsi: newProduct.deskripsi,
        tampil: Number(newProduct.tampil || 1),
        akses_custom: aksesCustom,
        product_qty_json: productQtyJson,
      };

      let response: Response;

      if (newProduct.imageFile) {
        const formData = new FormData();
        formData.append('nama', payload.nama);
        formData.append('sku', payload.sku);
        formData.append('satuan', payload.satuan);
        formData.append(
          'product_category_id',
          String(payload.product_category_id)
        );
        formData.append('harga', String(payload.harga));
        formData.append('harga_modal', String(payload.harga_modal));
        formData.append('stok', String(payload.stok));
        formData.append('stok_minimum', String(payload.stok_minimum));
        formData.append('deskripsi', payload.deskripsi || '');
        formData.append('tampil', String(payload.tampil));
        formData.append('akses_custom', payload.akses_custom ? '1' : '0');
        if (payload.product_qty_json && payload.product_qty_json.length > 0) {
          formData.append(
            'product_qty_json',
            JSON.stringify(payload.product_qty_json)
          );
        }
        formData.append('gambar', newProduct.imageFile);

        response = await fetch(`${API_BASE_URL}/master/products`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwtPin}`,
          },
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/master/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal menyimpan produk');
      }

      await fetchProducts(page);
      setShowAddModal(false);
      setNewProduct({
        sku: '',
        name: '',
        categoryId: '',
        costPrice: '',
        sellPrice: '',
        stock: '',
        stokMinimum: '',
        deskripsi: '',
        unit: 'pcs',
        tampil: '1',
        aksesCustom: '0',
        imageFile: null,
      });
      setCategorySearch('');
      setProductQtyRows([{ qty: '', harga_jual: '', operator: 'equals' }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan produk';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'price-low') {
      return a.price - b.price;
    }
    if (sortBy === 'price-high') {
      return b.price - a.price;
    }
    if (sortBy === 'stock') {
      return b.stock - a.stock;
    }
    return 0;
  });

  const filteredProducts = sortedProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <i className="ri-box-3-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Daftar Produk</h1>
              <p className="text-gray-600 text-xs sm:text-sm">
                {loading ? 'Memuat produk...' : `${totalItems} produk dalam inventori`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base min-h-[44px]"
          >
            <i className="ri-add-line text-base sm:text-lg"></i>
            Input Produk
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <span className="ri-search-line w-5 h-5 flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></span>
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 sm:py-2.5 pr-8 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock">Stock Level</option>
            </select>
          </div>

          {error && (
            <div className="px-6 py-4 text-red-600 text-sm border-b border-red-100 bg-red-50 flex items-center gap-2">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          {loading && !error && (
            <div className="px-6 py-12 text-center">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                Memuat data produk...
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <div className="max-h-[calc(100vh-22rem)] overflow-y-auto scrollbar-hide">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">Produk</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">Kategori</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">Harga</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">Stok</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {!loading && !error && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <i className="ri-box-3-line text-4xl text-gray-300"></i>
                        <p className="text-sm font-medium text-gray-500">Tidak ada produk</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-600">
                              {product.placeholderText}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 font-mono">{product.sku}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-emerald-600">Rp {product.price.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        product.stock > 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        product.stock > 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {product.stock} unit
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingProduct(product)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
                        >
                          <i className="ri-edit-line text-base"></i>
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={deletingProductId === product.id}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Hapus produk"
                        >
                          {deletingProductId === product.id ? (
                            <i className="ri-loader-4-line text-base animate-spin"></i>
                          ) : (
                            <i className="ri-delete-bin-line text-base"></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>

          <div className="p-5 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              {searchQuery 
                ? <>Menampilkan <span className="font-semibold text-gray-900">{filteredProducts.length}</span> hasil pencarian dari <span className="font-semibold text-gray-900">{totalItems}</span> produk</>
                : <>Menampilkan <span className="font-semibold text-gray-900">{products.length}</span> dari <span className="font-semibold text-gray-900">{totalItems}</span> produk <span className="hidden sm:inline">(halaman {page} dari {totalPages})</span></>
              }
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
      </div>

      {editingProduct && (
        <EditProductModal
          product={{
            id: String(editingProduct.id),
            sku: editingProduct.sku,
            name: editingProduct.name,
            category: editingProduct.category,
            costPrice: editingProduct.costPrice || editingProduct.price * 0.75,
            sellPrice: editingProduct.sellPrice || editingProduct.price,
            stock: editingProduct.stock,
            unit: editingProduct.unit || 'pcs',
            image: editingProduct.image,
            productCategoryId: editingProduct.productCategoryId,
            stokMinimum: editingProduct.stokMinimum,
            deskripsi: editingProduct.deskripsi,
            tampil: editingProduct.tampil,
            aksesCustom: editingProduct.aksesCustom,
            productQtyJson: editingProduct.productQtyJson,
          }}
          categoryOptions={categoryOptions}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Input Product</h3>
                <p className="text-sm text-gray-500">
                  Tambah produk baru seperti di halaman Input Product
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <span className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                    <span className="ml-1 text-xs text-gray-400">
                      (bisa ketik manual atau scan barcode)
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProduct.sku}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, sku: e.target.value })
                      }
                      placeholder="Scan atau ketik SKU"
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      className="px-3 py-2.5 border border-emerald-500 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 cursor-pointer flex items-center gap-1"
                    >
                      <span className="ri-qr-scan-line text-lg" />
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    placeholder="Enter product name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gambar Produk
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setNewProduct((prev) => ({
                      ...prev,
                      imageFile: file,
                    }));
                  }}
                  className="w-full text-sm text-gray-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {newProduct.imageFile && (
                  <p className="mt-1 text-xs text-gray-500">
                    File terpilih: {newProduct.imageFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="relative">
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 cursor-text"
                    onClick={() => setShowCategoryDropdown(true)}
                  >
                    <span className="ri-price-tag-3-line text-gray-400 text-base" />
                    <input
                      type="text"
                      value={
                        categorySearch ||
                        categoryOptions.find(
                          (c) => String(c.id) === newProduct.categoryId
                        )?.nama ||
                        ''
                      }
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setShowCategoryDropdown(true);
                      }}
                      placeholder="Ketik untuk mencari kategori..."
                      className="flex-1 bg-transparent outline-none placeholder:text-gray-400"
                    />
                    <span className="ri-arrow-down-s-line text-gray-400 text-base" />
                  </div>

                  {showCategoryDropdown && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {categoryOptions
                        .filter((cat) =>
                          cat.nama
                            .toLowerCase()
                            .includes(categorySearch.toLowerCase())
                        )
                        .map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setNewProduct((prev) => ({
                                ...prev,
                                categoryId: String(cat.id),
                              }));
                              setCategorySearch(cat.nama);
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 cursor-pointer ${
                              String(cat.id) === newProduct.categoryId
                                ? 'bg-emerald-50 text-emerald-700 font-medium'
                                : 'text-gray-700'
                            }`}
                          >
                            {cat.nama}
                          </button>
                        ))}
                      {categoryOptions.filter((cat) =>
                        cat.nama
                          .toLowerCase()
                          .includes(categorySearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-400">
                          Kategori tidak ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    value={newProduct.costPrice}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, costPrice: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sell Price
                  </label>
                  <input
                    type="number"
                    value={newProduct.sellPrice}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, sellPrice: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, unit: e.target.value })
                    }
                    placeholder="pcs / bungkus / dll"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stok Minimum
                  </label>
                  <input
                    type="number"
                    value={newProduct.stokMinimum}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        stokMinimum: e.target.value,
                      })
                    }
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={newProduct.deskripsi}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, deskripsi: e.target.value })
                  }
                  placeholder="Deskripsi produk"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tampil
                  </label>
                  <select
                    value={newProduct.tampil}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, tampil: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="1">Tampil</option>
                    <option value="0">Sembunyikan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Akses Custom Harga
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct({ ...newProduct, aksesCustom: '0' })
                      }
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                        newProduct.aksesCustom === '0'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      0 - Non Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct({ ...newProduct, aksesCustom: '1' })
                      }
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                        newProduct.aksesCustom === '1'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      1 - Aktif
                    </button>
                  </div>
                </div>
              </div>

              {newProduct.aksesCustom === '1' && (
                <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">
                      Pengaturan Harga Per Qty (product_qty_json)
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setProductQtyRows([
                          ...productQtyRows,
                          { qty: '', harga_jual: '', operator: 'equals' },
                        ])
                      }
                      className="px-3 py-1.5 text-xs rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 cursor-pointer"
                    >
                      + Tambah Baris
                    </button>
                  </div>

                  <div className="space-y-2">
                    {productQtyRows.map((row, index) => (
                      <div key={index} className="grid grid-cols-4 gap-3 items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Qty
                          </label>
                          <input
                            type="number"
                            value={row.qty}
                            onChange={(e) => {
                              const next = [...productQtyRows];
                              next[index] = { ...next[index], qty: e.target.value };
                              setProductQtyRows(next);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="6"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Harga Jual
                          </label>
                          <input
                            type="number"
                            value={row.harga_jual}
                            onChange={(e) => {
                              const next = [...productQtyRows];
                              next[index] = {
                                ...next[index],
                                harga_jual: e.target.value,
                              };
                              setProductQtyRows(next);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="100"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Operator
                          </label>
                          <select
                            value={row.operator}
                            onChange={(e) => {
                              const next = [...productQtyRows];
                              next[index] = {
                                ...next[index],
                                operator: e.target.value,
                              };
                              setProductQtyRows(next);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="equals">equals</option>
                            <option value="greater_or_equals">greater_or_equals</option>
                            <option value="less_or_equals">less_or_equals</option>
                          </select>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (productQtyRows.length === 1) {
                                setProductQtyRows([
                                  { qty: '', harga_jual: '', operator: 'equals' },
                                ]);
                              } else {
                                setProductQtyRows(
                                  productQtyRows.filter((_, i) => i !== index)
                                );
                              }
                            }}
                            className="px-3 py-2 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium active:bg-gray-200 sm:hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap min-h-[44px] touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-semibold active:bg-emerald-600 sm:hover:bg-emerald-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
                >
                  {isSubmitting ? (
                    <>
                      <span className="ri-loader-4-line animate-spin"></span>
                      Menyimpan...
                    </>
                  ) : (
                    'Save Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Scan Barcode SKU</p>
                <p className="text-xs text-gray-500">
                  Arahkan kamera ke barcode produk sampai kode terbaca otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScanner(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <span className="ri-close-line text-lg text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              </div>

              {scannerError && (
                <p className="text-xs text-red-500">
                  {scannerError}
                </p>
              )}

              {!scannerError && (
                <p className="text-xs text-gray-500">
                  {isScanning
                    ? 'Mencari barcode...'
                    : 'Jika tidak terbaca, Anda tetap bisa memakai scanner fisik yang mengetikkan kode langsung ke input SKU.'}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowScanner(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
