'use client';

import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

interface AddToCartModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (item: {
    productId: string;
    name: string;
    unit: string;
    quantity: number;
    price: number;
    negotiatedPrice?: number;
    note?: string;
  }) => void;
}

export default function AddToCartModal({ product, onClose, onAdd }: AddToCartModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pcs');
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [note, setNote] = useState('');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const units = ['pcs', 'batang', 'bungkus', 'bal', 'lusin', 'karton'];
  const maxStock = product.stock ?? 0;

  const finalPrice = negotiatedPrice ? parseFloat(negotiatedPrice) : product.price;
  const safeQty = Math.min(quantity, maxStock || quantity);
  const subtotal = finalPrice * safeQty;

  const handleAdd = () => {
    const negotiated = negotiatedPrice ? parseFloat(negotiatedPrice) : undefined;
    const priceToUse = negotiated ?? product.price;
    const qtyToAdd = Math.min(quantity, maxStock || quantity);

    if (qtyToAdd <= 0) {
      return;
    }

    onAdd({
      productId: product.id,
      name: product.name,
      unit,
      quantity: qtyToAdd,
      price: priceToUse,
      negotiatedPrice: negotiated,
      note: note || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl md:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-emerald-500 px-4 md:px-5 py-2.5 md:py-3 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base md:text-lg font-bold text-white">Tambah ke Keranjang</h3>
          <button 
            onClick={onClose} 
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
          >
            <span className="ri-close-line w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-white"></span>
          </button>
        </div>

        <div className="p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto flex-1">
          {/* Product Info */}
          <div className="flex items-start gap-2.5 md:gap-3 p-2.5 md:p-3 bg-gray-50 rounded-lg md:rounded-xl">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] md:text-xs text-gray-400">
                  Tidak ada gambar
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm md:text-base font-bold text-gray-900 mb-1 line-clamp-2">{product.name}</h4>
              <p className="text-[10px] md:text-xs text-gray-500 mb-1.5 md:mb-2">{product.category}</p>
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <p className="text-lg md:text-xl font-bold text-gray-900">Rp {product.price.toLocaleString()}</p>
                <span className="ml-2 text-[10px] md:text-xs text-emerald-700 font-semibold">
                  Stok: {maxStock}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="space-y-2.5 md:space-y-3">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Jumlah</label>
              <div className="flex items-center gap-1.5 md:gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, Math.min(maxStock || 1, quantity - 1)))}
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                >
                  <span className="ri-subtract-line text-base md:text-lg text-gray-700"></span>
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, Math.min(maxStock || val, val)));
                  }}
                  className="flex-1 h-9 md:h-10 px-2.5 md:px-3 border-2 border-gray-200 rounded-lg text-center text-sm md:text-base font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  onClick={() => setQuantity(Math.max(1, Math.min(maxStock || quantity + 1, quantity + 1)))}
                  disabled={maxStock > 0 && quantity >= maxStock}
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg text-white btn-orange-gradient active:scale-95 transition-all cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="ri-add-line text-base md:text-lg"></span>
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Satuan</label>
              <button
                onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                className="w-full h-9 md:h-10 px-3 md:px-4 border-2 border-gray-200 rounded-lg text-left text-xs md:text-sm font-medium flex items-center justify-between cursor-pointer hover:border-emerald-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors bg-white"
              >
                <span className="text-gray-900">{unit}</span>
                <span className="ri-arrow-down-s-line text-base md:text-lg text-gray-500"></span>
              </button>
              {showUnitDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                  {units.map((u) => (
                    <button
                      key={u}
                      onClick={() => {
                        setUnit(u);
                        setShowUnitDropdown(false);
                      }}
                      className="w-full px-3 md:px-4 py-1.5 md:py-2 text-left text-xs md:text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {u}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Harga Nego */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
              Harga Nego <span className="text-[10px] md:text-xs font-normal text-gray-500">(Opsional)</span>
            </label>
            <input
              type="number"
              value={negotiatedPrice}
              onChange={(e) => setNegotiatedPrice(e.target.value)}
              placeholder={`Default: Rp ${product.price.toLocaleString()}`}
              className="w-full h-9 md:h-10 px-2.5 md:px-3 border-2 border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
              Catatan <span className="text-[10px] md:text-xs font-normal text-gray-500">(Opsional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan catatan..."
              rows={2}
              className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border-2 border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-colors"
            />
          </div>

          {/* Subtotal */}
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg md:rounded-xl p-3 md:p-4 border-2 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-gray-600 mb-0.5">Subtotal</p>
                <p className="text-[10px] md:text-xs text-gray-500">{quantity} × Rp {finalPrice.toLocaleString()}</p>
              </div>
              <span className="text-xl md:text-2xl font-bold text-emerald-600">Rp {subtotal.toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* Buttons - Fixed at bottom */}
        <div className="p-3 md:p-4 border-t bg-white flex gap-1.5 md:gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 md:py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 active:scale-95 transition-all cursor-pointer text-xs md:text-sm"
          >
            Batal
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-2 md:py-2.5 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer text-xs md:text-sm shadow-md shadow-emerald-500/30"
          >
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}
