'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser } from '@/utils/storage';
import { useState, useEffect } from 'react';

interface SubMenuItem {
  label: string;
  path: string;
}

interface MenuItem {
  icon: string;
  label: string;
  path: string;
  submenu?: SubMenuItem[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const sections: MenuSection[] = [
  {
    title: 'POS Kasir',
    items: [{ icon: 'ri-shopping-cart-2-line', label: 'POS', path: '/' }],
  },
  {
    title: 'Manajemen',
    items: [
      {
        icon: 'ri-box-3-line',
        label: 'Produk',
        path: '/products',
        submenu: [
          { label: 'Daftar Produk', path: '/products' },
          { label: 'Kategori', path: '/categories' },
        ],
      },
      {
        icon: 'ri-user-line',
        label: 'Pelanggan',
        path: '/customers',
      },
      {
        icon: 'ri-exchange-dollar-line',
        label: 'Piutang',
        path: '/debts',
      },
    ],
  },
  {
    title: 'Transaksi',
    items: [
      {
        icon: 'ri-time-line',
        label: 'History Penjualan',
        path: '/transactions?tab=history',
      },
      {
        icon: 'ri-file-chart-line',
        label: 'Laporan',
        path: '/reports',
        submenu: [
          { label: 'Laporan Penjualan', path: '/reports' },
          { label: 'Ringkasan Pembayaran', path: '/payment-summary' },
          { label: 'Produk Terlaris', path: '/bestseller-products' },
          { label: 'Laporan Pelanggan', path: '/customer-report' },
        ],
      },
    ],
  },
  {
    title: 'Stok',
    items: [
      {
        icon: 'ri-archive-line',
        label: 'Stok',
        path: '/restock',
        submenu: [
          { label: 'Restock', path: '/restock' },
          { label: 'History Stok', path: '/stock-history' },
          { label: 'Stock Opname', path: '/stock-opname' },
          { label: 'Konversi Stok', path: '/stock-conversion' },
        ],
      },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      {
        icon: 'ri-settings-3-line',
        label: 'Pengaturan',
        path: '/settings',
        submenu: [
          { label: 'Setting Printer', path: '/settings' },
        ],
      },
    ],
  },
  {
    title: 'Profile',
    items: [
      {
        icon: 'ri-hand-coin-line',
        label: 'Tutup Kasir',
        path: '/close-cashier',
      },
      {
        icon: 'ri-user-3-line',
        label: 'Profile',
        path: '/profile-detail',
      },
    ],
  },
];

interface SidebarProps {
  isOverlay?: boolean;
}

export default function Sidebar({ isOverlay = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // STATE UNTUK SUBMENU
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Close submenu when route changes
  useEffect(() => {
    setOpenMenus({});
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    // handle paths with query params by matching pathname part
    const basePath = path.split('?')[0];
    return pathname === basePath || pathname.startsWith(basePath + '/');
  };

  const handleLogout = () => {
    // Hapus semua session/storage terkait user & kasir
    logoutUser();
    // Redirect ke halaman login
    router.push('/login');
  };

  return (
    <aside className={`${isOverlay ? 'w-full' : 'w-[10.5rem] md:w-56 lg:w-64'} bg-white ${isOverlay ? '' : 'border-r border-gray-200'} flex flex-col py-4 md:py-5 lg:py-6 px-3 md:px-4 ${isOverlay ? 'relative h-full' : 'fixed left-0 top-0 bottom-0 z-50'}`}>
      <Link href="/" className="mb-6 md:mb-7 lg:mb-8 flex flex-col items-center gap-1.5 md:gap-2">
        <div className="w-full bg-emerald-500 rounded-lg md:rounded-xl p-3 md:p-4 flex flex-col items-center gap-1 relative mx-2 md:mx-3">
          <img
            src="/images/logomkasir.png"
            alt="MKASIR"
            className="w-20 h-20 md:w-22 md:h-22 lg:w-24 lg:h-24 object-contain"
          />
          <div className="text-center leading-tight">
            <div className="font-bold text-white text-sm md:text-base">MKASIR</div>
            <div className="text-[10px] md:text-xs font-normal text-white/80">Retail POS</div>
          </div>
          <span className="absolute top-1.5 md:top-2 right-1.5 md:right-2 px-1.5 md:px-2 py-0.5 btn-orange-gradient text-white text-[9px] md:text-[10px] font-bold rounded-full whitespace-nowrap">
            PRO
          </span>
        </div>
      </Link>

      <nav className="flex-1 space-y-4 md:space-y-5 lg:space-y-6 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-1.5 md:mb-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isSubmenuActive = hasSubmenu
                  ? item.submenu?.some((sub) => isActive(sub.path))
                  : false;
                const isMenuOpen = openMenus[item.label] || isSubmenuActive;

                return (
                  <div key={item.path} className="space-y-1">
                    {hasSubmenu ? (
                      <>
                        {/* PARENT MENU DENGAN SUBMENU */}
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={`w-full flex items-center justify-between gap-2.5 md:gap-3 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer ${
                            isMenuOpen
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 md:gap-3">
                            <span className={`${item.icon} text-base md:text-lg`}></span>
                            <span>{item.label}</span>
                          </div>
                          <svg
                            className={`w-4 h-4 transition-transform duration-300 ${
                              isMenuOpen ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* SUBMENU */}
                        <div
                          className={`transition-all duration-300 overflow-hidden ${
                            isMenuOpen
                              ? 'max-h-96 opacity-100 mt-1'
                              : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="pl-6 md:pl-8 space-y-1">
                            {item.submenu?.map((sub) => (
                              <Link
                                key={sub.path}
                                href={sub.path}
                                className={`block px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-all cursor-pointer ${
                                  isActive(sub.path)
                                    ? 'bg-emerald-50 text-emerald-700 font-semibold border-l-4 border-emerald-500'
                                    : 'text-gray-600 hover:bg-gray-100 font-medium'
                                }`}
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* NORMAL MENU ITEM TANPA SUBMENU */
                      <Link
                        href={item.path}
                        className={`flex items-center gap-2.5 md:gap-3 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`${item.icon} text-base md:text-lg`}></span>
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="pt-3 md:pt-4 border-t border-gray-200 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 md:gap-3 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium text-red-600 hover:bg-red-50 transition-all cursor-pointer"
        >
          <span className="ri-logout-box-line text-base md:text-lg"></span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
