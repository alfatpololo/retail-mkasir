'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface MenuItem {
  icon: string;
  label: string;
  path: string;
  children?: MenuItem[];
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
      { icon: 'ri-price-tag-3-line', label: 'Kategori Produk', path: '/categories' },
      { icon: 'ri-box-3-line', label: 'Produk', path: '/products' },
      { icon: 'ri-exchange-dollar-line', label: 'Piutang', path: '/debts' },
      { icon: 'ri-user-line', label: 'Pelanggan', path: '/customers' },
    ],
  },
  {
    title: 'Transaksi',
    items: [
      { icon: 'ri-time-line', label: 'History Penjualan', path: '/transactions?tab=history' },
    ],
  },
  {
    title: 'Setting',
    items: [{ icon: 'ri-printer-line', label: 'Setting Printer', path: '/settings' }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    // handle paths with query params by matching pathname part
    const basePath = path.split('?')[0];
    return pathname === basePath;
  };

  const handleLogout = () => {
    // Clear session
    localStorage.removeItem('currentUser');
    // Redirect to login
    router.push('/login');
  };

  return (
    <aside className="w-[10.5rem] md:w-56 lg:w-64 bg-white border-r border-gray-200 flex flex-col py-4 md:py-5 lg:py-6 px-3 md:px-4 fixed left-0 top-0 bottom-0 z-50">
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
              {section.items.map((item) => (
                <div key={item.path} className="space-y-1">
                  <Link
                    href={item.path}
                    className={`flex items-center gap-2.5 md:gap-3 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer ${
                      isActive(item.path)
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`${item.icon} text-base md:text-lg`}></span>
                    <span>{item.label}</span>
                  </Link>
                  {item.children && (
                    <div className="pl-6 md:pl-8 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          href={child.path}
                          className={`flex items-center gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-all cursor-pointer ${
                            isActive(child.path)
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className={`${child.icon} text-sm md:text-base`}></span>
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
