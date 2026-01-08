/**
 * Interface untuk permission
 */
export interface Permission {
  action: string;
  description: string;
  display_name: string;
  id: number;
  module: string;
  name: string;
}

/**
 * Mendapatkan permissions dari localStorage
 */
export function getPermissions(): Permission[] {
  try {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      return [];
    }

    const currentUser = JSON.parse(currentUserStr);
    return currentUser.permissions || [];
  } catch (error) {
    console.error('Error getting permissions:', error);
    return [];
  }
}

/**
 * Mengecek apakah user memiliki permission tertentu
 * @param permissionName - Nama permission (contoh: "product.create", "product.update", "product.delete")
 * @returns true jika user memiliki permission, false jika tidak
 */
export function hasPermission(permissionName: string): boolean {
  // Admin bypass semua permission
  try {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      const level = (currentUser.level || '').toString().toLowerCase().trim();
      if (level === 'admin') {
        return true;
      }
    }
  } catch (error) {
    console.warn('Error checking admin bypass:', error);
  }

  const permissions = getPermissions();
  
  // Jika tidak ada permissions, return false
  if (permissions.length === 0) {
    return false;
  }

  // Cek apakah permission ada dalam array
  return permissions.some(permission => permission.name === permissionName);
}

/**
 * Mengecek apakah user memiliki salah satu dari permissions yang diberikan
 * @param permissionNames - Array nama permissions
 * @returns true jika user memiliki salah satu permission, false jika tidak
 */
export function hasAnyPermission(permissionNames: string[]): boolean {
  return permissionNames.some(name => hasPermission(name));
}

/**
 * Mengecek apakah user memiliki semua permissions yang diberikan
 * @param permissionNames - Array nama permissions
 * @returns true jika user memiliki semua permission, false jika tidak
 */
export function hasAllPermissions(permissionNames: string[]): boolean {
  return permissionNames.every(name => hasPermission(name));
}

/**
 * Mapping permission names yang umum digunakan
 */
export const PERMISSIONS = {
  // Product permissions
  PRODUCT_VIEW: 'product.view',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  PRODUCT_IMPORT: 'product.import',
  PRODUCT_EXPORT: 'product.export',

  // Category permissions
  CATEGORY_VIEW: 'category.view',
  CATEGORY_CREATE: 'category.create',
  CATEGORY_UPDATE: 'category.update',
  CATEGORY_DELETE: 'category.delete',

  // Transaction permissions
  TRANSACTION_VIEW: 'transaction.view',
  TRANSACTION_CREATE: 'transaction.create',
  TRANSACTION_UPDATE: 'transaction.update',
  TRANSACTION_DELETE: 'transaction.delete',
  TRANSACTION_REFUND: 'transaction.refund',

  // Customer permissions
  CUSTOMER_VIEW: 'customer.view',
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_UPDATE: 'customer.update',
  CUSTOMER_DELETE: 'customer.delete',

  // Stock permissions
  STOCK_PURCHASE: 'Pembelian Stok',
  STOCK_HISTORY: 'Riwayat Stok',
  STOCK_MANAGE: 'Kelola Stok',
  STOCK_OPNAME: 'Stok Opname',

  // Employee/User permissions
  USER_VIEW: 'Lihat User',
  USER_CREATE: 'Tambah User',
  USER_UPDATE: 'Edit User',
  USER_DELETE: 'Hapus User',
  USER_RESET_PASSWORD: 'Reset Password',

  // Report permissions
  REPORT_SALES: 'report.sales',
  REPORT_PROFIT: 'report.profit',
  REPORT_CASHIER: 'report.cashier',
  REPORT_INVENTORY: 'report.inventory',
  REPORT_EXPORT: 'report.export',

  // Cashier permissions
  CASHIER_REPORT: 'cashier.report',

  // Settings permissions
  SETTINGS_TAX: 'settings.tax',
  SETTINGS_PAYMENT: 'settings.payment',
  SETTINGS_PRINTER: 'Pengaturan Struk & Printer',
} as const;

