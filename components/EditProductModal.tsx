'use client';

import { useState } from 'react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  unit: string;
  image: string;
}

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
}

export default function EditProductModal({ product, onClose, onSave }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    sku: product.sku,
    name: product.name,
    category: product.category,
    costPrice: product.costPrice.toString(),
    sellPrice: product.sellPrice.toString(),
    stock: product.stock.toString(),
    unit: product.unit,
    image: product.image,
  });
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const units = ['pcs', 'batang', 'bungkus', 'bal', 'lusin', 'karton'];
  const categories = ['Beverages', 'Snacks', 'Dairy', 'Household', 'Personal Care', 'Frozen Food'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...product,
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      costPrice: parseFloat(formData.costPrice),
      sellPrice: parseFloat(formData.sellPrice),
      stock: parseInt(formData.stock),
      unit: formData.unit,
      image: formData.image,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Edit Product</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
              <span className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
              <img src={formData.image} alt={formData.name} className="w-full h-full object-cover object-top" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Product ID: {product.id}</p>
              <p className="text-base font-bold text-gray-900">{product.name}</p>
            </div>
          </div>

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

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left text-sm flex items-center justify-between cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <span className="text-gray-900">{formData.category}</span>
              <span className="ri-arrow-down-s-line w-5 h-5 flex items-center justify-center text-gray-500"></span>
            </button>
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: cat });
                      setShowCategoryDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
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
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}