'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface Customer {
  id: string;
  name: string;
  phone: string;
  transactionCount: number;
  totalSpent: number;
}

export default function CustomersPage() {
  const baseCustomers: Customer[] = [
    { id: '1', name: 'Ahmad Wijaya', phone: '081234567890', transactionCount: 45, totalSpent: 5670000 },
    { id: '2', name: 'Siti Nurhaliza', phone: '081234567891', transactionCount: 32, totalSpent: 4230000 },
    { id: '3', name: 'Budi Santoso', phone: '081234567892', transactionCount: 28, totalSpent: 3890000 },
    { id: '4', name: 'Dewi Lestari', phone: '081234567893', transactionCount: 56, totalSpent: 7120000 },
    { id: '5', name: 'Eko Prasetyo', phone: '081234567894', transactionCount: 19, totalSpent: 2340000 },
  ];
  const [customers, setCustomers] = useState<Customer[]>(baseCustomers);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('customers');
      if (stored) {
        const parsed = JSON.parse(stored) as Customer[];
        if (Array.isArray(parsed) && parsed.length) {
          // merge without duplicates by id
          const merged = [...baseCustomers];
          parsed.forEach((c) => {
            if (!merged.find((m) => m.id === c.id)) merged.push(c);
          });
          setCustomers(merged);
        }
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      transactionCount: 0,
      totalSpent: 0,
    };
    setCustomers([...customers, newCustomer]);
    try {
      const stored = localStorage.getItem('customers');
      const parsed = stored ? (JSON.parse(stored) as Customer[]) : [];
      localStorage.setItem('customers', JSON.stringify([...parsed, newCustomer]));
    } catch (err) {
      console.error('Failed to save customer', err);
    }
    setShowModal(false);
    setFormData({ name: '', phone: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Data</h1>
            <p className="text-gray-600">Manage your customer information</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <span className="ri-user-add-line w-5 h-5 flex items-center justify-center"></span>
            Add Customer
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transactions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                          {customer.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{customer.phone}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{customer.transactionCount} times</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">Rp {customer.totalSpent.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                          <span className="ri-edit-line w-4 h-4 flex items-center justify-center text-gray-600"></span>
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 cursor-pointer">
                          <span className="ri-delete-bin-line w-4 h-4 flex items-center justify-center text-red-500"></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Add Customer</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <span className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
