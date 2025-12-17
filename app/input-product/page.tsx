'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function InputProductPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual');
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    costPrice: '',
    sellPrice: '',
    unit: 'pcs',
    image: null as File | null,
    allowNegotiation: false,
  });
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const units = ['pcs', 'batang', 'bungkus', 'bal', 'lusin', 'karton'];
  const categories = ['Beverages', 'Snacks', 'Dairy', 'Household', 'Personal Care', 'Frozen Food'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const handleExcelUpload = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Excel uploaded:', excelFile);
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-0 2xl:pl-64">
      <Sidebar />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Input Product</h1>
          <p className="text-gray-600">Add new products to your inventory</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 p-1 bg-gray-50">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'manual'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Manual Input
              </button>
              <button
                onClick={() => setActiveTab('excel')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'excel'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Excel Upload
              </button>
            </div>
          </div>

          {activeTab === 'manual' ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Enter SKU"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sell Price</label>
                  <input
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <button
                    type="button"
                    onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left text-sm flex items-center justify-between cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <span className="text-gray-900">{formData.unit}</span>
                    <span className="ri-arrow-down-s-line w-5 h-5 flex items-center justify-center text-gray-500"></span>
                  </button>
                  {showUnitDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {units.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, unit: u });
                            setShowUnitDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 cursor-pointer"
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.allowNegotiation}
                    onChange={(e) => setFormData({ ...formData, allowNegotiation: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Aktifkan harga nego</p>
                    <p className="text-xs text-gray-500">Izinkan kasir mengisi harga negosiasi saat transaksi.</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-50 mx-auto mb-3">
                      <span className="ri-image-add-line w-6 h-6 flex items-center justify-center text-green-600"></span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Click to upload image</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    {formData.image && (
                      <p className="text-xs text-green-600 mt-2">{formData.image.name}</p>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Save Product
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleExcelUpload} className="p-6 space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <span className="ri-information-line w-5 h-5 flex items-center justify-center text-blue-600"></span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Excel Template Format</h4>
                    <p className="text-xs text-blue-700 mb-2">Download the template and fill in your product data</p>
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap"
                    >
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-green-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label htmlFor="excel-upload" className="cursor-pointer">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-50 mx-auto mb-4">
                      <span className="ri-file-excel-2-line w-8 h-8 flex items-center justify-center text-green-600"></span>
                    </div>
                    <p className="text-base font-medium text-gray-900 mb-1">Click to upload Excel file</p>
                    <p className="text-sm text-gray-500">XLSX or XLS format</p>
                    {excelFile && (
                      <p className="text-sm text-green-600 mt-3 font-medium">{excelFile.name}</p>
                    )}
                  </label>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">Validation Rules</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• SKU must be unique</li>
                  <li>• All required fields must be filled</li>
                  <li>• Prices must be positive numbers</li>
                  <li>• Category must match existing categories</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!excelFile}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Upload & Validate
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
