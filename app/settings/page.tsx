'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { PrinterConnectionType, usePrinter } from '@/components/PrinterProvider';

type ConnectionType = PrinterConnectionType;

type PrinterStatus = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

export default function SettingsPage() {
  const [receiptSettings, setReceiptSettings] = useState({
    storeName: 'Toko Berkah Jaya',
    address: 'Jl. Raya Merdeka No. 123, Jakarta Pusat',
    phone: '021-12345678',
    footerNote: 'Terima kasih atas kunjungan Anda',
    paperSize: '58mm',
    printer: 'Thermal Printer 01',
  });

  const [connectionType, setConnectionType] = useState<ConnectionType>('system');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(null);
  const { setConnection } = usePrinter();
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)

  // Reset sidebar state saat window resize untuk memastikan konsistensi
  useEffect(() => {
    const handleResize = () => {
      // Jika window menjadi 2xl atau lebih besar, reset tablet sidebar
      if (window.innerWidth >= 1536) {
        setSidebarCollapsed(true);
      }
      // Jika window menjadi md atau lebih kecil, reset mobile sidebar
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Settings saved:', receiptSettings);
  };

  const handleConnectPrinter = async () => {
    setPrinterStatus(null);
    setIsConnecting(true);

    try {
      if (connectionType === 'usb') {
        const hasWebUSB = typeof (navigator as any).usb !== 'undefined';
        if (!hasWebUSB) {
          setPrinterStatus({
            type: 'error',
            message: 'Browser tidak mendukung WebUSB. Gunakan Chrome dengan HTTPS / localhost.',
          });
          return;
        }

        // @ts-ignore: WebUSB tidak ada di lib DOM standar
        const device = await (navigator as any).usb.requestDevice({
          filters: [], // bisa diisi vendorId/productId jika sudah tahu printer
        });

        if (device) {
          const name = device.productName || 'Perangkat USB';
          setPrinterStatus({
            type: 'success',
            message: `Printer USB terhubung: ${name}.`,
          });
          setConnection({
            isConnected: true,
            type: 'usb',
            deviceName: name,
          });
        }
      } else if (connectionType === 'bluetooth') {
        const hasBluetooth = typeof (navigator as any).bluetooth !== 'undefined';
        if (!hasBluetooth) {
          setPrinterStatus({
            type: 'error',
            message: 'Browser tidak mendukung Web Bluetooth. Gunakan Chrome dengan HTTPS / localhost.',
          });
          return;
        }

        // @ts-ignore: Web Bluetooth tidak ada di lib DOM standar
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
        });

        if (device) {
          const name = device.name || 'Perangkat Bluetooth';
          setPrinterStatus({
            type: 'success',
            message: `Printer Bluetooth terhubung: ${name}.`,
          });
          setConnection({
            isConnected: true,
            type: 'bluetooth',
            deviceName: name,
          });
        }
      } else {
        // Sistem printer biasa (via driver OS)
        setPrinterStatus({
          type: 'info',
          message:
            'Mode sistem aktif. Saat cetak struk, browser akan membuka dialog print dan menggunakan printer default OS.',
        });
        setConnection({
          isConnected: true,
          type: 'system',
          deviceName: 'Printer Default Sistem',
        });
      }
    } catch (error: any) {
      if (error && error.name === 'NotFoundError') {
        setPrinterStatus({
          type: 'error',
          message: 'Perangkat tidak dipilih. Coba lagi dan pilih printer yang sesuai.',
        });
      } else {
        setPrinterStatus({
          type: 'error',
          message: 'Gagal menghubungkan ke printer. Coba cek kabel / pairing Bluetooth.',
        });
        setConnection({
          isConnected: false,
          type: connectionType,
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestPrint = async () => {
    setPrinterStatus(null);
    setIsTesting(true);

    try {
      if (connectionType === 'system') {
        // Untuk web biasa, paling aman menggunakan dialog print browser
        window.print();
        setPrinterStatus({
          type: 'info',
          message: 'Dialog print dibuka. Pilih printer thermal Anda lalu cetak struk.',
        });
      } else {
        // Di sini seharusnya kirim data ESC/POS ke printer melalui USB / Bluetooth.
        // Implementasi penuh butuh protokol printer & mungkin service backend / bridge lokal.
        setPrinterStatus({
          type: 'info',
          message:
            'Perintah test print dikirim (simulasi). Untuk cetak nyata, perlu implementasi komunikasi ESC/POS ke printer.',
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const renderStatus = () => {
    if (!printerStatus) return null;

    const baseClass = 'mt-4 rounded-xl px-4 py-3 text-sm border flex items-center gap-2';
    const typeClass =
      printerStatus.type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : printerStatus.type === 'error'
        ? 'bg-red-50 border-red-200 text-red-800'
        : 'bg-blue-50 border-blue-200 text-blue-800';

    const iconClass =
      printerStatus.type === 'success'
        ? 'ri-checkbox-circle-line'
        : printerStatus.type === 'error'
        ? 'ri-error-warning-line'
        : 'ri-information-line';

    return (
      <div className={`${baseClass} ${typeClass}`}>
        <i className={`${iconClass} text-lg`}></i>
        {printerStatus.message}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-emerald-50/30 relative">
      {/* Static sidebar for desktop (2xl up - very large screens only) */}
      <div className="hidden 2xl:block fixed left-0 top-0 bottom-0 w-64 z-50">
        <Sidebar />
      </div>

      {/* Sidebar overlay for tablet (md, lg, xl - all tablets including landscape) */}
      {!sidebarCollapsed && (
        <div className="hidden md:block 2xl:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarCollapsed(true)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[10.5rem] md:w-[13rem] lg:w-[15rem] xl:w-[17rem] bg-white shadow-xl z-50 overflow-y-auto">
            <Sidebar isOverlay={true} />
          </div>
        </div>
      )}

      {/* Show Sidebar Indicator for Tablet (md, lg, xl - all tablets including landscape, when collapsed) */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden md:flex 2xl:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 w-12 h-20 bg-white rounded-r-full items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 group"
          aria-label="Show sidebar"
        >
          <div className="flex items-center -space-x-3">
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0s'
              }}
            ></i>
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0.3s'
              }}
            ></i>
          </div>
        </button>
      )}
      
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white z-50 overflow-y-auto">
            <Sidebar isOverlay={true} />
          </div>
        </div>
      )}

      {/* Show Sidebar Indicator for Mobile (when collapsed) */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 w-12 h-20 bg-white rounded-r-full items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 group flex"
          aria-label="Show sidebar"
        >
          <div className="flex items-center -space-x-3">
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0s'
              }}
            ></i>
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0.3s'
              }}
            ></i>
          </div>
        </button>
      )}

      <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 2xl:pl-72 2xl:pr-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <i className="ri-settings-3-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pengaturan Struk &amp; Printer</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Atur layout struk dan koneksi printer kasir Anda</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Pengaturan Struk */}
          <div className="bg-white rounded-3xl border border-gray-200/50 px-6 py-7 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <i className="ri-file-text-line text-white text-lg"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Pengaturan Struk</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <i className="ri-store-2-line text-emerald-600"></i>
                  Nama Toko
                </label>
                <input
                  type="text"
                  value={receiptSettings.storeName}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, storeName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <i className="ri-map-pin-2-line text-emerald-600"></i>
                  Alamat
                </label>
                <textarea
                  value={receiptSettings.address}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <i className="ri-phone-line text-emerald-600"></i>
                  No. Telepon
                </label>
                <input
                  type="tel"
                  value={receiptSettings.phone}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <i className="ri-message-2-line text-emerald-600"></i>
                  Catatan Footer
                </label>
                <textarea
                  value={receiptSettings.footerNote}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, footerNote: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <i className="ri-file-paper-line text-emerald-600"></i>
                    Ukuran Kertas
                  </label>
                  <select
                    value={receiptSettings.paperSize}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, paperSize: e.target.value })}
                    className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="58mm">58mm</option>
                    <option value="80mm">80mm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <i className="ri-printer-line text-emerald-600"></i>
                    Nama Printer
                  </label>
                  <input
                    type="text"
                    value={receiptSettings.printer}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, printer: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all min-h-[44px]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] min-h-[44px] touch-manipulation"
                >
                  <i className="ri-save-line"></i>
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>

          {/* Preview & Koneksi Printer */}
          <div className="space-y-6">
            {/* Preview Struk */}
            <div className="bg-white rounded-3xl border border-gray-200/50 px-6 py-7 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <i className="ri-eye-line text-white text-lg"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Preview Struk</h2>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl px-5 py-6 border-2 border-dashed border-gray-300">
                <div className="max-w-[210px] mx-auto bg-white px-5 py-6 font-mono text-[11px] leading-relaxed shadow-lg rounded-lg">
                  <div className="text-center mb-4 border-b border-gray-300 pb-4">
                    <div className="font-bold text-[12px] mb-1 tracking-wide uppercase">
                      {receiptSettings.storeName}
                    </div>
                    <div className="text-gray-600 leading-relaxed">{receiptSettings.address}</div>
                    <div className="text-gray-600">{receiptSettings.phone}</div>
                  </div>

                  <div className="mb-4 border-b border-gray-300 pb-4">
                    <div className="flex justify-between mb-1">
                      <span>TRX:</span>
                      <span>001234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tanggal:</span>
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
                      <span>PPN (10%):</span>
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

            {/* Koneksi Printer */}
            <div className="bg-white rounded-3xl border border-gray-200/50 px-6 py-7 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <i className="ri-printer-cloud-line text-white text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Koneksi Printer</h2>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Pilih metode koneksi dan lakukan test print
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Web
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Tipe Koneksi</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setConnectionType('system')}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        connectionType === 'system'
                          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-500 text-emerald-700 shadow-md'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <i className="ri-computer-line mr-2"></i>
                      Sistem
                    </button>
                    <button
                      type="button"
                      onClick={() => setConnectionType('usb')}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        connectionType === 'usb'
                          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-500 text-emerald-700 shadow-md'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <i className="ri-usb-line mr-2"></i>
                      USB
                    </button>
                    <button
                      type="button"
                      onClick={() => setConnectionType('bluetooth')}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        connectionType === 'bluetooth'
                          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-500 text-emerald-700 shadow-md'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <i className="ri-bluetooth-line mr-2"></i>
                      BT
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleConnectPrinter}
                    disabled={isConnecting}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98] min-h-[44px] touch-manipulation"
                  >
                    {isConnecting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        Menghubungkan...
                      </>
                    ) : (
                      <>
                        <i className="ri-plug-line"></i>
                        Connect Printer
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    disabled={isTesting}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl text-sm font-semibold hover:from-gray-800 hover:to-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98] min-h-[44px] touch-manipulation"
                  >
                    {isTesting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        Testing...
                      </>
                    ) : (
                      <>
                        <i className="ri-printer-line"></i>
                        Test Print
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-dashed border-gray-200">
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <i className="ri-information-line text-blue-600 text-lg mt-0.5"></i>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Untuk USB/Bluetooth, gunakan Google Chrome dan akses aplikasi melalui HTTPS atau{' '}
                      <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded">http://localhost</span>
                      {' '}agar izin perangkat bisa berfungsi.
                    </p>
                  </div>
                </div>

                {renderStatus()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
