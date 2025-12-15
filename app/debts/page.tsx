'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface DebtItem {
  id: string;
  customerName: string;
  phone?: string;
  total: number;
  method: string;
  status: string;
  createdAt: string;
}

const fallbackDebts: DebtItem[] = [
  { id: 'D-001', customerName: 'Guest', phone: '-', total: 150000, method: 'cash', status: 'Belum Lunas', createdAt: new Date().toISOString() },
];

export default function DebtsPage() {
  const [debts, setDebts] = useState<DebtItem[]>(fallbackDebts);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('debts');
      if (stored) {
        const parsed = JSON.parse(stored) as DebtItem[];
        if (Array.isArray(parsed) && parsed.length) {
          setDebts(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load debts', err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar />

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Data Piutang</h1>
            <p className="text-gray-600">Daftar transaksi yang ditandai piutang</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Metode</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {debts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-semibold flex items-center justify-center">
                          {debt.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{debt.customerName}</p>
                          <p className="text-xs text-gray-500">{debt.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{debt.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Rp {debt.total.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{debt.method}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        {debt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(debt.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

