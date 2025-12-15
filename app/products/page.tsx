'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import EditProductModal from '@/components/EditProductModal';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  costPrice?: number;
  sellPrice?: number;
  unit?: string;
}

export default function ProductsPage() {
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Coca Cola 1.5L', sku: 'BEV001', category: 'Beverages', price: 12000, costPrice: 9000, sellPrice: 12000, stock: 150, unit: 'pcs', image: 'https://readdy.ai/api/search-image?query=coca%20cola%20plastic%20bottle%201.5%20liter%20on%20clean%20white%20background%20product%20photography%20professional%20lighting%20sharp%20focus%20commercial%20style&width=200&height=200&seq=prod1&orientation=squarish' },
    { id: '2', name: 'Indomie Goreng', sku: 'SNK001', category: 'Snacks', price: 3500, costPrice: 2500, sellPrice: 3500, stock: 500, unit: 'pcs', image: 'https://readdy.ai/api/search-image?query=indomie%20instant%20noodle%20package%20on%20clean%20white%20background%20product%20photography%20professional%20lighting%20sharp%20focus%20commercial%20style&width=200&height=200&seq=prod2&orientation=squarish' },
    { id: '3', name: 'Ultra Milk 1L', sku: 'DAI001', category: 'Dairy', price: 18000, costPrice: 14000, sellPrice: 18000, stock: 80, unit: 'pcs', image: 'https://readdy.ai/api/search-image?query=ultra%20milk%20carton%20box%201%20liter%20on%20clean%20white%20background%20product%20photography%20professional%20lighting%20sharp%20focus%20commercial%20style&width=200&height=200&seq=prod3&orientation=squarish' },
    { id: '4', name: 'Aqua 600ml', sku: 'BEV002', category: 'Beverages', price: 4000, costPrice: 3000, sellPrice: 4000, stock: 300, unit: 'pcs', image: 'https://readdy.ai/api/search-image?query=aqua%20mineral%20water%20plastic%20bottle%20600ml%20on%20clean%20white%20background%20product%20photography%20professional%20lighting%20sharp%20focus%20commercial%20style&width=200&height=200&seq=prod4&orientation=squarish' },
    { id: '5', name: 'Chitato Sapi Panggang', sku: 'SNK002', category: 'Snacks', price: 11000, costPrice: 8000, sellPrice: 11000, stock: 120, unit: 'pcs', image: 'https://readdy.ai/api/search-image?query=chitato%20potato%20chips%20snack%20package%20on%20clean%20white%20background%20product%20photography%20professional%20lighting%20sharp%20focus%20commercial%20style&width=200&height=200&seq=prod5&orientation=squarish' },
    { id: '6', name: 'Rinso Detergen 800g', sku: 'HOU001', category: 'Household', price: 25000, costPrice: 20000, sellPrice: 25000, stock: 60, unit: 'pcs', image: 'https://readdy.ai/api/search-image?query=rinso%20detergent%20powder%20package%20on%20clean%20white%20background%20product%20photography%20professional%20lighting%20sharp%20focus%20commercial%20style&width=200&height=200&seq=prod6&orientation=squarish' },
  ]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['Beverages', 'Snacks', 'Dairy', 'Household', 'Personal Care', 'Frozen Food'];
  const units = ['pcs', 'batang', 'bungkus', 'bal', 'lusin', 'karton'];
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: '',
    costPrice: '',
    sellPrice: '',
    stock: '',
    unit: 'pcs',
    imageFile: null as File | null,
  });
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const handleSaveProduct = (updatedProduct: any) => {
    setProducts(products.map(p => 
      p.id === updatedProduct.id 
        ? { ...p, ...updatedProduct, price: updatedProduct.sellPrice }
        : p
    ));
    setEditingProduct(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const imageUrl = newProduct.imageFile ? URL.createObjectURL(newProduct.imageFile) : 'https://via.placeholder.com/200?text=Product';
    const productToAdd: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      sku: newProduct.sku,
      category: newProduct.category,
      price: parseFloat(newProduct.sellPrice),
      costPrice: parseFloat(newProduct.costPrice),
      sellPrice: parseFloat(newProduct.sellPrice),
      stock: parseInt(newProduct.stock || '0', 10),
      unit: newProduct.unit,
      image: imageUrl,
    };
    setProducts([productToAdd, ...products]);
    setShowAddModal(false);
    setNewProduct({
      sku: '',
      name: '',
      category: '',
      costPrice: '',
      sellPrice: '',
      stock: '',
      unit: 'pcs',
      imageFile: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product List</h1>
            <p className="text-gray-600">{products.length} products in inventory</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <span className="ri-add-line w-5 h-5 flex items-center justify-center"></span>
            Input Product
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="ri-search-line w-5 h-5 flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></span>
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock">Stock Level</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover object-top" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{product.sku}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">Rp {product.price.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.stock > 100 ? 'bg-green-100 text-green-700' :
                        product.stock > 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingProduct(product)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
                        >
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

          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">Showing {filteredProducts.length} of {products.length} products</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                Previous
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 cursor-pointer whitespace-nowrap">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {editingProduct && (
        <EditProductModal
          product={{
            id: editingProduct.id,
            sku: editingProduct.sku,
            name: editingProduct.name,
            category: editingProduct.category,
            costPrice: editingProduct.costPrice || editingProduct.price * 0.75,
            sellPrice: editingProduct.sellPrice || editingProduct.price,
            stock: editingProduct.stock,
            unit: editingProduct.unit || 'pcs',
            image: editingProduct.image,
          }}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Input Product</h3>
                <p className="text-sm text-gray-500">Tambah produk baru seperti di halaman Input Product</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <span className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                  <input
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="Enter SKU"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Enter product name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
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
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sell Price</label>
                  <input
                    type="number"
                    value={newProduct.sellPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellPrice: e.target.value })}
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
                    <span className="text-gray-900">{newProduct.unit}</span>
                    <span className="ri-arrow-down-s-line w-5 h-5 flex items-center justify-center text-gray-500"></span>
                  </button>
                  {showUnitDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {units.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => {
                            setNewProduct({ ...newProduct, unit: u });
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

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewProduct({ ...newProduct, imageFile: e.target.files?.[0] || null })}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label htmlFor="product-image-upload" className="cursor-pointer">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-50 mx-auto mb-2">
                        <span className="ri-image-add-line w-5 h-5 flex items-center justify-center text-green-600"></span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">Click to upload image</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      {newProduct.imageFile && (
                        <p className="text-xs text-green-600 mt-2">{newProduct.imageFile.name}</p>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
