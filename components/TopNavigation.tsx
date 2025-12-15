'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'POS', icon: 'ri-shopping-cart-2-line' },
    { href: '/products', label: 'Products', icon: 'ri-box-3-line' },
    { href: '/input-product', label: 'Input Product', icon: 'ri-add-box-line' },
    { href: '/categories', label: 'Categories', icon: 'ri-list-check' },
    { href: '/transactions', label: 'Transactions', icon: 'ri-file-list-3-line' },
    { href: '/customers', label: 'Customers', icon: 'ri-user-line' },
    { href: '/business-profile', label: 'Business', icon: 'ri-store-2-line' },
    { href: '/roles', label: 'Roles', icon: 'ri-shield-user-line' },
    { href: '/settings', label: 'Settings', icon: 'ri-settings-3-line' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-bold text-gray-900">RetailPOS</div>
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`${item.icon} w-5 h-5 flex items-center justify-center`}></span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <span className="ri-notification-3-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">Admin User</div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium cursor-pointer">
                AU
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
