'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  fetchBukakasData,
  fetchTutupKasirData,
  tutupKasirApi,
  TutupKasirData,
  BukakasData,
  getBukakasId,
  shouldShowBukaKasir,
} from '@/utils/cashierSession';
import { usePrinter } from '@/components/PrinterProvider';
import {
  generateCloseCashierReceiptESC_POS,
  printToPrinter,
  reconnectUSBDevice,
  CloseCashierReceiptData,
  USBDevice,
} from '@/utils/printerUtils';
import { logoutUser } from '@/utils/storage';

export default function CloseCashierPage() {
  const router = useRouter();
  const printer = usePrinter();
  const [bukakasData, setBukakasData] = useState<BukakasData | null>(null);
  const [tutupKasirData, setTutupKasirData] = useState<TutupKasirData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [catatanTutupKasir, setCatatanTutupKasir] = useState('');
  const [showPopupTutup, setShowPopupTutup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)
  const totalTransaksi =
    tutupKasirData?.total_transaksi ?? bukakasData?.total_transaksi ?? 0;
  const totalPenjualan =
    tutupKasirData?.total ?? bukakasData?.total_penjualan ?? 0;
  const tunaiVal = tutupKasirData?.tunai ?? bukakasData?.tunai ?? 0;
  const nonTunaiVal =
    tutupKasirData?.nontunai ?? bukakasData?.non_tunai ?? 0;
  const waktuBukaStr =
    tutupKasirData?.waktu_buka ?? bukakasData?.waktu_buka ?? '-';
  const catatanVal =
    tutupKasirData?.catatan ?? bukakasData?.catatan ?? '-';
  const modalAwalVal = bukakasData?.modal_awal ?? 0;
  const saldoKasVal =
    tutupKasirData?.saldo_kas ?? bukakasData?.saldo_kas ?? 0;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Sinkronkan dulu dengan server untuk mendapatkan bukakas_id terbaru
        try {
          const status = await shouldShowBukaKasir();
          if (status.needOpen && !status.needClose) {
          setError('ID bukakas tidak ditemukan. Silakan buka kasir terlebih dahulu.');
          setLoading(false);
          return;
          }
        } catch (e) {
          console.warn('Gagal sinkronisasi dengan server:', e);
        }

        // Ambil ringkasan tutup kasir (akan otomatis sinkronisasi dengan server)
        let ringkasan: TutupKasirData | null = null;
        try {
          ringkasan = await fetchTutupKasirData();
          if (ringkasan) {
            setTutupKasirData(ringkasan);
          }
        } catch (e) {
          console.warn('Gagal memuat ringkasan tutup kasir:', e);
        }

        // Ambil bukakas_id dari localStorage (setelah sinkronisasi)
        let bukakasId = getBukakasId();
        
        // Jika masih belum ada bukakas_id, tampilkan error
        if (!bukakasId) {
          setError('ID bukakas tidak ditemukan. Silakan buka kasir terlebih dahulu.');
          setLoading(false);
          return;
        }

        // Ambil data bukakas/{id} sebagai detail pembuka kasir
        try {
          const bukakas = await fetchBukakasData(bukakasId);
          setBukakasData(bukakas);
        } catch (e) {
          console.warn('Gagal memuat data bukakas:', e);
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Gagal memuat data bukakas.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCetakStrukTutupKasir = async () => {
    if (!tutupKasirData) {
      alert('Data ringkasan tutup kasir belum tersedia.');
      return;
    }

    try {
      setIsPrinting(true);
      // Ambil pengaturan struk dari localStorage (sama seperti POS / History)
      let storeName = 'TOKO';
      let address = '';
      let phone = '';
      let footerNote = '';

      try {
        if (typeof window !== 'undefined') {
          const savedSettings = window.localStorage.getItem('receipt_settings');
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            storeName = parsed.storeName || storeName;
            address = parsed.address || address;
            phone = parsed.phone || phone;
            footerNote = parsed.footerNote || footerNote;
          }

          if (!storeName || storeName === 'TOKO') {
            const pinSession = window.localStorage.getItem('pin_session');
            if (pinSession) {
              try {
                const sessionData = JSON.parse(pinSession);
                storeName = sessionData.nama_kios || storeName || 'TOKO';
                address = sessionData.lokasi || address || '';
                phone = sessionData.notelp || phone || '';
                footerNote =
                  sessionData.receipt_footer_text || footerNote || '';
              } catch (err) {
                console.warn(
                  'Gagal membaca pin_session untuk fallback nama toko:',
                  err
                );
              }
            }
          }
        }
      } catch (e) {
        console.warn(
          'Gagal membaca pengaturan struk dari localStorage:',
          e
        );
      }

      const now = new Date();
      // Susun item per produk (kategori - produk)
      const receiptItems =
        tutupKasirData.produkterjual?.flatMap((kategori) => {
          const namaKategori = kategori.nama_kategori || 'Lainnya';
          if (!kategori.produk || !Array.isArray(kategori.produk)) return [];
          return kategori.produk.map((p) => {
            const qty = p.jumlah_terbeli ?? p.qty ?? 0;
            const price = p.harga ?? 0;
            return {
              nama_kategori: namaKategori,
              nama: p.nama ?? 'Produk',
              jumlah_terbeli: qty,
              harga: price,
            };
          });
        }) || [];

      const totalPendapatan =
        ((tutupKasirData as { total_pendapatan?: number }).total_pendapatan ??
          receiptItems.reduce(
            (sum, p) => sum + (p.harga || 0) * (p.jumlah_terbeli || 0),
            0
          )) || tutupKasirData.total;

      const totalPengeluaran =
        (tutupKasirData.biayapengeluaran || 0) +
        ((tutupKasirData.pengeluaran || []) as Array<{ nominal?: number }>).reduce(
          (sum, p) => sum + (p.nominal || 0),
          0
        );

      const footerLines = [
        `Total Transaksi: ${tutupKasirData.total_transaksi}`,
        `Tunai: Rp ${tutupKasirData.tunai.toLocaleString('id-ID')}`,
        `Non Tunai: Rp ${tutupKasirData.nontunai.toLocaleString('id-ID')}`,
        `Pengeluaran: Rp ${totalPengeluaran.toLocaleString('id-ID')}`,
        `Catatan: ${tutupKasirData.catatan || catatanTutupKasir || '-'}`,
      ]
        .filter(Boolean)
        .join('\n');

      const receiptData: CloseCashierReceiptData = {
        storeName,
        address,
        phone,
        footerNote: footerNote ? `${footerNote}\n${footerLines}` : footerLines,
        waktuBuka: tutupKasirData.waktu_buka || '-',
        waktuTutup: tutupKasirData.waktu_sekarang || '-',
        totalTransaksi: tutupKasirData.total_transaksi,
        totalPenjualan: totalPendapatan,
        tunai: tutupKasirData.tunai,
        nonTunai: tutupKasirData.nontunai,
        pajak: tutupKasirData.pajak,
        diskon: tutupKasirData.diskon,
        biayaLainnya: tutupKasirData.biaya_lainnya,
        biayaPengeluaran: totalPengeluaran,
        saldoKas: tutupKasirData.saldo_kas,
        catatan: tutupKasirData.catatan || catatanTutupKasir || '',
        pengeluaran:
          tutupKasirData.pengeluaran?.map((p) => ({
            nama: p.nama,
            nominal: p.nominal,
            catatan: p.catatan,
          })) || [],
        produkterjual:
          tutupKasirData.produkterjual?.map((kat) => ({
            nama_kategori: kat.nama_kategori,
            produk: kat.produk?.map((p) => ({
              nama: p.nama,
              jumlah_terbeli: p.jumlah_terbeli ?? p.qty ?? 0,
              harga: p.harga ?? 0,
            })),
          })) || [],
      };

      const escposData = generateCloseCashierReceiptESC_POS(receiptData);

      // Jika belum ada koneksi printer atau mode sistem, fallback ke print browser
      if (!printer.isConnected || printer.type === 'system') {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          return;
        }

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) {
          alert('Popup diblokir. Silakan izinkan popup untuk mencetak struk.');
          return;
        }

        const textContent = [
          storeName,
          address,
          phone,
          '',
          'RINGKASAN TUTUP KASIR',
          now.toLocaleString('id-ID'),
          `Buka  : ${receiptData.waktuBuka}`,
          `Tutup : ${receiptData.waktuTutup}`,
          '--------------------------------',
          `Total Transaksi : ${receiptData.totalTransaksi}`,
          `Total Penjualan : Rp ${receiptData.totalPenjualan.toLocaleString('id-ID')}`,
          `Tunai           : Rp ${receiptData.tunai.toLocaleString('id-ID')}`,
          `Non Tunai       : Rp ${receiptData.nonTunai.toLocaleString('id-ID')}`,
          `Diskon          : Rp ${receiptData.diskon.toLocaleString('id-ID')}`,
          `Pajak           : Rp ${receiptData.pajak.toLocaleString('id-ID')}`,
          `Biaya Lainnya   : Rp ${receiptData.biayaLainnya.toLocaleString('id-ID')}`,
          `Biaya Pengeluaran: Rp ${receiptData.biayaPengeluaran.toLocaleString('id-ID')}`,
          `Saldo Kas       : Rp ${receiptData.saldoKas.toLocaleString('id-ID')}`,
          receiptData.catatan ? `Catatan: ${receiptData.catatan}` : '',
          '',
          'Produk Terjual:',
          ...(receiptItems.map((p) => {
            const qty = p.jumlah_terbeli ?? 0;
            return `- ${p.nama} (${qty}x) Rp ${(qty * (p.harga ?? 0)).toLocaleString('id-ID')}`;
          })),
          '',
          footerNote || 'Terima kasih',
        ]
          .filter(Boolean)
          .join('\n');

        printWindow.document.write(`<pre>${textContent}</pre>`);
        printWindow.document.close();
        printWindow.print();
        return;
      }

      if (printer.type === 'usb') {
        let device: USBDevice | null = (printer as unknown as { usbDevice?: USBDevice }).usbDevice || null;

        if (!device) {
          device = await reconnectUSBDevice();
        }

        if (!device) {
          console.error('Printer USB belum terhubung, fallback ke print browser');
          if (typeof window !== 'undefined') {
            window.print();
          }
          return;
        }

        await printToPrinter('usb', device, escposData);
      } else {
        // Bluetooth belum diimplementasikan, fallback ke print sistem
        if (typeof window !== 'undefined') {
          window.print();
        }
      }
    } catch (err) {
      console.error('Print error:', err);
      if (typeof window !== 'undefined') {
        try {
          window.print();
        } catch (fallbackErr) {
          console.error('Fallback window.print error:', fallbackErr);
          alert('Gagal mencetak struk');
        }
      } else {
        alert('Gagal mencetak struk');
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const formatRupiah = (value: number | undefined) =>
    `Rp ${(value || 0).toLocaleString('id-ID')}`;

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

  const handleTutupKasir = async () => {
    if (!catatanTutupKasir.trim()) {
      alert('Catatan tutup kasir wajib diisi.');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menutup kasir? Setelah ditutup, Anda akan logout dari sistem.')) {
      return;
    }

    try {
      setProcessing(true);
      
      // Ambil data ringkasan tutup kasir sebelum tutup
      try {
        const tutupData = await fetchTutupKasirData();
        if (tutupData) {
          setTutupKasirData(tutupData);
        }
      } catch (e) {
        console.warn('Gagal mengambil data ringkasan tutup kasir:', e);
      }
      
      // Panggil API tutup kasir
      await tutupKasirApi(catatanTutupKasir || 'Tutup kasir dari menu Tutup Kasir');
      alert('Kasir berhasil ditutup');
      // Logout dan redirect ke login
      logoutUser();
      router.push('/login');
    } catch (e) {
      alert(
        `Gagal tutup kasir: ${
          e instanceof Error ? e.message : 'Terjadi kesalahan'
        }`
      );
      setProcessing(false);
    }
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
              <i className="ri-safe-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tutup Kasir</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Ringkasan penjualan hari ini sebelum menutup kasir</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl border border-gray-200/50 p-8 shadow-xl">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium text-gray-600">Memuat data ringkasan...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-3xl border-2 border-red-200 p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600">
              <i className="ri-error-warning-line text-2xl"></i>
              <p className="text-sm font-semibold">{error}</p>
            </div>
          </div>
        )}

        {!loading && (tutupKasirData || bukakasData) && (
              <div className="space-y-4">
            {/* Struk-like Layout */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Header Struk */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold">RINGKASAN TUTUP KASIR</h2>
                  <button
                    type="button"
                    onClick={handleCetakStrukTutupKasir}
                    disabled={isPrinting}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                  >
                    {isPrinting ? 'Mencetak...' : 'Cetak'}
                  </button>
                  </div>
                <p className="text-xs text-emerald-50">
                  {bukakasData?.user.nama || 'Kasir'} • {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Body Struk */}
              <div className="px-6 py-4 space-y-4">
                {/* Waktu Buka/Tutup */}
                <div className="space-y-2 pb-3 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Waktu Buka:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(waktuBukaStr).toLocaleString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    })}
                  </span>
                </div>
                  {tutupKasirData?.waktu_tutup && tutupKasirData.waktu_tutup !== '-' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Waktu Tutup:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(tutupKasirData.waktu_tutup).toLocaleString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                  </div>
                  )}
                </div>

                {/* Ringkasan Transaksi */}
                <div className="space-y-2 pb-3 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">TRANSAKSI</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Transaksi:</span>
                      <span className="font-semibold text-gray-900">{totalTransaksi}</span>
                  </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaksi Piutang:</span>
                      <span className="font-semibold text-gray-900">
                        {((tutupKasirData as any)?.total_transaksi_piutang ?? 0)}
                      </span>
                </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tunai:</span>
                      <span className="font-semibold text-emerald-700">
                        Rp {tunaiVal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Non Tunai:</span>
                      <span className="font-semibold text-emerald-700">
                        Rp {nonTunaiVal.toLocaleString('id-ID')}
                      </span>
                  </div>
                </div>
              </div>

                {/* Pendapatan */}
                <div className="space-y-2 pb-3 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">PENDAPATAN</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Pendapatan:</span>
                      <span className="font-semibold text-blue-700">
                        Rp {(((tutupKasirData as any)?.total_pendapatan ?? totalPenjualan) || 0).toLocaleString('id-ID')}
                      </span>
              </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pendapatan Selesai:</span>
                      <span className="font-semibold text-green-700">
                        Rp {(((tutupKasirData as any)?.total_pendapatan_selesai ?? 0) || 0).toLocaleString('id-ID')}
                      </span>
            </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Piutang:</span>
                      <span className="font-semibold text-orange-700">
                        Rp {(((tutupKasirData as any)?.total_piutang ?? 0) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Potongan & Biaya */}
                <div className="space-y-2 pb-3 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">POTONGAN & BIAYA</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diskon:</span>
                      <span className="font-semibold text-red-600">
                        - Rp {((tutupKasirData?.diskon ?? 0) || 0).toLocaleString('id-ID')}
                      </span>
                      </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pajak:</span>
                      <span className="font-semibold text-gray-900">
                        Rp {((tutupKasirData?.pajak ?? 0) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biaya Lainnya:</span>
                      <span className="font-semibold text-gray-900">
                        Rp {((tutupKasirData?.biaya_lainnya ?? 0) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biaya Pengeluaran:</span>
                      <span className="font-semibold text-red-700">
                        - Rp {((tutupKasirData?.biayapengeluaran ?? 0) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    </div>
                  </div>

                {/* Kas & Modal */}
                <div className="space-y-2 pb-3 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">KAS & MODAL</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modal Awal:</span>
                      <span className="font-semibold text-gray-900">
                        Rp {modalAwalVal.toLocaleString('id-ID')}
                    </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saldo Kas:</span>
                      <span className="font-bold text-emerald-700 text-base">
                        Rp {saldoKasVal.toLocaleString('id-ID')}
                    </span>
                    </div>
                  </div>
                  </div>

                {/* Detail Pengeluaran */}
                {Array.isArray(tutupKasirData?.pengeluaran) &&
                  tutupKasirData.pengeluaran.length > 0 && (
                    <div className="space-y-2 pb-3 border-b border-gray-200">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">DETAIL PENGELUARAN</h3>
                      <div className="space-y-2">
                        {tutupKasirData.pengeluaran.map((pengeluaran: any, idx: number) => (
                          <div
                            key={pengeluaran.id ?? idx}
                            className="bg-red-50 border-l-[3px] border-red-400 pl-3 py-2 rounded"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {pengeluaran.nama ?? 'Pengeluaran'}
                                  </span>
                                  {pengeluaran.jenis && (
                                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-medium">
                                      {pengeluaran.jenis}
                                  </span>
                                  )}
                                </div>
                                {pengeluaran.catatan && (
                                  <p className="text-xs text-gray-600">{pengeluaran.catatan}</p>
                                )}
                                {pengeluaran.tanggal && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(pengeluaran.tanggal).toLocaleDateString('id-ID')}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm font-bold text-red-700 ml-3">
                                Rp {Number(pengeluaran.nominal ?? 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Produk Terjual */}
                {Array.isArray(tutupKasirData?.produkterjual) &&
                  tutupKasirData.produkterjual.length > 0 && (
                    <div className="space-y-2 pb-3 border-b border-gray-200">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">PRODUK TERJUAL</h3>
                      <div className="space-y-3">
                        {tutupKasirData.produkterjual.map((kategori: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 rounded p-3">
                            <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase">
                              {kategori.nama_kategori || 'Lainnya'}
                            </h4>
                            <div className="space-y-1.5">
                                {Array.isArray(kategori.produk) &&
                                kategori.produk.map((p: any, pIdx: number) => {
                                  const qty = p.jumlah_terbeli ?? p.qty ?? 0;
                                  const subtotal = (p.harga || 0) * qty;
                                  return (
                                        <div
                                          key={p.id ?? pIdx}
                                      className="flex justify-between items-start text-sm"
                                    >
                                      <div className="flex-1">
                                        <span className="font-medium text-gray-900">{p.nama ?? 'Produk'}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                          {qty}x @ Rp {Number(p.harga || 0).toLocaleString('id-ID')}
                                            </span>
                                          </div>
                                      <span className="font-semibold text-gray-900 ml-3">
                                        Rp {subtotal.toLocaleString('id-ID')}
                                              </span>
                                            </div>
                                  );
                                })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                              </div>
                  )}

                {/* Total & Catatan */}
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">TOTAL</span>
                      <span className={`text-xl font-extrabold ${tutupKasirData?.total && tutupKasirData.total < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        Rp {((tutupKasirData?.total ?? 0) || 0).toLocaleString('id-ID')}
                      </span>
                        </div>
                  </div>

                  {catatanVal && catatanVal !== '-' && (
                    <div className="text-sm">
                      <span className="text-gray-600">Catatan Bukakas:</span>
                      <p className="text-gray-900 mt-1">{catatanVal}</p>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Catatan Tutup Kasir Input */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Catatan Tutup Kasir</h3>
              <p className="text-xs text-gray-500 mb-3">
                Catatan ini <span className="font-semibold text-red-500">wajib diisi</span> sebelum menutup kasir.
              </p>
              <textarea
                value={catatanTutupKasir}
                onChange={(e) => setCatatanTutupKasir(e.target.value)}
                placeholder="Contoh: Tutup shift malam, setoran ke brankas, selisih kas +Rp 5.000"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowPopupTutup(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
              >
                <i className="ri-eye-line"></i>
                Lihat Laporan Detail
              </button>
            </div>

            {/* Action Button - Tutup Kasir */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-white">
                  <p className="text-base font-semibold mb-1">Siap untuk menutup kasir?</p>
                  <p className="text-sm text-emerald-50">Setelah ditutup, Anda akan logout dari sistem</p>
                </div>
                <button
                  type="button"
                  onClick={handleTutupKasir}
                  disabled={processing || !catatanTutupKasir.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-emerald-600 rounded-lg text-sm font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98] min-h-[44px]"
                >
                  {processing ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <i className="ri-lock-line"></i>
                      Tutup Kasir Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Laporan Tutup Kasir */}
      {showPopupTutup && tutupKasirData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowPopupTutup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <i className="ri-receipt-2-line text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Laporan Tutup Kasir</h3>
                  <p className="text-emerald-50 text-sm">
                    {bukakasData?.user.nama || 'Kasir'} • {tutupKasirData.total_transaksi} transaksi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPopupTutup(false)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 bg-gray-50">
              {/* Waktu buka/tutup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/60">
                  <p className="text-xs font-medium text-emerald-700 mb-1">Waktu Buka</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {tutupKasirData.waktu_buka 
                      ? new Date(tutupKasirData.waktu_buka).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/60">
                  <p className="text-xs font-medium text-emerald-700 mb-1">
                    {tutupKasirData.waktu_tutup && tutupKasirData.waktu_tutup !== '-' ? 'Waktu Tutup' : 'Waktu Sekarang'}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {tutupKasirData.waktu_tutup && tutupKasirData.waktu_tutup !== '-'
                      ? new Date(tutupKasirData.waktu_tutup).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : tutupKasirData.waktu_sekarang
                      ? new Date(tutupKasirData.waktu_sekarang).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Ringkasan keuangan */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-white space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <i className="ri-wallet-2-line"></i> Ringkasan Keuangan
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-sm text-gray-700">Total Transaksi</span>
                    <span className="text-sm font-semibold text-gray-900">{tutupKasirData.total_transaksi}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-sm text-gray-700">Transaksi Piutang</span>
                    <span className="text-sm font-semibold text-orange-700">{((tutupKasirData as any).total_transaksi_piutang ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-sm text-gray-700">Tunai</span>
                    <span className="text-sm font-semibold text-emerald-700">{formatRupiah(tutupKasirData.tunai)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-sm text-gray-700">Non Tunai</span>
                    <span className="text-sm font-semibold text-emerald-700">{formatRupiah(tutupKasirData.nontunai)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <span className="text-sm text-gray-700">Total Pendapatan</span>
                    <span className="text-sm font-semibold text-blue-700">
                      {formatRupiah((tutupKasirData as any).total_pendapatan ?? tutupKasirData.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                    <span className="text-sm text-gray-700">Pendapatan Selesai</span>
                    <span className="text-sm font-semibold text-green-700">
                      {formatRupiah((tutupKasirData as any).total_pendapatan_selesai ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100">
                    <span className="text-sm text-gray-700">Total Piutang</span>
                    <span className="text-sm font-semibold text-orange-700">
                      {formatRupiah((tutupKasirData as any).total_piutang ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-sm text-gray-700">Diskon</span>
                    <span className="text-sm font-semibold text-red-600">-{formatRupiah(tutupKasirData.diskon)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-sm text-gray-700">Pajak</span>
                    <span className="text-sm font-semibold text-gray-900">{formatRupiah(tutupKasirData.pajak)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                    <span className="text-sm text-gray-700">Biaya Pengeluaran</span>
                    <span className="text-sm font-semibold text-red-700">
                      {formatRupiah(tutupKasirData.biayapengeluaran ?? 0)}
                    </span>
                  </div>
                  {tutupKasirData.biaya_lainnya ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
                      <span className="text-sm text-gray-700">Biaya Lainnya</span>
                      <span className="text-sm font-semibold text-gray-900">{formatRupiah(tutupKasirData.biaya_lainnya)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-sm text-gray-700">Saldo Kas</span>
                    <span className="text-sm font-semibold text-emerald-800">{formatRupiah(tutupKasirData.saldo_kas)}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <i className="ri-wallet-line text-emerald-600"></i> TOTAL
                  </span>
                  <span className={`text-xl font-extrabold ${tutupKasirData.total < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatRupiah(tutupKasirData.total)}
                    </span>
                </div>
              </div>

              {/* Pengeluaran detail */}
              {tutupKasirData.pengeluaran && tutupKasirData.pengeluaran.length > 0 && (
                <div className="p-4 rounded-xl border border-red-100 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                    <i className="ri-money-dollar-circle-line"></i> Detail Pengeluaran
                  </div>
                  <div className="space-y-2">
                    {tutupKasirData.pengeluaran.map((p: any, idx: number) => (
                      <div key={p.id ?? idx} className="p-3 rounded-lg bg-red-50 border border-red-100">
                        <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">{p.nama || 'Pengeluaran'}</span>
                            <div className="flex items-center gap-2 mt-1">
                              {p.jenis && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                  {p.jenis}
                                </span>
                              )}
                              {p.tanggal && (
                                <span className="text-xs text-gray-500">
                                  {new Date(p.tanggal).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                        </div>
                          </div>
                          <span className="text-base font-bold text-red-700">{formatRupiah(p.nominal)}</span>
                        </div>
                        {p.catatan && (
                          <div className="pt-2 border-t border-red-100">
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Catatan:</span> {p.catatan}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Produk terjual */}
              {Array.isArray(tutupKasirData.produkterjual) && tutupKasirData.produkterjual.length > 0 && (
                <div className="p-4 rounded-xl border border-emerald-100 bg-white space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <i className="ri-shopping-bag-3-line"></i> Produk Terjual
                  </div>
                  <div className="space-y-2">
                    {tutupKasirData.produkterjual.map((kategori, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">{kategori.nama_kategori || 'Lainnya'}</span>
                          <span className="text-xs text-gray-500">
                            {Array.isArray(kategori.produk) ? `${kategori.produk.length} produk` : '0 produk'}
                          </span>
                        </div>
                        {Array.isArray(kategori.produk) && kategori.produk.length > 0 && (
                          <div className="divide-y divide-gray-200">
                            {kategori.produk.map((p, pIdx) => {
                              const qty = p.jumlah_terbeli ?? p.qty ?? 0;
                              const subtotal = (p.harga || 0) * qty;
                              return (
                                <div key={p.id ?? pIdx} className="py-2 flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">{p.nama ?? 'Produk'}</span>
                                    <span className="text-xs text-gray-500">
                                      {p.nama_kategori ?? kategori.nama_kategori ?? 'Lainnya'} • {qty}x
                                    </span>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900">{formatRupiah(subtotal)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-white space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <i className="ri-file-text-line"></i> Catatan
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {tutupKasirData.catatan || catatanTutupKasir || '-'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCetakStrukTutupKasir}
                disabled={isPrinting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPrinting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Mencetak...
                  </>
                ) : (
                  <>
                    <i className="ri-printer-line"></i>
                    Cetak Struk
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowPopupTutup(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all"
              >
                <i className="ri-close-line"></i>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
