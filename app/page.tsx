'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AddToCartModal from '@/components/AddToCartModal';
import Sidebar from '@/components/Sidebar';
import PrinterStatusIndicator from '@/components/PrinterStatusIndicator';
import { API_BASE_URL } from '@/utils/api';
import { usePrinter } from '@/components/PrinterProvider';
import {
  CloseCashierReceiptData,
  generateCloseCashierReceiptESC_POS,
  generateReceiptESC_POS,
  printToPrinter,
  reconnectUSBDevice,
  ReceiptData,
  USBDevice,
} from '@/utils/printerUtils';
import {
  shouldShowBukaKasir,
  bukaKasirApi,
  fetchTutupKasirData,
  tutupKasirApi,
  getStatusUangBukakasir,
  getBukakasId,
  TutupKasirData,
} from '@/utils/cashierSession';
import { logoutUser } from '@/utils/storage';
import { THEMES, getCurrentTheme, setTheme, applyTheme, type ThemeColor } from '@/utils/theme';
import { registerShortcuts, listenToTauriShortcuts, SHORTCUTS } from '@/utils/keyboardShortcuts';

interface ProductQty {
  id: number;
  qty: string;
  harga_jual: string;
  harga_minimum: string;
  operator: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  unit: string;
  placeholderText?: string;
  isCustom?: boolean;
  stock: number;
  productQty?: ProductQty[];
}

interface CurrentCashier {
  id: string;
  name: string;
  initials: string;
  level: string;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
  negotiatedPrice?: number;
  note?: string;
}

interface ApiProductCategory {
  id: number;
  nama: string;
}

