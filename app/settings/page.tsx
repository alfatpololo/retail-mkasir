'use client';

import { useState } from 'react';
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

    const baseClass =
      'mt-4 rounded-lg px-4 py-3 text-sm border';
    const typeClass =
      printerStatus.type === 'success'
        ? 'bg-green-50 border-green-200 text-green-800'
        : printerStatus.type === 'error'
        ? 'bg-red-50 border-red-200 text-red-800'
        : 'bg-blue-50 border-blue-200 text-blue-800';

    return (
      <div className={`${baseClass} ${typeClass}`}>
        {printerStatus.message}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar />
      
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Receipt &amp; Printer Settings</h1>
          <p className="text-sm text-gray-600">Atur layout struk dan koneksi printer kasir Anda.</p>
        </div>

        <div className="grid grid-cols-2 gap-8 items-start">
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-7 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Pengaturan Struk</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Toko</label>
                <input
                  type="text"
                  value={receiptSettings.storeName}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, storeName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                <textarea
                  value={receiptSettings.address}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
                <input
                  type="tel"
                  value={receiptSettings.phone}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Footer</label>
                <textarea
                  value={receiptSettings.footerNote}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, footerNote: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran Kertas</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Printer (Label)</label>
                <input
                  type="text"
                  value={receiptSettings.printer}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, printer: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 px-6 py-7 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Preview Struk</h2>
              
              <div className="bg-gray-50 rounded-xl px-5 py-6 border-2 border-dashed border-gray-200">
                <div className="max-w-[210px] mx-auto bg-white px-5 py-6 font-mono text-[11px] leading-relaxed">
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

            <div className="bg-white rounded-2xl border border-gray-200 px-6 py-6 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Koneksi Printer</h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Pilih metode koneksi dan lakukan test print untuk memastikan printer siap dipakai.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-700">
                  Web
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Koneksi</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setConnectionType('system')}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        connectionType === 'system'
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Sistem
                    </button>
                    <button
                      type="button"
                      onClick={() => setConnectionType('usb')}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        connectionType === 'usb'
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      USB
                    </button>
                    <button
                      type="button"
                      onClick={() => setConnectionType('bluetooth')}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        connectionType === 'bluetooth'
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Bluetooth
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleConnectPrinter}
                    disabled={isConnecting}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-green-500 text-white rounded-lg text-xs font-semibold tracking-wide hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isConnecting ? 'Menghubungkan...' : 'Connect Printer'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    disabled={isTesting}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-gray-800 text-white rounded-lg text-xs font-semibold tracking-wide hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTesting ? 'Testing...' : 'Test Print'}
                  </button>
                </div>

                <div className="pt-1 border-t border-dashed border-gray-200 mt-2">
                  <p className="text-[11px] text-gray-500">
                    Untuk USB/Bluetooth, gunakan Google Chrome dan akses aplikasi melalui HTTPS atau
                    <span className="mx-1 font-mono">http://localhost</span>
                    agar izin perangkat bisa berfungsi.
                  </p>
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
