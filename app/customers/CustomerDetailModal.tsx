'use client';

import { Customer } from './types';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit?: () => void;
  onViewTransactions?: () => void;
}

export default function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
  onEdit,
  onViewTransactions,
}: CustomerDetailModalProps) {
  if (!isOpen || !customer) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Detail Pelanggan</h3>
              <p className="text-sm text-gray-500 mt-1">Informasi lengkap pelanggan</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <i className="ri-close-line text-xl text-gray-600"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
            <div 
              className="w-20 h-20 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: customer.avatarBg }}
            >
              {customer.initial}
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">{customer.name}</h4>
              <p className="text-sm text-gray-500 mt-1">Bergabung {customer.joinDate}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Informasi Kontak</h5>
            <div className="space-y-3">
              {customer.email !== '-' && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <i className="ri-mail-line text-blue-600 text-lg"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                  </div>
                </div>
              )}
              {customer.phone !== '-' && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <i className="ri-phone-line text-green-600 text-lg"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Telepon</p>
                    <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                  </div>
                </div>
              )}
              {customer.address !== '-' && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <i className="ri-map-pin-line text-purple-600 text-lg"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Alamat</p>
                    <p className="text-sm font-medium text-gray-900">{customer.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Statistik</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">Total Transaksi</p>
                <p className="text-2xl font-bold text-blue-900">{customer.totalTransactions}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs text-emerald-600 font-medium mb-1">Total Belanja</p>
                <p className="text-2xl font-bold text-emerald-900">{customer.totalSpending}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Status</h5>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
              <i className="ri-user-line text-blue-600"></i>
              <span className="text-sm font-medium text-blue-900">{customer.status}</span>
            </span>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          {onViewTransactions && (
            <button
              onClick={onViewTransactions}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap min-h-[44px] touch-manipulation flex items-center justify-center gap-2"
            >
              <i className="ri-history-line"></i>
              Lihat Riwayat Transaksi
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap min-h-[44px] touch-manipulation flex items-center justify-center gap-2"
            >
              <i className="ri-edit-line"></i>
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap min-h-[44px] touch-manipulation"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