interface ApiProductQty {
  id: number;
  qty: string;
  harga_jual: string;
  harga_minimum: string;
  operator: string;
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
  product_qty?: ApiProductQty[];
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

interface PosCategory {
  id: string;
  name: string;
}

export default function POSPage() {
  const router = useRouter();
  const printer = usePrinter();
  const [isChecking, setIsChecking] = useState(true);
  // State buka/tutup kasir
  const [showBukaKasirModal, setShowBukaKasirModal] = useState(false);
  const [saldoAwalInput, setSaldoAwalInput] = useState('');
  const [catatanBuka, setCatatanBuka] = useState('');
  const [loadingKasir, setLoadingKasir] = useState(false);
  const [showRingkasanTutup, setShowRingkasanTutup] = useState(false);
  const [tutupKasirData, setTutupKasirData] = useState<TutupKasirData | null>(null);
  const [processingTutupKasir, setProcessingTutupKasir] = useState(false);
  const [catatanTutupKasir, setCatatanTutupKasir] = useState('');
  const [showDialogSetelahTutupKasir, setShowDialogSetelahTutupKasir] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>(THEMES[0]);
  const mobileSearchRef = useRef<HTMLInputElement | null>(null);
  const desktopSearchRef = useRef<HTMLInputElement | null>(null);
  const isInitialMount = useRef(true); // Track initial mount untuk mencegah double fetch
  
  useEffect(() => {
    // Cek apakah user sudah login dan PIN sudah diverifikasi
    const currentUserStr = localStorage.getItem('currentUser');
    
    if (!currentUserStr) {
      router.push('/login');
      return;
    }

    try {
      const currentUser = JSON.parse(currentUserStr);
      
      if (!currentUser.loggedIn) {
        router.push('/login');
        return;
      }

      if (!currentUser.pinVerified) {
        router.push('/pin');
        return;
      }
      
      const name: string = currentUser.name || 'Kasir';
      const level: string = currentUser.level || 'Kasir';
      const words = name.trim().split(/\s+/);
      const initials =
        words.length >= 2
          ? `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase()
          : name.slice(0, 2).toUpperCase();

      setSelectedCashier({
        id: String(currentUser.id ?? currentUser.user_id ?? '1'),
        name,
        initials,
        level,
      });

      setIsChecking(false);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/login');
    }
  }, [router]);

  // Load theme on mount
  useEffect(() => {
    const theme = getCurrentTheme();
    setCurrentTheme(theme);
    applyTheme(theme.id);
  }, []);

  // Handle theme change
  const handleThemeChange = (themeId: string) => {
    const theme = THEMES.find((t) => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      setTheme(themeId);
      setShowThemeModal(false);
    }
  };

  // Fokus otomatis ke kolom scan / cari produk untuk memudahkan kasir
  const focusSearchInput = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.innerWidth < 768) {
        mobileSearchRef.current?.focus();
      } else {
        desktopSearchRef.current?.focus();
      }
    } catch {
      // abaikan error fokus
    }
  }, []);

  useEffect(() => {
    // Fokus awal saat halaman POS dibuka
    focusSearchInput();

    // Saat ukuran layar berubah, tetap prioritaskan fokus ke kolom scan
    const handleResize = () => focusSearchInput();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listener global: tangkap input barcode (deretan angka cepat + Enter) meskipun kursor tidak di kolom search
  useEffect(() => {
    const buffer = {
      value: '',
      lastTime: 0,
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Abaikan jika ada modifier
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      const target = event.target as HTMLElement | null;
      // Jika fokus di input/textarea/contentEditable, biarkan pengguna mengetik manual
      if (
        target &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target.isContentEditable)
      ) {
        return;
      }

      const now = Date.now();
      const isDigit = event.key >= '0' && event.key <= '9';

      // Reset buffer jika jeda terlalu lama (anggap bukan scan barcode)
      if (now - buffer.lastTime > 300) {
        buffer.value = '';
      }

      if (isDigit) {
        buffer.value += event.key;
        buffer.lastTime = now;
        return;
      }

      if (event.key === 'Enter') {
        // Minimal 6 digit agar tidak ganggu pengetikan biasa
        if (buffer.value.length >= 6) {
          setSearchQuery(buffer.value);
          buffer.value = '';
          buffer.lastTime = 0;
          event.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // Setelah cek login & PIN selesai, cek status buka/tutup kasir
  useEffect(() => {
    if (isChecking) return;

    const initKasir = async () => {
      try {
        const { needOpen, needClose } = await shouldShowBukaKasir();

        // Jika perlu tutup dulu (karena lewat hari), ambil ringkasan dan tampilkan
        if (needClose) {
          try {
            const data = await fetchTutupKasirData();
            if (data) {
              setTutupKasirData(data);
              setShowRingkasanTutup(true);
              return;
            }
            // Jika data null, berarti tidak ada bukakas aktif, lanjut ke buka kasir
            console.log('Tidak ada data ringkasan, lanjut ke buka kasir');
          } catch (e) {
            console.error('Gagal mengambil ringkasan tutup kasir:', e);
            // Jika error, berarti tidak ada bukakas aktif, lanjut ke buka kasir
          }
        }

        // Jika belum ada bukakas aktif, cek status_uang_bukakasir
        // Hanya auto-buka kasir jika status_uang_bukakasir === 1
        if (needOpen) {
            const status = getStatusUangBukakasir(); // 1 = auto, selain itu wajib popup
          
          // Jika status_uang_bukakasir === 1, auto buka kasir
            if (status === 1) {
              try {
                setLoadingKasir(true);
                // Auto buka kasir dengan saldo 0 dan catatan default
                await bukaKasirApi({
                  saldoAwal: 0,
                  catatan: 'Auto buka kasir',
                  permanen: true,
                });
              } catch (e) {
                console.error('Gagal auto buka kasir:', e);
                // Kalau auto gagal, fallback ke popup manual
                setShowBukaKasirModal(true);
              } finally {
                setLoadingKasir(false);
              }
            } else {
              // status_uang_bukakasir != 1 -> wajib popup buka kasir
              setShowBukaKasirModal(true);
          }
        }
      } catch (e) {
        console.error('Gagal cek status kasir:', e);
      }
    };

    void initKasir();
  }, [isChecking]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'cash' | 'digital' | 'qris'>('cash');
  const [digitalMethod, setDigitalMethod] = useState('OVO');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [isDebt, setIsDebt] = useState(false);
  const [jatuhTempo, setJatuhTempo] = useState(''); // format: YYYY-MM-DD
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)
  const [showCashierDropdown, setShowCashierDropdown] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<CurrentCashier | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Register keyboard shortcuts for desktop
  useEffect(() => {
    const shortcuts = new Map<string, () => void>();

    // Focus search input (F key or Cmd/Ctrl+K)
    shortcuts.set(SHORTCUTS.FOCUS_SEARCH, () => {
      focusSearchInput();
    });
    shortcuts.set(`CommandOrControl+${SHORTCUTS.FOCUS_SEARCH_ALT}`, () => {
      focusSearchInput();
    });

    // Toggle cart (C key)
    shortcuts.set(SHORTCUTS.TOGGLE_CART, () => {
      if (!showBukaKasirModal && !showRingkasanTutup && !showDialogSetelahTutupKasir && !showThemeModal) {
        setShowCart(!showCart);
      }
    });

    // Close modals (Escape key)
    shortcuts.set(SHORTCUTS.CLOSE_MODAL, () => {
      if (showThemeModal) {
        setShowThemeModal(false);
      }
      if (showRingkasanTutup) {
        setShowRingkasanTutup(false);
      }
      if (showDialogSetelahTutupKasir) {
        setShowDialogSetelahTutupKasir(false);
      }
      if (showCart && cartItems.length === 0) {
        setShowCart(false);
      }
      setSearchQuery('');
    });

    // Listen to Tauri global shortcuts
    const cleanupTauri = listenToTauriShortcuts({
      onSearch: () => focusSearchInput(),
      onEscape: () => {
        if (showThemeModal) setShowThemeModal(false);
        if (showRingkasanTutup) setShowRingkasanTutup(false);
        if (showDialogSetelahTutupKasir) setShowDialogSetelahTutupKasir(false);
        if (showCart && cartItems.length === 0) setShowCart(false);
        setSearchQuery('');
      },
    });

    // Register shortcuts
    const cleanup = registerShortcuts(shortcuts);

    return () => {
      if (cleanup) cleanup();
      if (cleanupTauri) cleanupTauri();
    };
  }, [showCart, showBukaKasirModal, showRingkasanTutup, showDialogSetelahTutupKasir, showThemeModal, cartItems.length]);
  const [transactionData, setTransactionData] = useState<{
    id: string;
    total: number;
    paid: number;
    change: number;
    paymentMethod?: string;
    customerName?: string;
    isDebt?: boolean;
    items?: {
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }[];
  } | null>(null);
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]); // Simpan data original tanpa search
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);
  const [processingTransaction, setProcessingTransaction] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
      setLoadingCategories(true);
      setErrorCategories(null);

      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const response = await fetch(
        `${API_BASE_URL}/master/product-categories?page=1&limit=100`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
          cache: 'no-store', // Pastikan selalu fetch data terbaru, tidak menggunakan cache
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const json: ApiProductCategoriesResponse = await response.json();

      const mapped: PosCategory[] = [
    { id: 'all', name: 'All Product' },
        ...json.data.data.map((item) => ({
          id: String(item.id),
          name: item.nama,
        })),
      ];

      setCategories(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat kategori produk';
      setErrorCategories(message);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProducts = async (search?: string, page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
      setLoadingProducts(true);
      }
      setErrorProducts(null);

      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      // Gunakan limit 10 untuk pagination
      let url = `${API_BASE_URL}/master/products?page=${page}&limit=10`;
      if (search && search.trim() !== '') {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await fetch(
        url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
          cache: 'no-store', // Pastikan selalu fetch data terbaru, tidak menggunakan cache
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const json: ApiProductsResponse = await response.json();

      const mapped: Product[] = json.data.data.map((item) => ({
        id: String(item.id),
        name: item.nama,
        sku: item.sku,
        barcode: item.barcode,
        price: item.harga,
        originalPrice: item.harga_modal || item.harga,
        image: item.gambar_url || '',
        placeholderText: getPlaceholderText(item.nama),
        category: item.product_category?.nama || '-',
        unit: `Sisa ${item.stok}`,
        isCustom: item.akses_custom,
        stock: item.stok,
        productQty: item.product_qty?.map((pq) => ({
          id: pq.id,
          qty: pq.qty,
          harga_jual: pq.harga_jual,
          harga_minimum: pq.harga_minimum,
          operator: pq.operator,
        })),
      }));

      // Update pagination info
      setTotalPages(json.data.total_pages);
      setHasMore(page < json.data.total_pages);
      setCurrentPage(page);

      // Jika append, tambahkan ke products yang sudah ada
      if (append) {
        setProducts(prev => [...prev, ...mapped]);
        // Jika tanpa search, juga append ke originalProducts
        if (!search || search.trim() === '') {
          setOriginalProducts(prev => [...prev, ...mapped]);
        }
      } else {
        // Jika tidak append, replace semua data
      if (!search || search.trim() === '') {
        setOriginalProducts(mapped);
        setProducts(mapped);
        
          // Update stok di cart items sesuai dengan data produk terbaru
          // Hanya update ketika fetch tanpa search untuk memastikan data lengkap
          if (cartItems.length > 0) {
            // Buat map untuk lookup yang lebih cepat (O(1) instead of O(n))
            const productMap = new Map(mapped.map(p => [p.id, p]));
            
            setCartItems(prevCartItems =>
              prevCartItems.map(cartItem => {
                const updatedProduct = productMap.get(cartItem.id);
                if (updatedProduct) {
                  // Update stok dan pastikan quantity tidak melebihi stok baru
                  const newStock = updatedProduct.stock ?? 0;
                  const adjustedQty = Math.min(cartItem.quantity, newStock);
                  return {
                    ...cartItem,
                    stock: newStock,
                    quantity: adjustedQty > 0 ? adjustedQty : 0,
                    subtotal: (adjustedQty > 0 ? adjustedQty : 0) * cartItem.price,
                  };
                }
                return cartItem;
              }).filter(item => item.quantity > 0) // Hapus item dengan quantity 0
            );
          }
      } else {
        // Ketika search, tetap update products tapi originalProducts tetap dipertahankan
        setProducts(mapped);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat produk';
      setErrorProducts(message);
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
      setLoadingProducts(false);
      }
    }
  };

  // Helper function untuk refresh produk (menghindari duplikasi kode)
  const refreshProducts = async () => {
    // Reset pagination
    setCurrentPage(1);
    setHasMore(true);
    // Selalu refresh originalProducts (tanpa search) untuk data base yang konsisten
    await fetchProducts(undefined, 1, false);
    
    // Jika ada searchQuery aktif, juga refresh dengan search untuk update tampilan search
    if (searchQuery && searchQuery.trim() !== '') {
      await fetchProducts(searchQuery, 1, false);
    }
  };

  // Load more products untuk infinite scroll
  const loadMoreProducts = async () => {
    if (isLoadingMore || !hasMore) return;
    
    const nextPage = currentPage + 1;
    await fetchProducts(searchQuery || undefined, nextPage, true);
  };

  useEffect(() => {
    // Jalankan fetch categories dan products secara parallel untuk performa lebih baik
    Promise.all([
      fetchCategories(),
      fetchProducts(undefined, 1, false)
    ]).catch(err => {
      console.error('Error loading initial data:', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Skip fetch saat initial mount karena sudah di-handle oleh useEffect pertama
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Reset pagination saat search berubah
    setCurrentPage(1);
    setHasMore(true);

    // Hanya debounce jika ada search query, langsung fetch jika search kosong
    const delay = searchQuery && searchQuery.trim() !== '' ? 400 : 0;

    const handler = setTimeout(() => {
      if (!searchQuery || searchQuery.trim() === '') {
        // Jika searchQuery kosong, fetch ulang dari API untuk mendapatkan data terbaru
        fetchProducts(undefined, 1, false);
      } else {
        // Jika ada searchQuery, fetch dengan parameter search
        fetchProducts(searchQuery, 1, false);
      }
    }, delay);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Intersection Observer untuk infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingMore || loadingProducts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoadingMore && !loadingProducts) {
          loadMoreProducts();
        }
      },
      {
        rootMargin: '100px', // Trigger 100px sebelum sentinel terlihat
        threshold: 0.1,
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoadingMore, loadingProducts, currentPage]);

  const handleProductClick = useCallback((product: Product) => {
    // Cek bukakas_id terlebih dahulu - gunakan cached value atau re-check
    const currentBukakasId = getBukakasId();
    if (!currentBukakasId) {
      alert('Silakan buka kasir terlebih dahulu sebelum memilih produk.');
      return;
    }

    if (product.stock <= 0) {
      return;
    }

    if (product.isCustom) {
    setSelectedProduct(product);
    setShowAddModal(true);
    } else {
      const directItem = {
        productId: product.id,
        name: product.name,
        unit: 'pcs',
        quantity: 1,
        price: product.price,
      };
      handleAddToCart(directItem);
    }
  }, [products, cartItems]);

  const handleAddToCart = useCallback((item: {
    productId: string;
    name: string;
    unit: string;
    quantity: number;
    price: number;
    negotiatedPrice?: number;
    note?: string;
  }) => {
    const productData = products.find((p) => p.id === item.productId) || selectedProduct;
    const priceToUse = item.negotiatedPrice ?? item.price;

    const maxStock = productData?.stock ?? Infinity;
    const existingItem = cartItems.find((c) => c.id === item.productId);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const requestedQty = Math.min(item.quantity, Math.max(0, maxStock - currentQty));

    if (requestedQty <= 0) {
      // stok habis atau sudah mencapai batas stok
      return;
    }

    const newItem = {
      id: item.productId,
      name: item.name,
      unit: item.unit,
      quantity: requestedQty,
      price: priceToUse,
      originalPrice: productData?.originalPrice ?? item.price,
      image: productData?.image ?? '',
      category: productData?.category ?? '',
      stock: maxStock,
      negotiatedPrice: item.negotiatedPrice,
      note: item.note,
      subtotal: priceToUse * requestedQty,
    };

    if (existingItem) {
      setCartItems(
        cartItems.map((c) =>
          c.id === newItem.id
            ? {
                ...c,
                quantity: c.quantity + newItem.quantity,
                subtotal: (c.quantity + newItem.quantity) * c.price,
                note: newItem.note ?? c.note,
              }
            : c
        )
      );
    } else {
      setCartItems([...cartItems, newItem]);
    }

    setShowAddModal(false);
  }, [products, selectedProduct, cartItems]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCartItems(
      cartItems
        .map(item => {
          if (item.id === id) {
            const maxStock = item.stock ?? Infinity;
            const nextQty = Math.min(Math.max(0, item.quantity + delta), maxStock);
            return { ...item, quantity: nextQty, subtotal: nextQty * item.price };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  }, [cartItems]);

  const setQuantityValue = useCallback((id: string, value: number) => {
    const raw = value || 0;
    setCartItems(
      cartItems
        .map(item => {
        if (item.id === id) {
          const maxStock = item.stock ?? Infinity;
            const qty = Math.min(Math.max(0, raw), maxStock);
          return { ...item, quantity: qty, subtotal: qty * item.price };
        }
        return item;
      })
        .filter(item => item.quantity > 0)
    );
  }, [cartItems]);

  const removeItem = useCallback((id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  }, [cartItems]);

  const clearAll = useCallback(() => {
    setCartItems([]);
  }, []);

  const saveToLocalList = <T,>(key: string, item: T) => {
    try {
      const stored = localStorage.getItem(key);
      const arr = stored ? (JSON.parse(stored) as T[]) : [];
      const next = Array.isArray(arr) ? [...arr, item] : [item];
      localStorage.setItem(key, JSON.stringify(next));
    } catch (err) {
      console.error('Failed to persist data', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyInput = (value: number | string): string => {
    const num = typeof value === 'string' ? parseCurrencyInput(value) : value;
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const parseCurrencyInput = (value: string): number => {
    // Hapus semua karakter non-digit
    const cleaned = value.replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const handleProcessPayment = async () => {
    try {
      setProcessingTransaction(true);
      setTransactionError(null);

      // Validasi jika piutang, nama pelanggan wajib
      if (isDebt && !manualCustomerName.trim()) {
        setTransactionError('Nama pelanggan wajib diisi untuk transaksi piutang');
        setProcessingTransaction(false);
        return;
      }

      // Validasi jika piutang, jatuh tempo wajib
      if (isDebt && !jatuhTempo) {
        setTransactionError('Jatuh tempo wajib diisi untuk transaksi piutang');
        setProcessingTransaction(false);
        return;
      }

      // Validasi jika cash dan tidak piutang, jumlah bayar harus >= total
      const parsedPaidAmount = parseCurrencyInput(paidAmount);
      if (!isDebt && payMethod === 'cash' && parsedPaidAmount < total) {
        setTransactionError('Jumlah bayar kurang dari total');
        setProcessingTransaction(false);
        return;
      }

      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

      if (!currentUser) {
        throw new Error('Data user tidak ditemukan. Silakan login ulang.');
      }

      // Mapping payment method ke transaction_method_id
      // cash = 1, digital = 2, qris = 3 (sesuaikan dengan API Anda)
      const methodLabel = payMethod === 'digital' ? digitalMethod : payMethod;
      let transactionMethodId = 1; // default cash
      if (payMethod === 'cash') {
        transactionMethodId = 1;
      } else if (payMethod === 'digital') {
        transactionMethodId = 2;
      } else if (payMethod === 'qris') {
        transactionMethodId = 3;
      }
      const finalPaidAmount = payMethod === 'cash' ? parsedPaidAmount : total;
      const customerName = manualCustomerName.trim() || 'Tidak ada nama pelanggan';
      const finalChange = isDebt ? 0 : Math.max(0, finalPaidAmount - total);

      // Ambil bukakas_id aktif dari localStorage (diset oleh modul kasir)
      let activeBukakasId = getBukakasId();
      
      // Jika bukakas_id tidak ada, coba sinkronkan dulu dengan server
      if (!activeBukakasId) {
        try {
          await shouldShowBukaKasir();
          activeBukakasId = getBukakasId();
          
      if (!activeBukakasId) {
        throw new Error('ID bukakas aktif tidak ditemukan. Silakan buka kasir terlebih dahulu.');
          }
        } catch (syncError) {
          throw new Error('ID bukakas aktif tidak ditemukan. Silakan buka kasir terlebih dahulu.');
        }
      }

      // Siapkan payload sesuai format API
      const payload = {
        bukakas_id: activeBukakasId,
        nama_customer: customerName,
        no_tlpn: manualCustomerPhone || '',
        transaction_method_id: transactionMethodId,
        user_id_tenant: currentUser.id,
        nomor_meja: '',
        tipe: 'dine_in', // atau 'take_away', sesuaikan dengan kebutuhan
        status: '',
        dibayar: !isDebt,
        pembayaran_melalui: 'cashier',
        // Untuk sementara, matikan diskon, pajak, dan biaya lainnya (semua 0)
        diskon: 0,
        pajak: 0,
        biaya_lainnya: 0,
        nominal_bayar: finalPaidAmount,
        catatan: '',
        nama_pelanggan: customerName,
        piutang: isDebt,
        ...(isDebt ? { jatuh_tempo: jatuhTempo } : {}),
        details: cartItems.map((item) => {
          const hargaJual = item.negotiatedPrice || item.price;
          const subtotalCalc = hargaJual * item.quantity;
          const keuntungan = (hargaJual - (item.originalPrice || hargaJual)) * item.quantity;

          return {
            product_id: Number(item.id),
            nama_produk: item.name,
            nama_varian: '',
            qty: item.quantity,
            qty_awal: 0,
            stok_sebelum_transaksi: item.stock || 0,
            harga_modal: item.originalPrice || hargaJual,
            harga_jual: hargaJual,
            diskon: 0,
            subtotal: subtotalCalc,
            keuntungan: keuntungan > 0 ? keuntungan : 0,
            aktif: true,
          };
        }),
      };

      // Panggil API insert transaksi
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
        body: JSON.stringify(payload),
        cache: 'no-store', // Pastikan selalu fetch data terbaru, tidak menggunakan cache
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      // Snapshot item untuk struk sebelum cart dikosongkan
      const itemsForReceipt =
        cartItems.length > 0
          ? cartItems.map((item) => {
              const hargaJual = item.negotiatedPrice || item.price;
              const subtotalCalc = hargaJual * item.quantity;
              return {
                name: item.name,
                quantity: item.quantity,
                price: hargaJual,
                subtotal: subtotalCalc,
              };
            })
          : [];

      // Set transaction data untuk modal sukses & struk
      const transactionId =
        json.data?.nomor_transaksi || json.data?.id || `TRX${Date.now()}`;
      setTransactionData({
        id: transactionId,
        total,
        paid: finalPaidAmount,
        change: finalChange,
        paymentMethod: methodLabel,
        customerName,
        isDebt,
        items: itemsForReceipt,
      });

    // Close payment modal and show success modal
    setShowPayModal(false);
    setShowSuccessModal(true);

      // Reset form
      setCartItems([]);

      // Refresh data produk segera setelah transaksi berhasil untuk update stok terbaru
      await refreshProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memproses transaksi';
      setTransactionError(message);
      console.error('Transaction error:', err);
    } finally {
      setProcessingTransaction(false);
    }
  };

  const handleCloseSuccessModal = async () => {
    // Cek auto_print, jika 1 maka auto print dulu
    const autoPrint = typeof window !== 'undefined' 
      ? localStorage.getItem('auto_print') || '0'
      : '0';
    
    if (autoPrint === '1') {
      await handlePrintReceipt();
    }

    setShowSuccessModal(false);
    setCartItems([]);
    setShowCart(false);
    setIsDebt(false);
    setJatuhTempo('');
    setManualCustomerName('');
    setManualCustomerPhone('');
    setPaidAmount('0');
    setDigitalMethod('OVO');
    setPayMethod('cash');
    setTransactionData(null);
    setTransactionError(null);

    // Refresh data produk untuk memastikan stok terbaru
    await refreshProducts();
  };

  const handlePrintReceipt = async () => {
    try {
      if (!transactionData) {
        console.error('Tidak ada data transaksi untuk dicetak');
        return;
      }

      // Ambil pengaturan struk dari localStorage (diset dari halaman Settings)
      let storeName = 'TOKO';
      let address = '';
      let phone = '';
      let footerNote = '';

      try {
        if (typeof window !== 'undefined') {
          const savedSettings =
            window.localStorage.getItem('receipt_settings');
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            storeName = parsed.storeName || storeName;
            address = parsed.address || address;
            phone = parsed.phone || phone;
            footerNote = parsed.footerNote || footerNote;
          }

          // Fallback: jika belum ada nama toko di pengaturan struk,
          // gunakan data dari pin_session (nama_kios, lokasi, notelp, receipt_footer_text)
          if (!storeName || storeName === 'TOKO') {
            const pinSession = window.localStorage.getItem('pin_session');
            if (pinSession) {
              try {
                const sessionData = JSON.parse(pinSession);
                storeName =
                  sessionData.nama_kios || storeName || 'TOKO';
                address =
                  sessionData.lokasi || address || '';
                phone =
                  sessionData.notelp || phone || '';
                footerNote =
                  sessionData.receipt_footer_text ||
                  footerNote ||
                  '';
              } catch (err) {
                console.warn(
                  'Gagal membaca pin_session untuk fallback nama toko:',
                  err
                );
              }
            }
          }
        }
      } catch (e) {
        console.warn(
          'Gagal membaca pengaturan struk dari localStorage:',
          e
        );
      }

      const now = new Date();
      const receiptData: ReceiptData = {
        storeName,
        address,
        phone,
        footerNote,
        transactionId: transactionData.id,
        date: now.toLocaleDateString('id-ID'),
        time: now.toLocaleTimeString('id-ID'),
        items: (transactionData.items || []).map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        subtotal: transactionData.total,
        tax: 0,
        discount: 0,
        total: transactionData.total,
        paid: transactionData.paid,
        change: transactionData.isDebt ? 0 : transactionData.change,
        paymentMethod: transactionData.paymentMethod || 'Cash',
        customerName: transactionData.customerName,
        isDebt: transactionData.isDebt,
        cashierName: selectedCashier?.name,
      };

      const escposData = generateReceiptESC_POS(receiptData);

      // Gunakan PrinterProvider untuk menentukan ke mana data dikirim
      if (!printer.isConnected || printer.type === 'system') {
        // Jika mode sistem / belum ada printer WebUSB, fallback ke dialog print browser
        window.print();
        return;
      }

      if (printer.type === 'usb') {
        let device: USBDevice | null = (printer as unknown as { usbDevice?: USBDevice }).usbDevice || null;

        if (!device) {
          device = await reconnectUSBDevice();
        }

        if (!device) {
          console.error('Printer USB belum terhubung, fallback ke window.print');
          window.print();
          return;
        }

        await printToPrinter('usb', device, escposData);
      } else {
        // Bluetooth belum diimplementasikan, fallback ke print sistem
        window.print();
      }
    } catch (err) {
      console.error('Print error:', err);
      try {
        window.print();
      } catch (fallbackErr) {
        console.error('Fallback window.print error:', fallbackErr);
      }
    }
  };

  const handleCetakStrukTutupKasir = async (data: TutupKasirData) => {
    try {
      let storeName = 'TOKO';
      let address = '';
      let phone = '';
      let footerNote = '';

      // Ambil pengaturan struk seperti struk transaksi, agar konsisten
      try {
        if (typeof window !== 'undefined') {
          const savedSettings = window.localStorage.getItem('receipt_settings');
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            storeName = parsed.storeName || storeName;
            address = parsed.address || address;
            phone = parsed.phone || phone;
            footerNote = parsed.footerNote || footerNote;
          }

          if (!storeName || storeName === 'TOKO') {
            const pinSession = window.localStorage.getItem('pin_session');
            if (pinSession) {
              try {
                const sessionData = JSON.parse(pinSession);
                storeName = sessionData.nama_kios || storeName || 'TOKO';
                address = sessionData.lokasi || address || '';
                phone = sessionData.notelp || phone || '';
                footerNote =
                  sessionData.receipt_footer_text || footerNote || '';
              } catch (err) {
                console.warn('Gagal membaca pin_session:', err);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Gagal membaca pengaturan struk:', err);
      }

      const totalPendapatan =
        (data as any)?.total_pendapatan ?? (data as any)?.total_pendapatan_selesai ?? data.total ?? 0;
      interface PengeluaranItem {
        nama?: string;
        nominal?: number;
        catatan?: string;
      }

      const pengeluaranList: Array<PengeluaranItem> = Array.isArray((data as any)?.pengeluaran)
        ? (data as any).pengeluaran
        : [];

      const closeReceiptData: CloseCashierReceiptData = {
        storeName,
        address,
        phone,
        footerNote,
        waktuBuka: data.waktu_buka || '-',
        waktuTutup: data.waktu_tutup && data.waktu_tutup !== '-' ? data.waktu_tutup : data.waktu_sekarang || '-',
        totalTransaksi: data.total_transaksi || 0,
        // total_pendapatan adalah jumlah pemasukan kotor; total adalah setelah biaya/pengeluaran
        totalPenjualan: data.total ?? totalPendapatan ?? 0,
        tunai: data.tunai ?? 0,
        nonTunai: data.nontunai ?? 0,
        pajak: data.pajak || 0,
        diskon: data.diskon || 0,
        biayaLainnya: data.biaya_lainnya ?? 0,
        biayaPengeluaran: data.biayapengeluaran ?? 0,
        saldoKas: data.saldo_kas ?? 0,
        catatan: data.catatan || catatanTutupKasir || '',
        produkterjual: data.produkterjual || [],
      };

      const escposData = generateCloseCashierReceiptESC_POS(closeReceiptData);

      // Jika tidak ada printer WebUSB atau mode sistem, fallback ke print browser
      if (!printer.isConnected || printer.type === 'system') {
        const formatAmount = (val: number) =>
          (val || 0).toLocaleString('id-ID');

        const pengeluaranHTML =
          pengeluaranList.length > 0
            ? `
              <div class="receipt-section">
                <div class="section-title">Pengeluaran</div>
                ${pengeluaranList
                  .map(
                    (p: PengeluaranItem) => `
                      <div class="receipt-row">
                        <span>${p.nama || 'Pengeluaran'}</span>
                        <span>Rp ${formatAmount(p.nominal || 0)}</span>
                      </div>
                      ${p.catatan ? `<div class="note-row">${p.catatan}</div>` : ''}
                    `
                  )
                  .join('')}
              </div>
            `
            : '';

        const produkHTML =
          closeReceiptData.produkterjual && closeReceiptData.produkterjual.length > 0
            ? closeReceiptData.produkterjual
                .map(
                  (kat) => `
              <div class="produk-kat">
                <div class="kat-title">${kat.nama_kategori || 'Kategori'}</div>
                ${(kat.produk || [])
                  .map(
                    (p) => `
                      <div class="receipt-row">
                        <span>${p.nama || 'Produk'} (${p.jumlah_terbeli ?? p.qty ?? 0}x)</span>
                        <span>Rp ${formatAmount((p.jumlah_terbeli ?? p.qty ?? 0) * (p.harga || 0))}</span>
                      </div>
                    `
                  )
                  .join('')}
              </div>
            `
                )
                .join('')
            : '';

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) {
          alert('Popup diblokir. Izinkan popup untuk mencetak struk.');
          return;
        }

        const styles = `
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; }
            .receipt-container { width: 280px; margin: 0 auto; }
            .receipt-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .receipt-header h1 { font-size: 16px; margin: 0; font-weight: bold; }
            .receipt-section { margin: 8px 0; }
            .receipt-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
            .receipt-row.total { border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px; font-weight: bold; font-size: 13px; }
            .receipt-footer { text-align: center; margin-top: 16px; border-top: 1px dashed #000; padding-top: 8px; font-size: 10px; }
            .kat-title { font-weight: 700; margin: 4px 0; }
            .produk-kat { margin-top: 6px; }
        </style>
      `;

      const content = `
        ${styles}
        <div class="receipt-container">
          <div class="receipt-header">
            <h1>RINGKASAN TUTUP KASIR</h1>
            <p>${new Date().toLocaleString('id-ID')}</p>
              <p>${storeName}</p>
              ${address ? `<p>${address}</p>` : ''}
              ${phone ? `<p>${phone}</p>` : ''}
          </div>
          
          <div class="receipt-section">
            <div class="receipt-row">
              <span>Waktu Buka:</span>
                <span>${closeReceiptData.waktuBuka}</span>
            </div>
            <div class="receipt-row">
              <span>Waktu Tutup:</span>
                <span>${closeReceiptData.waktuTutup}</span>
            </div>
          </div>
          
          <div class="receipt-section">
            <div class="receipt-row">
              <span>Total Transaksi:</span>
                <span>${closeReceiptData.totalTransaksi}</span>
            </div>
              <div class="receipt-row">
                <span>Total Pendapatan:</span>
                <span>Rp ${formatAmount(totalPendapatan ?? closeReceiptData.totalPenjualan)}</span>
              </div>
              ${closeReceiptData.tunai > 0 ? `<div class="receipt-row"><span>Tunai:</span><span>Rp ${formatAmount(closeReceiptData.tunai)}</span></div>` : ''}
              ${closeReceiptData.nonTunai > 0 ? `<div class="receipt-row"><span>Non Tunai:</span><span>Rp ${formatAmount(closeReceiptData.nonTunai)}</span></div>` : ''}
              ${closeReceiptData.diskon > 0 ? `<div class="receipt-row"><span>Diskon:</span><span>-Rp ${formatAmount(closeReceiptData.diskon)}</span></div>` : ''}
              ${closeReceiptData.pajak > 0 ? `<div class="receipt-row"><span>Pajak:</span><span>Rp ${formatAmount(closeReceiptData.pajak)}</span></div>` : ''}
              ${closeReceiptData.biayaPengeluaran > 0 ? `<div class="receipt-row"><span>Biaya Pengeluaran:</span><span>Rp ${formatAmount(closeReceiptData.biayaPengeluaran)}</span></div>` : ''}
              ${closeReceiptData.biayaLainnya > 0 ? `<div class="receipt-row"><span>Biaya Lainnya:</span><span>Rp ${formatAmount(closeReceiptData.biayaLainnya)}</span></div>` : ''}
            <div class="receipt-row">
              <span>Saldo Kas:</span>
                <span>Rp ${formatAmount(closeReceiptData.saldoKas)}</span>
            </div>
            <div class="receipt-row total">
                <span>TOTAL (Bersih):</span>
                <span>Rp ${formatAmount(data.total ?? closeReceiptData.totalPenjualan)}</span>
            </div>
          </div>
          
            ${pengeluaranHTML}
            ${produkHTML ? `<div class="receipt-section">${produkHTML}</div>` : ''}
            ${closeReceiptData.catatan ? `<div class="receipt-section"><div class="receipt-row"><span>Catatan:</span><span>${closeReceiptData.catatan}</span></div></div>` : ''}
          
          <div class="receipt-footer">
              <p>${footerNote || 'Terima kasih'}</p>
          </div>
        </div>
      `;

      printWindow.document.open();
      printWindow.document.write(content);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
        return;
      }

      if (printer.type === 'usb') {
        let device: USBDevice | null = (printer as unknown as { usbDevice?: USBDevice }).usbDevice || null;
        if (!device) {
          device = await reconnectUSBDevice();
        }
        if (!device) {
          console.error('Printer USB belum terhubung, fallback ke window.print');
          window.print();
          return;
        }
        await printToPrinter('usb', device, escposData);
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Print error:', err);
      alert('Gagal mencetak struk');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  // Untuk sementara, diskon dan pajak tidak digunakan di POS, set ke 0
  const discount = 0;
  const tax = 0;
  const total = subtotal;
  const parsedPaidAmount = parseCurrencyInput(paidAmount);
  const change = Math.max(0, parsedPaidAmount - total);

  // Ringkasan tutup kasir turunan (menghindari perhitungan berulang di JSX)
  const totalPendapatanTutup =
    tutupKasirData?.total_pendapatan ??
    tutupKasirData?.total_pendapatan_selesai ??
    tutupKasirData?.total ??
    0;
  const pengeluaranListTutup =
    tutupKasirData && Array.isArray(tutupKasirData.pengeluaran)
      ? tutupKasirData.pengeluaran
      : [];
  const totalPengeluaranTutup =
    typeof tutupKasirData?.biayapengeluaran === 'number'
      ? tutupKasirData.biayapengeluaran
      : pengeluaranListTutup.reduce(
          (sum, p) => sum + (Number((p as any)?.nominal) || 0),
          0
        );

  // Ambil bukakas_id langsung - tidak perlu cache karena getBukakasId() sudah membaca dari localStorage yang cepat
  const activeBukakasId = getBukakasId();

  // Gunakan products yang sudah di-update dari API search (untuk memastikan data terbaru)
  // Ketika ada searchQuery, products sudah di-update dari API search dengan stok terbaru
  // Ketika tidak ada searchQuery, products sama dengan originalProducts
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.sku && product.sku.toLowerCase().includes(query)) ||
        (product.barcode && product.barcode.toLowerCase().includes(query));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Memoize products dengan stock > 0 untuk menghindari filter berulang
  const availableProducts = useMemo(() => {
    return filteredProducts.filter((p) => p.stock > 0);
  }, [filteredProducts]);

  // Saat tekan Enter setelah scan barcode, coba langsung tambah ke keranjang
  const handleScanEnter = useCallback(() => {
    const query = searchQuery.trim();
    if (!query) return;

    // Jika hanya satu hasil yang cocok, langsung masukkan ke keranjang
    if (availableProducts.length === 1) {
      handleProductClick(availableProducts[0]);
      setSearchQuery('');
      focusSearchInput();
      return;
    }

    // Jika banyak hasil, coba cari yang namanya persis sama dengan input
    const exactMatch = availableProducts.find(
      (p) => p.name.toLowerCase() === query.toLowerCase()
    );
    if (exactMatch) {
      handleProductClick(exactMatch);
      setSearchQuery('');
      focusSearchInput();
    }
  }, [searchQuery, availableProducts, handleProductClick, focusSearchInput]);

  // Otomatis masukkan ke keranjang untuk pola scan barcode (angka) saat hanya ada 1 hasil
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) return;

    // Hanya jalankan auto-scan untuk input numerik yang cukup panjang (menghindari ketik nama biasa)
    const isNumericBarcode = /^[0-9]{6,}$/.test(query);
    if (!isNumericBarcode) return;

    if (availableProducts.length !== 1) return;

    handleProductClick(availableProducts[0]);
    setSearchQuery('');
    focusSearchInput();
  }, [searchQuery, availableProducts, handleProductClick, focusSearchInput]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 relative">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0 2xl:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden bg-emerald-500 mx-3 mt-3 rounded-xl shadow-lg px-3 py-3 flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Scan / cari produk lalu gunakan scanner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleScanEnter();
                }
              }}
              ref={mobileSearchRef}
              className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
              >
                <i className="ri-close-line text-lg text-gray-400"></i>
              </button>
            )}
            {searchQuery && availableProducts.length > 0 && (
              <div className="absolute z-30 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {availableProducts.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      handleProductClick(p);
                      setSearchQuery('');
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-emerald-50 cursor-pointer flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {p.placeholderText}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-[10px] text-gray-500">Stok: {p.stock}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 font-semibold whitespace-nowrap">
                      Rp {p.price.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowThemeModal(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            title="Ubah Tema"
          >
            <i className="ri-palette-line text-xl text-white"></i>
          </button>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <i className="ri-shopping-cart-2-line text-xl text-gray-700"></i>
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Tablet & Desktop Header */}
        <div className="hidden md:block bg-emerald-500 mx-3 md:mx-3 lg:mx-6 mt-3 md:mt-3 lg:mt-6 rounded-xl md:rounded-2xl shadow-lg px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Fokus di sini lalu scan barcode / ketik nama produk"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScanEnter();
                  }
                }}
                ref={desktopSearchRef}
                className="w-full pl-3 md:pl-4 pr-10 md:pr-12 py-2 md:py-2.5 lg:py-3 border border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
                >
                  <i className="ri-close-line text-lg md:text-xl text-gray-400"></i>
                </button>
              )}
              {searchQuery && availableProducts.length > 0 && (
                <div className="absolute z-30 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                  {availableProducts.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        handleProductClick(p);
                      setSearchQuery('');
                      }}
                      className="w-full px-3 md:px-4 py-2 text-left text-[11px] md:text-xs text-gray-700 hover:bg-emerald-50 cursor-pointer flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                            {p.placeholderText}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-[10px] text-gray-500">Stok: {p.stock}</p>
                      </div>
                      <span className="text-[10px] md:text-[11px] text-gray-600 font-semibold whitespace-nowrap">
                        Rp {p.price.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowThemeModal(true)}
                className="hidden lg:flex items-center justify-center w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                title="Ubah Tema"
              >
                <i className="ri-palette-line text-lg md:text-xl text-white"></i>
              </button>
              <button className={`hidden lg:flex items-center justify-center w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-lg ${
                printer.isConnected 
                  ? 'bg-white/20 hover:bg-white/30' 
                  : 'bg-red-500/20 hover:bg-red-500/30'
              } transition-colors`}>
                <i className={`ri-printer-line text-lg md:text-xl ${
                  printer.isConnected ? 'text-white' : 'text-red-600'
                }`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="flex-1 overflow-y-auto px-3 md:px-3 lg:px-6 py-3 md:py-3.25 lg:py-6 pb-20 md:pb-5 space-y-3 md:space-y-3.25 lg:space-y-6">
          {/* Category Card */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-2.75 lg:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-3.5 lg:mb-4">
            <h2 className="text-sm md:text-sm lg:text-lg font-semibold text-gray-900">Choose Category</h2>
              <button className="w-7 h-7 md:w-7 md:h-7 flex items-center justify-center hover:bg-gray-100 rounded md:block hidden">
                <i className="ri-more-fill text-lg md:text-lg text-gray-600"></i>
              </button>
            </div>

            <div className="flex gap-2 md:gap-2.5 lg:gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {loadingCategories && (
                <span className="text-xs text-gray-500">Memuat kategori...</span>
              )}
              {errorCategories && !loadingCategories && (
                <span className="text-xs text-red-500">{errorCategories}</span>
              )}
              {!loadingCategories && !errorCategories && categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : cat.name)}
                  title={cat.name}
                  className={`flex items-center justify-center min-w-[85px] md:min-w-[95px] lg:min-w-[110px] px-2.5 md:px-3 lg:px-4 py-2 md:py-2 lg:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                    (cat.id === 'all' && selectedCategory === 'all') || selectedCategory === cat.name
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span className="max-w-[90px] md:max-w-[110px] lg:max-w-[140px] truncate">
                  {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Products Card */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-3.5 lg:mb-4">
              <h3 className="text-xs md:text-xs lg:text-base font-semibold text-gray-900">Product</h3>
              <button className="text-xs md:text-xs text-gray-600 hover:text-gray-900">Sort by A-Z</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-2.25 lg:gap-4">
            {loadingProducts && (
              <div className="col-span-2 text-center text-gray-500 text-sm py-4">
                Memuat produk...
              </div>
            )}
            {errorProducts && !loadingProducts && (
              <div className="col-span-2 text-center text-red-500 text-sm py-4">
                {errorProducts}
              </div>
            )}
            {!loadingProducts && !errorProducts && filteredProducts.length === 0 && (
              <div className="col-span-2 text-center text-gray-500 text-sm py-4">
                Tidak ada produk.
              </div>
            )}
            {!loadingProducts && !errorProducts && filteredProducts.map((product) => {
              const isDisabled = product.stock <= 0 || !activeBukakasId;
              return (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                disabled={isDisabled}
                className={`bg-white rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 text-left active:scale-[0.98] group ${
                  !isDisabled
                    ? 'hover:shadow-xl hover:border-emerald-300 cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex gap-3 md:gap-2.25 lg:gap-4 p-3 md:p-2.75 lg:p-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 md:w-18 md:h-18 lg:w-28 lg:h-28 rounded-lg md:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center shadow-sm border border-gray-200/50">
                      {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                      ) : (
                        <span className="text-sm md:text-base lg:text-lg font-bold text-gray-600">
                          {product.placeholderText}
                        </span>
                      )}
                    </div>
                    {/* Badge Custom di atas kiri */}
                    {product.isCustom && (
                      <div className="absolute -top-1 -left-1 z-10">
                        <span className="px-1.5 md:px-2 py-0.5 text-[9px] md:text-[9.5px] lg:text-[10px] font-bold rounded-full shadow-md bg-blue-500 text-white">
                          C
                        </span>
                      </div>
                    )}
                    {/* Badge Stok di atas kanan */}
                    <div className="absolute -top-1 -right-1 z-10">
                      <span
                        className={`px-1.5 md:px-2 py-0.5 text-[9px] md:text-[9.5px] lg:text-[10px] font-bold rounded-full shadow-md ${
                          product.stock > 0
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-300 text-gray-700'
                        }`}
                      >
                        {product.stock > 0 ? product.unit : 'Habis'}
                      </span>
                    </div>
                  </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1.1 md:mb-0.6 lg:mb-2 text-sm md:text-[11px] lg:text-base truncate group-hover:text-emerald-600 transition-colors">
                        {product.name}
                      </h4>
                      <div className="flex items-baseline gap-2 md:gap-1 lg:gap-2 mb-1.1 md:mb-0.9 lg:mb-2">
                        <p className="text-base md:text-[10px] lg:text-xl font-bold text-gray-900">Rp {product.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-1.5">
                      {product.stock > 0 ? (
                        <>
                          <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <span className="text-[10px] md:text-[11px] lg:text-xs text-gray-500 font-medium">
                            Stok {product.stock}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full"></span>
                          <span className="text-[10px] md:text-[11px] lg:text-xs text-red-500 font-medium">
                            Stok habis
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
              );
            })}
            </div>
            {/* Infinite scroll sentinel dan loading indicator */}
            {!loadingProducts && !errorProducts && filteredProducts.length > 0 && (
              <div ref={loadMoreRef} className="col-span-2 py-4">
                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Memuat produk...</span>
          </div>
                )}
                {!hasMore && !isLoadingMore && (
                  <div className="text-center text-gray-400 text-sm py-2">
                    Semua produk telah dimuat
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tablet & Desktop Cart Sidebar */}
      <div className="hidden md:flex w-[190px] lg:w-[320px] bg-white border-l flex-col">
        <div className="p-2 md:p-2.5 lg:p-4 border-b">
          <div className="flex items-center justify-between mb-1.5 md:mb-2.5 lg:mb-3.5">
            <h2 className="text-[11px] md:text-sm lg:text-xl font-bold text-gray-900">Bills</h2>
          </div>
          
          <div className="relative">
            {selectedCashier && (
            <button
              onClick={() => setShowCashierDropdown(!showCashierDropdown)}
              className="w-full flex items-center gap-2 md:gap-2.5 lg:gap-3 p-2 md:p-2.5 lg:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm lg:text-base font-semibold flex-shrink-0">
                {selectedCashier.initials}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900 text-[10px] md:text-xs lg:text-sm">{selectedCashier.name}</p>
                  <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-500">{selectedCashier.level}</p>
              </div>
              <i className={`ri-arrow-down-s-line text-sm md:text-base lg:text-lg text-gray-600 transition-transform ${showCashierDropdown ? 'rotate-180' : ''}`}></i>
            </button>
            )}

            {showCashierDropdown && selectedCashier && (
              <div className="absolute top-full left-0 right-0 mt-1.5 md:mt-2 bg-white border-2 border-gray-200 rounded-lg md:rounded-xl shadow-xl z-20">
                <div className="w-full flex items-center gap-2 md:gap-2.5 lg:gap-3 px-2.5 md:px-3 lg:px-4 py-2 md:py-2.5 lg:py-3">
                    <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm lg:text-base font-semibold flex-shrink-0">
                    {selectedCashier.initials}
                    </div>
                    <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 text-[10px] md:text-xs lg:text-sm">{selectedCashier.name}</p>
                    <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-500">{selectedCashier.level}</p>
                    </div>
                      <i className="ri-check-line text-emerald-600 text-sm md:text-base lg:text-lg"></i>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 md:p-2.25 lg:p-5">
          <div className="flex items-center justify-between mb-1.5 md:mb-2 lg:mb-3.5">
            <div className="flex items-center gap-1.5 md:gap-1.75">
              <span className="text-[10px] md:text-[10px] lg:text-sm font-semibold text-gray-900">Product Added</span>
              <span className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-5 lg:h-5 bg-emerald-500 text-white text-[7px] md:text-[8px] lg:text-[11px] font-bold rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            </div>
            {cartItems.length > 0 && (
              <button onClick={clearAll} className="text-[10px] md:text-[10px] lg:text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                <i className="ri-close-line text-xs"></i>
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-1.25 md:space-y-1.5 lg:space-y-2.5">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-2 md:gap-2.25 lg:gap-3 p-2 md:p-2.25 lg:p-3 bg-gray-50 rounded-lg">
                <div className="w-11 h-11 md:w-12 md:h-12 lg:w-16 lg:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
                  {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-600">
                      {getPlaceholderText(item.name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-gray-900 text-[10px] md:text-[10px] lg:text-sm mb-0.25 md:mb-0.5 lg:mb-1 line-clamp-2">
                      {item.name}
                    </h4>
                    <span className="text-[10px] md:text-[11px] lg:text-sm font-semibold text-gray-900 whitespace-nowrap">
                      Rp {item.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[9px] md:text-[9.5px] lg:text-xs text-gray-500 mb-0.25 md:mb-0.5 lg:mb-1.25">{item.unit}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 md:w-6 md:h-6 lg:w-7 lg:h-7 flex items-center justify-center hover:bg-gray-100 active:scale-95 text-gray-700 transition-colors"
                      >
                        <i className="ri-subtract-line text-xs md:text-xs lg:text-sm"></i>
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => setQuantityValue(item.id, parseInt(e.target.value || '0', 10))}
                        className="w-10 md:w-10 lg:w-12 h-6 md:h-6 lg:h-7 text-center text-[10px] md:text-[11px] lg:text-sm font-semibold border-0 border-x border-gray-200 focus:ring-0 focus:outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 md:w-6 md:h-6 lg:w-7 lg:h-7 flex items-center justify-center text-white btn-orange-gradient active:scale-95 transition-colors"
                      >
                        <i className="ri-add-line text-xs md:text-xs lg:text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t p-2 md:p-2.1 lg:p-5 space-y-2 md:space-y-2.1 lg:space-y-4 sticky bottom-0 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-[11px] md:text-[12px] lg:text-lg font-bold text-gray-900">Total</span>
            <span className="text-[11px] md:text-[12px] lg:text-lg font-bold text-gray-900">Rp {total.toLocaleString()}</span>
          </div>

          <button
            className="w-full py-2 md:py-2.4 lg:py-4 bg-emerald-500 text-white font-semibold rounded-lg md:rounded-xl hover:bg-emerald-600 transition-colors whitespace-nowrap text-[10px] md:text-[12px] lg:text-base"
            onClick={() => {
              setShowPayModal(true);
              setPayMethod('cash');
              setIsDebt(false);
              setJatuhTempo('');
              setManualCustomerName('');
              setManualCustomerPhone('');
              setPaidAmount('0');
            }}
          >
            Bayar
          </button>
        </div>
      </div>

      {/* Mobile Cart Bottom Sheet */}
      {showCart && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Bills</h2>
                <span className="w-5 h-5 bg-emerald-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <i className="ri-close-line text-xl text-gray-600"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-900">Product Added</span>
                {cartItems.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                    <i className="ri-close-line"></i>
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
                      {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-gray-600">
                          {getPlaceholderText(item.name)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.name}</h4>
                      <p className="text-xs text-gray-500 mb-2">{item.unit}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 active:scale-95 text-gray-700 transition-colors"
                          >
                            <i className="ri-subtract-line text-sm"></i>
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => setQuantityValue(item.id, parseInt(e.target.value || '0', 10))}
                            className="w-12 h-8 text-center text-sm font-semibold border-0 border-x border-gray-200 focus:ring-0 focus:outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-white btn-orange-gradient active:scale-95 transition-colors"
                          >
                            <i className="ri-add-line text-sm"></i>
                          </button>
                        </div>
                        <p className="text-sm font-bold text-gray-900">Rp {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900">Rp {total.toLocaleString()}</span>
              </div>

              <button
                className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
                onClick={() => {
                  setShowCart(false);
                  setShowPayModal(true);
                  setPayMethod('cash');
                  setIsDebt(false);
                  setJatuhTempo('');
                  setManualCustomerName('');
                  setManualCustomerPhone('');
                  setPaidAmount(formatCurrencyInput(total));
                }}
              >
                Bayar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Pay Button */}
      {cartItems.length > 0 && !showSidebar && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-emerald-500 text-white font-bold rounded-2xl py-4 px-6 shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 flex items-center justify-between active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <i className="ri-shopping-cart-2-fill text-2xl"></i>
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs text-white/80 font-medium">Total</p>
                <p className="text-lg font-bold">Rp {total.toLocaleString()}</p>
              </div>
            </div>
            <span className="text-base font-semibold">Bayar</span>
          </button>
        </div>
      )}

      {showAddModal && selectedProduct && (
        <AddToCartModal
          product={selectedProduct}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddToCart}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && transactionData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              {/* Success indicator */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <i className="ri-checkbox-circle-fill text-4xl text-green-500"></i>
                </div>
              </div>
              
              {/* Title */}
              <h2 className="text-lg font-bold text-gray-900 text-center mb-1">
                Transaksi Berhasil!
              </h2>
              
              {/* Transaction ID */}
              <p className="text-xs text-gray-600 text-center mb-4">
                ID: {transactionData.id}
              </p>
              
              {/* Transaction Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Total Tagihan</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(transactionData.total)}
                    </span>
                </div>
                
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Pembayaran</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(transactionData.paid)}
                    </span>
                </div>
                
                  <div className="border-t border-gray-200 pt-2 mt-2"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Kembalian</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(transactionData.isDebt ? 0 : transactionData.change)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
              <div className="flex gap-3">
              <button
                onClick={handlePrintReceipt}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-printer-line text-lg"></i>
                Cetak Struk
              </button>
              <button
                onClick={handleCloseSuccessModal}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-check-line text-lg"></i>
                Selesai
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4 lg:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <div className="p-3 md:p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">Pembayaran</h3>
                <p className="text-[10px] md:text-xs lg:text-sm text-gray-500">Selesaikan transaksi</p>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer active:scale-95"
              >
                <span className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
              </button>
            </div>

            <div className="p-3 md:p-4 lg:p-6 space-y-3 md:space-y-4 lg:space-y-6">
              <div className="bg-gray-50 rounded-lg md:rounded-xl p-2.5 md:p-3 lg:p-4 flex items-center justify-between">
                <span className="text-[10px] md:text-xs lg:text-sm font-medium text-gray-600">Total Bayar</span>
                <span className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Rp {total.toLocaleString()}</span>
              </div>

              <div className="flex gap-2 md:gap-2.5 lg:gap-3">
                {(['cash', 'digital', 'qris'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setPayMethod(m);
                      if (m === 'cash') {
                        setPaidAmount('0');
                      } else {
                        setPaidAmount(formatCurrencyInput(total));
                        if (m === 'digital') {
                          setDigitalMethod('OVO');
                        }
                      }
                    }}
                    className={`flex-1 py-2 md:py-2.5 lg:py-3 rounded-lg font-semibold text-[10px] md:text-xs lg:text-sm border transition-all active:scale-95 ${
                      payMethod === m
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {m === 'cash' ? 'Cash' : m === 'digital' ? 'Digital' : 'QRIS'}
                  </button>
                ))}
              </div>

              {payMethod === 'cash' && (
                <div className="space-y-2.5 md:space-y-3 lg:space-y-4">
                  <p className="text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700">Nominal Cepat</p>
                  <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                    {(() => {
                      const allAmounts = [5000, 10000, 20000, 50000, 100000];
                      const quickAmounts = allAmounts.filter((amount) => amount > total);
                      const displayAmounts = quickAmounts.length > 0 ? quickAmounts : allAmounts;
                      
                      return displayAmounts.map((nominal) => {
                        const currentPaid = parseCurrencyInput(paidAmount);
                        const isSelected = currentPaid === nominal;
                        return (
                      <button
                        key={nominal}
                            onClick={() => setPaidAmount(formatCurrencyInput(nominal))}
                            className={`px-1.5 md:px-2 lg:px-4 py-2 md:py-2.5 lg:py-3 rounded-lg text-[10px] md:text-xs lg:text-sm font-semibold active:scale-95 transition-all ${
                              isSelected
                                ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600'
                                : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent text-gray-800'
                            }`}
                          >
                            Rp {nominal.toLocaleString('id-ID')}
                      </button>
                        );
                      });
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Jumlah Dibayar</label>
                      <input
                        type="text"
                        value={paidAmount}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^\d]/g, '');
                          if (cleaned === '') {
                            setPaidAmount('0');
                          } else {
                            setPaidAmount(formatCurrencyInput(parseInt(cleaned, 10)));
                          }
                        }}
                        className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Kembalian</label>
                      <div className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[10px] md:text-xs lg:text-sm font-bold text-gray-900">
                        {formatCurrency(change)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'digital' && (
                <div className="space-y-2.5 md:space-y-3 lg:space-y-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <p className="text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700">Pilih metode digital</p>
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2 lg:gap-3">
                      {['OVO', 'DANA', 'GoPay', 'LinkAja', 'm-Banking', 'Transfer Bank'].map((method) => (
                        <button
                          key={method}
                          onClick={() => setDigitalMethod(method)}
                          className={`w-full py-2 md:py-2.5 lg:py-3 rounded-lg text-[10px] md:text-xs lg:text-sm font-semibold border transition-all active:scale-95 ${
                            digitalMethod === method
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Jumlah Dibayar</label>
                      <input
                        type="text"
                        value={paidAmount}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^\d]/g, '');
                          if (cleaned === '') {
                            setPaidAmount('0');
                          } else {
                            setPaidAmount(formatCurrencyInput(parseInt(cleaned, 10)));
                          }
                        }}
                        className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Kembalian</label>
                      <div className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[10px] md:text-xs lg:text-sm font-bold text-gray-900">
                        {formatCurrency(Math.max(0, parseCurrencyInput(paidAmount) - total))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'qris' && (
                <div className="space-y-2.5 md:space-y-3">
                  <div className="bg-gray-50 rounded-lg p-2.5 md:p-3">
                  <p className="text-[10px] md:text-xs lg:text-sm text-gray-600">Pembayaran non-tunai akan otomatis disamakan dengan total.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Jumlah Dibayar</label>
                      <input
                        type="text"
                        value={paidAmount}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^\d]/g, '');
                          if (cleaned === '') {
                            setPaidAmount('0');
                          } else {
                            setPaidAmount(formatCurrencyInput(parseInt(cleaned, 10)));
                          }
                        }}
                        className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Kembalian</label>
                      <div className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[10px] md:text-xs lg:text-sm font-bold text-gray-900">
                        {formatCurrency(Math.max(0, parseCurrencyInput(paidAmount) - total))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2.5 md:space-y-3">
                <label className="flex items-center gap-2.5 md:gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDebt}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsDebt(checked);
                      if (!checked) setJatuhTempo('');
                    }}
                    className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-[10px] md:text-xs lg:text-sm text-gray-800 font-medium">Tandai sebagai piutang</span>
                </label>
              </div>

              <div className="space-y-2.5 md:space-y-3">
                <div>
                    <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Nama Pelanggan</label>
                    <input
                      type="text"
                      value={manualCustomerName}
                      onChange={(e) => setManualCustomerName(e.target.value)}
                      placeholder="Masukkan nama pelanggan"
                    className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                <div>
                    <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Nomor Telepon (opsional)</label>
                    <input
                      type="tel"
                      value={manualCustomerPhone}
                      onChange={(e) => setManualCustomerPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                    className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                {isDebt && (
                  <div>
                    <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                      Jatuh Tempo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={jatuhTempo}
                      onChange={(e) => setJatuhTempo(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                )}
              </div>

              {transactionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{transactionError}</p>
                </div>
              )}

              <div className="flex gap-2 md:gap-2.5 lg:gap-3 pt-2">
                <button
                  className="flex-1 py-2 md:py-2.5 lg:py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer text-xs md:text-sm lg:text-base active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    setShowPayModal(false);
                    setTransactionError(null);
                  }}
                  disabled={processingTransaction}
                >
                  Batal
                </button>
                <button
                  className="flex-1 py-2 md:py-2.5 lg:py-3 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors cursor-pointer text-xs md:text-sm lg:text-base active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={handleProcessPayment}
                  disabled={processingTransaction}
                >
                  {processingTransaction ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    'Proses Pembayaran'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buka Kasir */}
      {showBukaKasirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Buka Kasir</h2>
            <p className="text-sm text-gray-600">
              Masukkan kas awal / uang kembalian sebelum mulai menerima pesanan.
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Kas Awal / Uang Kembalian
              </label>
              <input
                type="number"
                value={saldoAwalInput}
                onChange={(e) => setSaldoAwalInput(e.target.value)}
                placeholder="Contoh: 10000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Catatan (opsional)
              </label>
              <textarea
                value={catatanBuka}
                onChange={(e) => setCatatanBuka(e.target.value)}
                placeholder="Contoh: Shift pagi"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[72px]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBukaKasirModal(false)}
                disabled={loadingKasir}
                className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loadingKasir}
                onClick={async () => {
                  const saldo = Number(saldoAwalInput || '0');
                  if (Number.isNaN(saldo) || saldo < 0) {
                    return;
                  }
                  try {
                    setLoadingKasir(true);
                    await bukaKasirApi({
                      saldoAwal: saldo,
                      catatan: catatanBuka,
                      permanen: false,
                    });
                    setShowBukaKasirModal(false);
                  } catch (e) {
                    console.error('Gagal buka kasir:', e);
                  } finally {
                    setLoadingKasir(false);
                  }
                }}
                className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60"
              >
                {loadingKasir ? 'Menyimpan...' : 'Simpan & Buka Kasir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* (Opsional) Modal Ringkasan Tutup Kasir jika hari berganti */}
      {showRingkasanTutup && tutupKasirData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowRingkasanTutup(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header dengan gradient */}
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 px-6 py-6 text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <i className="ri-bar-chart-box-line text-3xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Ringkasan Penjualan</h2>
                    <p className="text-emerald-50 text-sm">Hari sebelumnya</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRingkasanTutup(false)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-gray-50 to-white">
              {/* Info Waktu */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <i className="ri-time-line text-gray-400"></i>
                    Waktu Buka
                  </span>
                  <span className="font-medium text-gray-900">{tutupKasirData.waktu_buka || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <i className="ri-time-line text-gray-400"></i>
                    Waktu Sekarang
                  </span>
                  <span className="font-medium text-gray-900">{tutupKasirData.waktu_sekarang || '-'}</span>
                </div>
              </div>

              {/* Grid utama agar tampilan lebih simetris */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* Kolom kiri: statistik & ringkasan angka */}
                <div className="space-y-4">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Total Transaksi */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                          <i className="ri-receipt-line text-white text-lg"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-700">Total Transaksi</p>
                          <p className="text-xl font-bold text-blue-900">{tutupKasirData.total_transaksi}</p>
                        </div>
                      </div>
                    </div>

                    {/* Total Pendapatan */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 border border-emerald-200/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                          <i className="ri-money-dollar-circle-line text-white text-lg"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-emerald-700">Total Pendapatan</p>
                          <p className="text-lg font-bold text-emerald-900">Rp {totalPendapatanTutup.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detail Breakdown */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <i className="ri-file-list-3-line text-emerald-600"></i>
                      Ringkasan Transaksi
                    </h3>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Total Transaksi</span>
                        <span className="text-sm font-semibold text-gray-900">{tutupKasirData.total_transaksi}</span>
                      </div>
                      
                      {tutupKasirData.tunai > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <i className="ri-money-cny-circle-line text-green-500"></i>
                            Tunai
                          </span>
                          <span className="text-sm font-semibold text-green-600">
                            Rp {tutupKasirData.tunai.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                      
                      {tutupKasirData.nontunai > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <i className="ri-bank-card-line text-blue-500"></i>
                            Non Tunai
                          </span>
                          <span className="text-sm font-semibold text-blue-600">
                            Rp {tutupKasirData.nontunai.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                      
                      {tutupKasirData.diskon > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <i className="ri-price-tag-3-line text-red-500"></i>
                            Diskon
                          </span>
                          <span className="text-sm font-semibold text-red-600">
                            -Rp {tutupKasirData.diskon.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                      
                      {tutupKasirData.pajak > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <i className="ri-file-paper-2-line text-amber-500"></i>
                            Pajak
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            Rp {tutupKasirData.pajak.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                      
                      {(totalPengeluaranTutup > 0 || pengeluaranListTutup.length > 0) && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <i className="ri-wallet-3-line text-purple-500"></i>
                            Biaya Pengeluaran
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            Rp {totalPengeluaranTutup.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                      
                      {tutupKasirData.biaya_lainnya > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <i className="ri-wallet-3-line text-purple-500"></i>
                            Biaya Lainnya
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            Rp {tutupKasirData.biaya_lainnya.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <i className="ri-safe-line text-amber-500"></i>
                          Saldo Kas
                        </span>
                        <span className="text-sm font-semibold text-amber-600">
                          Rp {tutupKasirData.saldo_kas.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Grand Total */}
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <i className="ri-wallet-line text-emerald-600"></i>
                          TOTAL
                        </span>
                        <span className="text-xl font-bold text-emerald-600">
                          Rp {tutupKasirData.total.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kolom kanan: produk & catatan, dibuat rapi dan simetris */}
                <div className="space-y-4">
                  {/* Pengeluaran (detail) */}
                  {pengeluaranListTutup.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <i className="ri-wallet-3-line text-purple-600"></i>
                        Pengeluaran
                      </h3>
                      <div className="space-y-3">
                        {pengeluaranListTutup.map((p, idx) => {
                          const nominal = Number((p as any)?.nominal) || 0;
                          const nama = (p as any)?.nama || 'Pengeluaran';
                          const catatan = (p as any)?.catatan;
                          return (
                            <div key={idx} className="border border-gray-100 rounded-xl px-3 py-2.5 space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-800">{nama}</span>
                                <span className="font-semibold text-gray-900">Rp {nominal.toLocaleString('id-ID')}</span>
                              </div>
                              {catatan && (
                                <p className="text-xs text-gray-600 leading-snug">Catatan: {catatan}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Produk Terjual */}
                  {tutupKasirData.produkterjual && Array.isArray(tutupKasirData.produkterjual) && tutupKasirData.produkterjual.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <i className="ri-shopping-bag-line text-emerald-600"></i>
                        Produk Terjual
                      </h3>
                      <div className="space-y-4">
                        {tutupKasirData.produkterjual?.map((kategori, idx: number) => (
                          <div key={idx} className="space-y-2">
                            <p className="text-xs font-semibold text-gray-700">{kategori.nama_kategori || 'Lainnya'}</p>
                            {kategori.produk && Array.isArray(kategori.produk) && kategori.produk.map((produk, pIdx: number) => (
                              <div key={pIdx} className="flex items-center justify-between pl-4 text-sm">
                                <span className="text-gray-600">
                                  {produk.nama || 'Produk'} ({produk.jumlah_terbeli || produk.qty || 0}x)
                                </span>
                                <span className="font-medium text-gray-900">
                                  Rp {((produk.harga || 0) * (produk.jumlah_terbeli || produk.qty || 0)).toLocaleString('id-ID')}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Catatan */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <i className="ri-file-text-line text-emerald-600"></i>
                      Catatan
                    </h3>
                    <textarea
                      value={catatanTutupKasir}
                      onChange={(e) => setCatatanTutupKasir(e.target.value)}
                      placeholder="Masukkan catatan (opsional)"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setShowRingkasanTutup(false)}
                  className="flex-1 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <i className="ri-close-line"></i>
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Cetak struk tutup kasir
                    handleCetakStrukTutupKasir(tutupKasirData);
                  }}
                  className="flex-1 py-2.5 text-emerald-600 bg-white border border-emerald-300 rounded-xl font-medium hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <i className="ri-printer-line"></i>
                  Cetak Struk
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (processingTutupKasir) return;
                    
                    try {
                      setProcessingTutupKasir(true);
                      await tutupKasirApi(catatanTutupKasir || 'Tutup kasir dari ringkasan penjualan');
                      setShowRingkasanTutup(false);
                      setShowDialogSetelahTutupKasir(true);
                    } catch (e) {
                      alert(
                        `Gagal tutup kasir: ${
                          e instanceof Error ? e.message : 'Terjadi kesalahan'
                        }`
                      );
                      setProcessingTutupKasir(false);
                    }
                  }}
                  disabled={processingTutupKasir}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingTutupKasir ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line"></i>
                      Tutup Kasir
                    </>
                  )}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Setelah Tutup Kasir */}
      {showDialogSetelahTutupKasir && tutupKasirData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <i className="ri-checkbox-circle-line text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Kasir Berhasil Ditutup</h2>
                  <p className="text-emerald-50 text-sm">Pilih tindakan selanjutnya</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-sm">
                Kasir telah berhasil ditutup. Anda dapat mencetak struk atau logout dari sistem.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  handleCetakStrukTutupKasir(tutupKasirData);
                }}
                className="flex-1 py-2.5 text-emerald-600 bg-white border border-emerald-300 rounded-xl font-medium hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <i className="ri-printer-line"></i>
                Cetak Struk
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDialogSetelahTutupKasir(false);
                  logoutUser();
                  router.push('/login');
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <i className="ri-logout-box-line"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowThemeModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <i className="ri-palette-line text-2xl"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Pilih Tema</h2>
                    <p className="text-emerald-50 text-sm">Ubah warna aplikasi</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowThemeModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-5 gap-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`relative group aspect-square rounded-xl overflow-hidden transition-all ${
                      currentTheme.id === theme.id
                        ? 'ring-4 ring-offset-2 ring-gray-400 scale-105'
                        : 'hover:scale-105 hover:shadow-lg'
                    }`}
                    style={{
                      background: theme.gradient,
                    }}
                    title={theme.name}
                  >
                    {currentTheme.id === theme.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <i className="ri-check-line text-white text-xl"></i>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs font-medium py-1 px-2 text-center">
                      {theme.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
