'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddToCartModal from '@/components/AddToCartModal';
import Sidebar from '@/components/Sidebar';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  unit: string;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
  negotiatedPrice?: number;
  note?: string;
}

export default function POSPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
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

      setIsChecking(false);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/login');
    }
  }, [router]);

  const [selectedCategory, setSelectedCategory] = useState('Minuman');
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Rokok Filter',
      price: 27500,
      originalPrice: 27500,
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
      category: 'Rokok',
      unit: 'Over Hard, Mild',
      quantity: 2,
      subtotal: 55000
    }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'cash' | 'digital' | 'qris'>('cash');
  const [digitalMethod, setDigitalMethod] = useState('OVO');
  const [paidAmount, setPaidAmount] = useState(0);
  const [isDebt, setIsDebt] = useState(false);
  const [addManualCustomer, setAddManualCustomer] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet only
  const [showCashierDropdown, setShowCashierDropdown] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState({ id: '1', name: 'Alfath Aditya', initials: 'AA' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionData, setTransactionData] = useState<{
    id: string;
    total: number;
    paid: number;
    change: number;
  } | null>(null);
  
  const cashiers = [
    { id: '1', name: 'Alfath Aditya', initials: 'AA' },
    { id: '2', name: 'Budi Santoso', initials: 'BS' },
    { id: '3', name: 'Citra Dewi', initials: 'CD' },
    { id: '4', name: 'Dedi Kurniawan', initials: 'DK' },
  ];

  const categories = [
    { id: 'all', name: 'All Product' },
    { id: 'rokok', name: 'Rokok' },
    { id: 'minuman', name: 'Minuman' },
    { id: 'snack', name: 'Snack' },
    { id: 'obat', name: 'Obat-obatan' },
    { id: 'bamboo', name: 'Bamboo' },
    { id: 'sabun', name: 'Sabun' }
  ];

  const products: Product[] = [
    {
      id: '1',
      name: 'Rokok Filter',
      price: 27500,
      originalPrice: 29999,
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
      category: 'Minuman',
      unit: 'Sisa 99'
    },
    {
      id: '2',
      name: 'Rokok Filter',
      price: 27500,
      originalPrice: 29999,
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
      category: 'Minuman',
      unit: 'Sisa 99'
    },
    {
      id: '3',
      name: 'Rokok Filter',
      price: 27500,
      originalPrice: 29999,
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=400&fit=crop',
      category: 'Minuman',
      unit: 'Sisa 99'
    },
    {
      id: '4',
      name: 'Rokok Filter',
      price: 27500,
      originalPrice: 29999,
      image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=400&fit=crop',
      category: 'Minuman',
      unit: 'Sisa 99'
    },
    {
      id: '5',
      name: 'Rokok Filter',
      price: 27500,
      originalPrice: 29999,
      image: 'https://images.unsplash.com/photo-1610873167013-2dd675d30ef4?w=400&h=400&fit=crop',
      category: 'Minuman',
      unit: 'Sisa 99'
    },
    {
      id: '6',
      name: 'Rokok Filter',
      price: 27500,
      originalPrice: 29999,
      image: 'https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?w=400&h=400&fit=crop',
      category: 'Minuman',
      unit: 'Sisa 99'
    },
    {
      id: '7',
      name: 'Rokok Filter',
      price: 27500,
      originalPrice: 29999,
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
      category: 'Minuman',
      unit: 'Sisa 99'
    },
    {
      id: '8',
      name: 'Rokok Filter',
      price: 27500,
      originalPrice: 29999,
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
      category: 'Minuman',
      unit: 'Sisa 99'
    },
    {
      id: '9',
      name: 'Rokok Filter',
      price: 27500,
      originalPrice: 29999,
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
      category: 'Minuman',
      unit: 'Sisa 99'
    },
    {
      id: '10',
      name: 'Rokok Filter',
      price: 27500,
      originalPrice: 29999,
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
      category: 'Minuman',
      unit: 'Sisa 99'
    }
  ];

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowAddModal(true);
  };

  const handleAddToCart = (item: {
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

    const newItem = {
      id: item.productId,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      price: priceToUse,
      originalPrice: productData?.originalPrice ?? item.price,
      image: productData?.image ?? '',
      category: productData?.category ?? '',
      negotiatedPrice: item.negotiatedPrice,
      note: item.note,
      subtotal: priceToUse * item.quantity,
    };

    const existingItem = cartItems.find((c) => c.id === newItem.id);

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
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, subtotal: newQty * item.price };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const setQuantityValue = (id: string, value: number) => {
    const qty = Math.max(1, value || 1);
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: qty, subtotal: qty * item.price };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setCartItems([]);
  };

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

  const handleProcessPayment = () => {
    const methodLabel = payMethod === 'digital' ? digitalMethod : payMethod;

    if (isDebt) {
      const debt = {
        id: `DEBT-${Date.now()}`,
        customerName: manualCustomerName || 'Guest',
        phone: manualCustomerPhone || '-',
        total,
        method: methodLabel,
        status: 'Belum Lunas',
        createdAt: new Date().toISOString(),
      };
      saveToLocalList('debts', debt);
    }

    if (addManualCustomer && manualCustomerName.trim()) {
      const newCustomer = {
        id: `C-${Date.now()}`,
        name: manualCustomerName.trim(),
        phone: manualCustomerPhone || '-',
        transactionCount: 0,
        totalSpent: 0,
      };
      saveToLocalList('customers', newCustomer);
    }

    // Generate transaction ID and save transaction data
    const transactionId = `TRX${Date.now()}`;
    const finalPaidAmount = payMethod === 'cash' ? paidAmount : total;
    const finalChange = Math.max(0, finalPaidAmount - total);

    setTransactionData({
      id: transactionId,
      total,
      paid: finalPaidAmount,
      change: finalChange,
    });

    // Save transaction to localStorage
    const transaction = {
      id: transactionId,
      date: new Date().toISOString(),
      total,
      paymentMethod: methodLabel,
      status: 'Completed',
      items: cartItems.map(item => ({
        name: item.name,
        qty: item.quantity,
        price: item.price,
      })),
    };
    saveToLocalList('transactions', transaction);

    // Close payment modal and show success modal
    setShowPayModal(false);
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setCartItems([]);
    setShowCart(false);
    setIsDebt(false);
    setAddManualCustomer(false);
    setManualCustomerName('');
    setManualCustomerPhone('');
    setPaidAmount(0);
    setDigitalMethod('OVO');
    setPayMethod('cash');
    setTransactionData(null);
  };

  const handlePrintReceipt = () => {
    // Print receipt functionality
    window.print();
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = 500;
  const tax = 1000;
  const total = subtotal - discount + tax;
  const change = Math.max(0, paidAmount - total);

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
      {/* Static sidebar for desktop (xl up) */}
      <div className="hidden xl:block">
        <Sidebar />
      </div>

      {/* Sidebar overlay for tablet (md only) */}
      {!sidebarCollapsed && (
        <div className="hidden md:block xl:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarCollapsed(true)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[10.5rem] md:w-[12rem] bg-white shadow-xl">
            <Sidebar />
          </div>
        </div>
      )}
      
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0 xl:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <i className="ri-menu-line text-xl text-gray-700"></i>
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Scan barcode"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <i className="ri-barcode-line text-lg text-gray-400"></i>
            </div>
          </div>
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
        <div className="hidden md:block bg-white border-b px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-4">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex xl:hidden w-10 h-10 md:w-10 md:h-10 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
            >
              <i className={`ri-${sidebarCollapsed ? 'menu-unfold' : 'menu-fold'}-line text-lg text-gray-700`}></i>
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Klik disini lalu scan barcode"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 md:pl-4 pr-10 md:pr-12 py-2 md:py-2.5 lg:py-3 border border-gray-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 md:gap-2">
                <i className="ri-barcode-line text-lg md:text-xl text-gray-400"></i>
                <i className="ri-search-line text-lg md:text-xl text-gray-400"></i>
              </div>
            </div>
            <button className="w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              <i className="ri-camera-line text-lg md:text-xl text-gray-700"></i>
            </button>
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
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center justify-center min-w-[85px] md:min-w-[95px] lg:min-w-[110px] px-2.5 md:px-3 lg:px-4 py-2 md:py-2 lg:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat.name
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Card */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-3.5 lg:mb-4">
              <h3 className="text-xs md:text-xs lg:text-base font-semibold text-gray-900">Rice Bowl Menu</h3>
              <button className="text-xs md:text-xs text-gray-600 hover:text-gray-900">Sort by A-Z</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-2.25 lg:gap-4">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all duration-300 text-left active:scale-[0.98] group"
              >
                <div className="flex gap-3 md:gap-2.25 lg:gap-4 p-3 md:p-2.75 lg:p-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 md:w-18 md:h-18 lg:w-28 lg:h-28 rounded-lg md:rounded-xl bg-gray-50 overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <span className="px-1.5 md:px-2 py-0.5 bg-emerald-500 text-white text-[9px] md:text-[9.5px] lg:text-[10px] font-bold rounded-full shadow-md">
                        {product.unit}
                      </span>
                    </div>
                  </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1.1 md:mb-0.6 lg:mb-2 text-sm md:text-[11px] lg:text-base line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {product.name}
                      </h4>
                      <div className="flex items-baseline gap-1.1 md:gap-1 lg:gap-2 mb-1.1 md:mb-0.9 lg:mb-2">
                        <p className="text-base md:text-[13px] lg:text-xl font-bold text-gray-900">Rp {product.price.toLocaleString()}</p>
                        <p className="text-[10px] md:text-[9px] lg:text-xs text-gray-400 line-through">Rp {product.originalPrice.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] md:text-[11px] lg:text-xs text-gray-500 font-medium">Tersedia</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tablet & Desktop Cart Sidebar */}
      <div className="hidden md:flex w-[190px] lg:w-[320px] bg-white border-l flex-col">
        <div className="p-2 md:p-2.5 lg:p-4 border-b">
          <div className="flex items-center justify-between mb-1.5 md:mb-2.5 lg:mb-3.5">
            <h2 className="text-[11px] md:text-sm lg:text-xl font-bold text-gray-900">Bills</h2>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded">
              <i className="ri-more-fill text-xl text-gray-600"></i>
            </button>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowCashierDropdown(!showCashierDropdown)}
              className="w-full flex items-center gap-2 md:gap-2.5 lg:gap-3 p-2 md:p-2.5 lg:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm lg:text-base font-semibold flex-shrink-0">
                {selectedCashier.initials}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900 text-[10px] md:text-xs lg:text-sm">{selectedCashier.name}</p>
                <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-500">Cashier</p>
              </div>
              <i className={`ri-arrow-down-s-line text-sm md:text-base lg:text-lg text-gray-600 transition-transform ${showCashierDropdown ? 'rotate-180' : ''}`}></i>
            </button>
            
            {showCashierDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 md:mt-2 bg-white border-2 border-gray-200 rounded-lg md:rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto">
                {cashiers.map((cashier) => (
                  <button
                    key={cashier.id}
                    onClick={() => {
                      setSelectedCashier(cashier);
                      setShowCashierDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 md:gap-2.5 lg:gap-3 px-2.5 md:px-3 lg:px-4 py-2 md:py-2.5 lg:py-3 hover:bg-emerald-50 transition-colors cursor-pointer ${
                      selectedCashier.id === cashier.id ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm lg:text-base font-semibold flex-shrink-0">
                      {cashier.initials}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 text-[10px] md:text-xs lg:text-sm">{cashier.name}</p>
                      <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-500">Cashier</p>
                    </div>
                    {selectedCashier.id === cashier.id && (
                      <i className="ri-check-line text-emerald-600 text-sm md:text-base lg:text-lg"></i>
                    )}
                  </button>
                ))}
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
                <div className="w-11 h-11 md:w-12 md:h-12 lg:w-16 lg:h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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
                    <div className="flex items-center gap-1 md:gap-1 lg:gap-1.25 bg-white rounded-full px-1 border border-gray-200 shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-4.5 h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 text-gray-700"
                      >
                        <i className="ri-subtract-line text-[10px] md:text-[10px] lg:text-[11px]"></i>
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => setQuantityValue(item.id, parseInt(e.target.value || '0', 10))}
                        className="w-10 md:w-11 lg:w-12 text-center text-[10px] md:text-[11px] lg:text-sm font-semibold border-0 focus:ring-0 focus:outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-4.5 h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 flex items-center justify-center rounded-full text-white btn-orange-gradient active:scale-95"
                      >
                        <i className="ri-add-line text-[10px] md:text-[10px] lg:text-[11px]"></i>
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
              setAddManualCustomer(false);
              setManualCustomerName('');
              setManualCustomerPhone('');
              setPaidAmount(total);
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
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.name}</h4>
                      <p className="text-xs text-gray-500 mb-2">{item.unit}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100 active:scale-95"
                          >
                            <i className="ri-subtract-line text-sm"></i>
                          </button>
                          <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded text-white btn-orange-gradient active:scale-95"
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
                  setAddManualCustomer(false);
                  setManualCustomerName('');
                  setManualCustomerPhone('');
                  setPaidAmount(total);
                }}
              >
                Bayar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Pay Button */}
      {cartItems.length > 0 && (
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4 lg:p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header with printer icon */}
            <div className="relative p-6 pb-4">
              <button
                onClick={handlePrintReceipt}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer active:scale-95"
              >
                <i className="ri-printer-line text-xl text-gray-600"></i>
              </button>
              
              {/* Success indicator */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <i className="ri-check-line text-4xl text-white"></i>
                </div>
              </div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Transaksi Berhasil!
              </h2>
              
              {/* Transaction ID */}
              <p className="text-sm text-gray-600 text-center mb-6">
                ID: {transactionData.id}
              </p>
              
              {/* Transaction Summary */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-base font-medium text-gray-700">Total Tagihan</span>
                  <span className="text-base font-bold text-gray-900">Rp {transactionData.total.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-base font-medium text-gray-700">Pembayaran</span>
                  <span className="text-base font-bold text-gray-900">Rp {transactionData.paid.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-base font-medium text-gray-700">Kembalian</span>
                  <span className={`text-base font-bold ${transactionData.change > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    Rp {transactionData.change.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="p-6 pt-4 flex gap-3">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                <i className="ri-printer-line text-lg"></i>
                Cetak Struk
              </button>
              <button
                onClick={handleCloseSuccessModal}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                <i className="ri-check-line text-lg"></i>
                Selesai
              </button>
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
                        setPaidAmount(0);
                      } else {
                        setPaidAmount(total);
                        if (m === 'digital') {
                          setDigitalMethod('OVO');
                        }
                      }
                    }}
                    className={`flex-1 py-2 md:py-2.5 lg:py-3 rounded-lg font-medium text-[10px] md:text-xs lg:text-sm border transition-all active:scale-95 ${
                      payMethod === m
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
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
                    {[5000, 10000, 20000, 50000, 100000].map((nominal) => (
                      <button
                        key={nominal}
                        onClick={() => setPaidAmount((prev) => prev + nominal)}
                        className="px-1.5 md:px-2 lg:px-4 py-2 md:py-2.5 lg:py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-[10px] md:text-xs lg:text-sm font-semibold text-gray-800 active:scale-95"
                      >
                        + Rp {nominal.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Jumlah Dibayar</label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseInt(e.target.value || '0', 10))}
                        className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Kembalian</label>
                      <div className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[10px] md:text-xs lg:text-sm font-bold text-gray-900">
                        Rp {change.toLocaleString()}
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
                      <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Jumlah Dibayar</label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseInt(e.target.value || '0', 10))}
                        className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Kembalian</label>
                      <div className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[10px] md:text-xs lg:text-sm font-bold text-gray-900">
                        Rp {Math.max(0, paidAmount - total).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'qris' && (
                <div className="space-y-2.5 md:space-y-3">
                  <p className="text-[10px] md:text-xs lg:text-sm text-gray-600">Pembayaran non-tunai akan otomatis disamakan dengan total.</p>
                  <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Jumlah Dibayar</label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseInt(e.target.value || '0', 10))}
                        className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Kembalian</label>
                      <div className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[10px] md:text-xs lg:text-sm font-bold text-gray-900">
                        Rp {Math.max(0, paidAmount - total).toLocaleString()}
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
                    onChange={(e) => setIsDebt(e.target.checked)}
                    className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-[10px] md:text-xs lg:text-sm text-gray-800 font-medium">Tandai sebagai piutang</span>
                </label>
                <label className="flex items-center gap-2.5 md:gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addManualCustomer}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAddManualCustomer(checked);
                      if (!checked) {
                        setManualCustomerName('');
                        setManualCustomerPhone('');
                      }
                    }}
                    className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-[10px] md:text-xs lg:text-sm text-gray-800 font-medium">Tambahkan pelanggan manual</span>
                </label>
              </div>

              {addManualCustomer && (
                <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Nama Pelanggan</label>
                    <input
                      type="text"
                      value={manualCustomerName}
                      onChange={(e) => setManualCustomerName(e.target.value)}
                      placeholder="Masukkan nama pelanggan"
                      className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Nomor Telepon (opsional)</label>
                    <input
                      type="tel"
                      value={manualCustomerPhone}
                      onChange={(e) => setManualCustomerPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 md:gap-2.5 lg:gap-3 pt-2">
                <button
                  className="flex-1 py-2 md:py-2.5 lg:py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer text-xs md:text-sm lg:text-base active:scale-95"
                  onClick={() => setShowPayModal(false)}
                >
                  Batal
                </button>
                <button
                  className="flex-1 py-2 md:py-2.5 lg:py-3 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors cursor-pointer text-xs md:text-sm lg:text-base active:scale-95"
                  onClick={handleProcessPayment}
                >
                  Proses Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
