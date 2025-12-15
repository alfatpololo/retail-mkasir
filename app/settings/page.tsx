'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  const [receiptSettings, setReceiptSettings] = useState({
    storeName: 'Toko Berkah Jaya',
    address: 'Jl. Raya Merdeka No. 123, Jakarta Pusat',
    phone: '021-12345678',
    footerNote: 'Terima kasih atas kunjungan Anda',
    paperSize: '58mm',
    printer: 'Thermal Printer 01',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Settings saved:', receiptSettings);
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Receipt & Printer Settings</h1>
          <p className="text-gray-600">Configure your receipt layout and printer</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Receipt Settings</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                <input
                  type="text"
                  value={receiptSettings.storeName}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, storeName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={receiptSettings.address}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={receiptSettings.phone}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Footer Note</label>
                <textarea
                  value={receiptSettings.footerNote}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, footerNote: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
                <select
                  value={receiptSettings.paperSize}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, paperSize: e.target.value })}
                  className="w-full px-4 py-2.5 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="58mm">58mm</option>
                  <option value="80mm">80mm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Printer</label>
                <select
                  value={receiptSettings.printer}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, printer: e.target.value })}
                  className="w-full px-4 py-2.5 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Thermal Printer 01">Thermal Printer 01</option>
                  <option value="Thermal Printer 02">Thermal Printer 02</option>
                  <option value="USB Printer">USB Printer</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Save Settings
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Receipt Preview</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
              <div className="max-w-xs mx-auto bg-white p-6 font-mono text-xs">
                <div className="text-center mb-4 border-b border-gray-300 pb-4">
                  <div className="font-bold text-sm mb-1">{receiptSettings.storeName}</div>
                  <div className="text-gray-600 leading-relaxed">{receiptSettings.address}</div>
                  <div className="text-gray-600">{receiptSettings.phone}</div>
                </div>

                <div className="mb-4 border-b border-gray-300 pb-4">
                  <div className="flex justify-between mb-1">
                    <span>TRX:</span>
                    <span>001234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span suppressHydrationWarning={true}>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mb-4 border-b border-gray-300 pb-4">
                  <div className="flex justify-between mb-2">
                    <span>Coca Cola 1.5L</span>
                    <span>12,000</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Indomie Goreng x2</span>
                    <span>7,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ultra Milk 1L</span>
                    <span>18,000</span>
                  </div>
                </div>

                <div className="mb-4 border-b border-gray-300 pb-4">
                  <div className="flex justify-between mb-1">
                    <span>Subtotal:</span>
                    <span>37,000</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Tax (10%):</span>
                    <span>3,700</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>40,700</span>
                  </div>
                </div>

                <div className="text-center text-gray-600">
                  {receiptSettings.footerNote}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
