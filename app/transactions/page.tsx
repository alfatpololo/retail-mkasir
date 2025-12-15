'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface Transaction {
  id: string;
  date: string;
  total: number;
  paymentMethod: string;
  status: string;
  items: Array<{ name: string; qty: number; price: number }>;
}

export default function TransactionsPage() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const transactions: Transaction[] = [
    {
      id: 'TRX001234',
      date: '2024-01-15 14:30',
      total: 125000,
      paymentMethod: 'Cash',
      status: 'Completed',
      items: [
        { name: 'Coca Cola 1.5L', qty: 2, price: 12000 },
        { name: 'Indomie Goreng', qty: 10, price: 3500 },
        { name: 'Ultra Milk 1L', qty: 3, price: 18000 },
      ],
    },
    {
      id: 'TRX001235',
      date: '2024-01-15 15:45',
      total: 87500,
      paymentMethod: 'Card',
      status: 'Completed',
      items: [
        { name: 'Rinso Detergen 800g', qty: 2, price: 25000 },
        { name: 'Sunlight 800ml', qty: 1, price: 15000 },
        { name: 'Pepsodent 190g', qty: 1, price: 12500 },
      ],
    },
    {
      id: 'TRX001236',
      date: '2024-01-15 16:20',
      total: 156000,
      paymentMethod: 'QRIS',
      status: 'Completed',
      items: [
        { name: 'Chitato Sapi Panggang', qty: 5, price: 11000 },
        { name: 'Oreo Original', qty: 3, price: 9500 },
        { name: 'Teh Botol Sosro', qty: 12, price: 5000 },
      ],
    },
    {
      id: 'TRX001237',
      date: '2024-01-15 17:10',
      total: 45000,
      paymentMethod: 'Cash',
      status: 'Completed',
      items: [
        { name: 'Aqua 600ml', qty: 6, price: 4000 },
        { name: 'Mie Sedaap Goreng', qty: 6, price: 3500 },
      ],
    },
    {
      id: 'TRX001238',
      date: '2024-01-15 18:30',
      total: 234000,
      paymentMethod: 'Card',
      status: 'Completed',
      items: [
        { name: 'Frisian Flag Susu', qty: 4, price: 16000 },
        { name: 'Ultra Milk 1L', qty: 5, price: 18000 },
        { name: 'Rinso Detergen 800g', qty: 3, price: 25000 },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaction History</h1>
            <p className="text-gray-600">View all completed transactions</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2">
              <span className="ri-filter-3-line w-5 h-5 flex items-center justify-center"></span>
              Filter
            </button>
            <button className="px-4 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2">
              <span className="ri-download-line w-5 h-5 flex items-center justify-center"></span>
              Export
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{transaction.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{transaction.date}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">Rp {transaction.total.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{transaction.paymentMethod}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap"
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Transaction Detail</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedTransaction.id}</p>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <span className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                  <p className="text-base font-medium text-gray-900">{selectedTransaction.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                  <p className="text-base font-medium text-gray-900">{selectedTransaction.paymentMethod}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.qty} × Rp {item.price.toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">Rp {(item.qty * item.price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900">Grand Total</span>
                  <span className="text-2xl font-bold text-green-600">Rp {selectedTransaction.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2">
                  <span className="ri-printer-line w-5 h-5 flex items-center justify-center"></span>
                  Print Receipt
                </button>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
