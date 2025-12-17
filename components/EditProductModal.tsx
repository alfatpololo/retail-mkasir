'use client';

import { useEffect, useRef, useState } from 'react';

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
  productCategoryId?: number;
  stokMinimum?: number;
  deskripsi?: string;
  tampil?: number;
  aksesCustom?: boolean;
  productQtyJson?: {
    qty: number;
    harga_jual: number;
    operator: string;
  }[];
  imageFile?: File | null;
}

interface CategoryOption {
  id: number;
  nama: string;
}

interface EditProductModalProps {
  product: Product;
  categoryOptions: CategoryOption[];
  onClose: () => void;
  onSave: (updatedProduct: Product) => void | Promise<void>;
}

export default function EditProductModal({
  product,
  categoryOptions,
  onClose,
  onSave,
}: EditProductModalProps) {
  const [formData, setFormData] = useState({
    sku: product.sku,
    name: product.name,
    categoryId: product.productCategoryId ? String(product.productCategoryId) : '',
    costPrice: product.costPrice.toString(),
    sellPrice: product.sellPrice.toString(),
    stock: product.stock.toString(),
    unit: product.unit,
    image: product.image,
  });
  const [stokMinimum, setStokMinimum] = useState(
    product.stokMinimum != null ? String(product.stokMinimum) : ''
  );
  const [deskripsi, setDeskripsi] = useState(product.deskripsi ?? '');
  const [tampil, setTampil] = useState(
    product.tampil != null ? String(product.tampil) : '1'
  );
  const [aksesCustom, setAksesCustom] = useState(
    product.aksesCustom ? '1' : '0'
  );
  const [productQtyRows, setProductQtyRows] = useState<
    { qty: string; harga_jual: string; operator: string }[]
  >(
    product.productQtyJson && product.productQtyJson.length
      ? product.productQtyJson.map((row) => ({
          qty: String(row.qty),
          harga_jual: String(row.harga_jual),
          operator: row.operator,
        }))
      : [{ qty: '', harga_jual: '', operator: 'equals' }]
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categorySearch, setCategorySearch] = useState(
    categoryOptions.find((c) => c.id === product.productCategoryId)?.nama ||
      product.category ||
      ''
  );
  // State & ref untuk scanner barcode SKU (kamera) di modal edit
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!showScanner) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsScanning(false);
      setScannerError(null);
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      try {
        setScannerError(null);
        setIsScanning(true);

        if (!navigator.mediaDevices?.getUserMedia) {
          setScannerError('Browser tidak mendukung akses kamera.');
          setIsScanning(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Gunakan BarcodeDetector jika tersedia di browser
        // @ts-ignore
        const BarcodeDetectorCtor = (window as any).BarcodeDetector;
        if (!BarcodeDetectorCtor) {
          setScannerError(
            'Browser tidak mendukung BarcodeDetector. Gunakan scanner fisik yang mengetikkan kode langsung ke input SKU.'
          );
          setIsScanning(false);
          return;
        }

        // @ts-ignore
        const detector = new BarcodeDetectorCtor({
          formats: ['code_128', 'ean_13', 'ean_8', 'upc_a'],
        });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const scanFrame = async () => {
          if (cancelled || !videoRef.current || !context) return;

          const video = videoRef.current;
          if (video.readyState !== 4) {
            requestAnimationFrame(scanFrame);
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const barcodes = await detector.detect(canvas);
            if (barcodes.length > 0) {
              const code =
                // @ts-ignore
                (barcodes[0] as any).rawValue ||
                // @ts-ignore
                (barcodes[0] as any).value ||
                '';
              if (code) {
                setFormData((prev) => ({
                  ...prev,
                  sku: String(code),
                }));
                setShowScanner(false);
                return;
              }
            }
          } catch {
            // abaikan error baca per frame
          }

          requestAnimationFrame(scanFrame);
        };

        requestAnimationFrame(scanFrame);
      } catch {
        setScannerError(
          'Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.'
        );
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [showScanner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const aksesCustomBool = aksesCustom === '1';
      const productQtyJson = aksesCustomBool
        ? productQtyRows
            .filter(
              (row) =>
                row.qty !== '' && row.harga_jual !== '' && row.operator.trim() !== ''
            )
            .map((row) => ({
              qty: Number(row.qty),
              harga_jual: Number(row.harga_jual),
              operator: row.operator,
            }))
        : [];

      await onSave({
        ...product,
        sku: formData.sku,
        name: formData.name,
        category:
          categoryOptions.find((c) => String(c.id) === formData.categoryId)?.nama ||
          product.category,
        costPrice: parseFloat(formData.costPrice),
        sellPrice: parseFloat(formData.sellPrice),
        stock: parseInt(formData.stock),
        unit: formData.unit,
        image: formData.image,
        productCategoryId: formData.categoryId
          ? Number(formData.categoryId)
          : product.productCategoryId,
        stokMinimum: Number(stokMinimum || 0),
        deskripsi,
        tampil: Number(tampil || 1),
        aksesCustom: aksesCustomBool,
        productQtyJson,
        imageFile,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Edit Product</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <span className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
              {(imageFile || formData.image) ? (
                <img
                  src={
                    imageFile
                      ? URL.createObjectURL(imageFile)
                      : formData.image
                  }
                  alt={formData.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <span className="text-xs font-bold text-gray-600">
                  {product.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">
                Product ID: {product.id}
              </p>
              <p className="text-base font-bold text-gray-900">
                {product.name}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gambar Produk
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
              }}
              className="w-full text-sm text-gray-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
            {imageFile && (
              <p className="mt-1 text-xs text-gray-500">
                File terpilih: {imageFile.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU
                <span className="ml-1 text-xs text-gray-400">
                  {' '}
                  (bisa ketik manual atau scan barcode)
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="Scan atau ketik SKU"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-3 py-2.5 border border-emerald-500 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 cursor-pointer flex items-center gap-1"
                >
                  <span className="ri-qr-scan-line text-lg" />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter product name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="relative">
              <div
                className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 cursor-text"
                onClick={() => {
                  // buka dropdown dengan cara mengupdate search apa adanya
                  setCategorySearch(
                    categorySearch ||
                      categoryOptions.find(
                        (c) => String(c.id) === formData.categoryId
                      )?.nama ||
                      product.category ||
                      ''
                  );
                }}
              >
                <span className="ri-price-tag-3-line text-gray-400 text-base" />
                <input
                  type="text"
                  value={
                    categorySearch ||
                    categoryOptions.find(
                      (c) => String(c.id) === formData.categoryId
                    )?.nama ||
                    product.category ||
                    ''
                  }
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                  }}
                  placeholder="Ketik untuk mencari kategori..."
                  className="flex-1 bg-transparent outline-none placeholder:text-gray-400"
                />
                <span className="ri-arrow-down-s-line text-gray-400 text-base" />
              </div>

              {categorySearch !== undefined && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {categoryOptions
                    .filter((cat) =>
                      cat.nama
                        .toLowerCase()
                        .includes(categorySearch.toLowerCase())
                    )
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            categoryId: String(cat.id),
                          }));
                          setCategorySearch(cat.nama);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 cursor-pointer ${
                          String(cat.id) === formData.categoryId
                            ? 'bg-emerald-50 text-emerald-700 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        {cat.nama}
                      </button>
                    ))}
                  {categoryOptions.filter((cat) =>
                    cat.nama
                      .toLowerCase()
                      .includes(categorySearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-400">
                      Kategori tidak ditemukan
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
              <input
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
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
                min="0"
                step="0.01"
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
                min="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Satuan
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              placeholder="pcs / bungkus / dll"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stok Minimum
              </label>
              <input
                type="number"
                value={stokMinimum}
                onChange={(e) => setStokMinimum(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Deskripsi produk"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tampil
              </label>
              <select
                value={tampil}
                onChange={(e) => setTampil(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="1">Tampil</option>
                <option value="0">Sembunyikan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Akses Custom Harga
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAksesCustom('0')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                    aksesCustom === '0'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  0 - Non Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setAksesCustom('1')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                    aksesCustom === '1'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  1 - Aktif
                </button>
              </div>
            </div>
          </div>

          {aksesCustom === '1' && (
            <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">
                  Pengaturan Harga Per Qty (product_qty_json)
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setProductQtyRows([
                      ...productQtyRows,
                      { qty: '', harga_jual: '', operator: 'equals' },
                    ])
                  }
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 cursor-pointer"
                >
                  + Tambah Baris
                </button>
              </div>

              <div className="space-y-2">
                {productQtyRows.map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-4 gap-3 items-end"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) => {
                          const next = [...productQtyRows];
                          next[index] = { ...next[index], qty: e.target.value };
                          setProductQtyRows(next);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="6"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Harga Jual
                      </label>
                      <input
                        type="number"
                        value={row.harga_jual}
                        onChange={(e) => {
                          const next = [...productQtyRows];
                          next[index] = {
                            ...next[index],
                            harga_jual: e.target.value,
                          };
                          setProductQtyRows(next);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        step="0.01"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Operator
                      </label>
                      <select
                        value={row.operator}
                        onChange={(e) => {
                          const next = [...productQtyRows];
                          next[index] = {
                            ...next[index],
                            operator: e.target.value,
                          };
                          setProductQtyRows(next);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="equals">equals</option>
                        <option value="greater_or_equals">
                          greater_or_equals
                        </option>
                        <option value="less_or_equals">less_or_equals</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (productQtyRows.length === 1) {
                            setProductQtyRows([
                              { qty: '', harga_jual: '', operator: 'equals' },
                            ]);
                          } else {
                            setProductQtyRows(
                              productQtyRows.filter((_, i) => i !== index)
                            );
                          }
                        }}
                        className="px-3 py-2 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              disabled={isSubmitting}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="ri-loader-4-line animate-spin"></span>
                  Menyimpan...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Scan Barcode SKU
                </p>
                <p className="text-xs text-gray-500">
                  Arahkan kamera ke barcode produk sampai kode terbaca
                  otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScanner(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <span className="ri-close-line text-lg text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              </div>

              {scannerError && (
                <p className="text-xs text-red-500">{scannerError}</p>
              )}

              {!scannerError && (
                <p className="text-xs text-gray-500">
                  {isScanning
                    ? 'Mencari barcode...'
                    : 'Jika tidak terbaca, Anda tetap bisa memakai scanner fisik yang mengetikkan kode langsung ke input SKU.'}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowScanner(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}