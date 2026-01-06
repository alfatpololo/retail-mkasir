'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/utils/api';
import { Customer } from './types';

interface ApiTransactionItem {
  id: number;
  nama_produk: string;
  qty: number;
  harga_jual: number;
  subtotal: number;
}

interface ApiTransaction {
  id: number;
  nomor_transaksi: string;
  waktu_pesan: string;
  grand_total: number;
  status: string;
  metode_pembayaran: string;
  items: ApiTransactionItem[];
}

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function TransactionHistoryModal({
  isOpen,
  onClose,
  customer,
}: TransactionHistoryModalProps) {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customer) {
      fetchTransactionHistory();
    }
  }, [isOpen, customer]);

  const fetchTransactionHistory = async () => {
    if (!customer) return;

    try {
      setLoading(true);
      setError(null);

      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan');
      }

      const response = await fetch(
        `${API_BASE_URL}/master/customers/${customer.id}/transactions`,
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

      const json = await response.json();
      setTransactions(json.data?.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat riwayat transaksi';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Riwayat Transaksi</h3>
              <p className="text-sm text-gray-500 mt-1">{customer.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <i className="ri-close-line text-xl text-gray-600"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-gray-500">Memuat riwayat transaksi...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <i className="ri-error-warning-line text-4xl text-red-500 mb-3"></i>
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <i className="ri-file-list-line text-4xl text-gray-300 mb-3"></i>
              <p className="text-sm font-medium text-gray-500">Belum ada transaksi</p>
            </div>
          )}

          {!loading && !error && transactions.length > 0 && (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{transaction.nomor_transaksi}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(transaction.waktu_pesan)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatCurrency(transaction.grand_total)}</p>
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {transaction.metode_pembayaran || 'Cash'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Item:</p>
                    <div className="space-y-1">
                      {transaction.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {item.qty}x {item.nama_produk}
                          </span>
                          <span className="font-medium text-gray-900">{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

