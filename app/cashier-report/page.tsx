'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/utils/api';
import Sidebar from '@/components/Sidebar';
import { TutupKasirData } from '@/utils/cashierSession';
import { usePrinter } from '@/components/PrinterProvider';
import {
  generateCloseCashierReceiptESC_POS,
  printToPrinter,
  reconnectUSBDevice,
  CloseCashierReceiptData,
  USBDevice,
} from '@/utils/printerUtils';

interface BukakasUser {
  id: number;
  nama: string;
  level: string;
}

interface BukakasItem {
  id: number;
  created_at: string;
  updated_at: string;
  stall_id: number;
  user_id: number;
  waktu_buka: string;
  waktu_tutup?: string;
  saldo_kas: number;
  modal_awal: number;
  tunai: number;
  non_tunai: number;
  total_transaksi: number;
  total_penjualan: number;
  catatan?: string;
  status: string;
  user: BukakasUser;
}

interface BukakasListResponse {
  success: boolean;
  message: string;
  data: {
    data: BukakasItem[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

const toInputDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

export default function CashierReportPage() {
  const printer = usePrinter();
  const [items, setItems] = useState<BukakasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BukakasItem | null>(null);
  const [catatan, setCatatan] = useState('Tutup shift malam');
  const [detailLoading, setDetailLoading] = useState(false);
  const [tutupKasirData, setTutupKasirData] = useState<TutupKasirData | null>(
    null
  );
  const [searchName, setSearchName] = useState('');
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)
  const [isPrinting, setIsPrinting] = useState(false);
  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState<string>(''); // filter tanggal mulai
  const [endDate, setEndDate] = useState<string>(''); // filter tanggal selesai

  const loadData = async (pageNumber: number, start?: string, end?: string) => {
    setLoading(true);
    setError(null);

    try {
      const jwtPin =
        typeof window !== 'undefined'
          ? localStorage.getItem('jwt_pin')
          : null;

      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan, silakan login ulang.');
      }

      const params = new URLSearchParams();
      params.set('page', String(pageNumber));
      params.set('limit', String(limit));

      const effectiveStart = start || startDate || toInputDate(today);
      const effectiveEnd = end || endDate || toInputDate(today);

      if (effectiveStart) params.set('start_date', effectiveStart);
      if (effectiveEnd) params.set('end_date', effectiveEnd);

      const url = `${API_BASE_URL}/bukakas?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
        cache: 'no-store',
      });

      const json: BukakasListResponse = await res
        .json()
        .catch(() => ({
          success: false,
          message: 'Gagal membaca respon server',
          data: { data: [], total: 0, page: 1, limit: 20, total_pages: 1 },
        }));

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengambil data bukakas');
      }

      setItems(json.data.data || []);
      setTotal(json.data.total || 0);
      setTotalPages(json.data.total_pages || 1);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Terjadi kesalahan saat mengambil data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, startDate, endDate]);

  // Reset state sidebar saat window resize (mengikuti pola POS / close-cashier)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1536) {
        setSidebarCollapsed(true);
      }
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenModal = async (item: BukakasItem) => {
    setSelectedItem(item);
    setCatatan(item.catatan || 'Tutup shift malam');
    setTutupKasirData(null);
    setShowModal(true);

    try {
      setDetailLoading(true);

      const jwtPin =
        typeof window !== 'undefined'
          ? localStorage.getItem('jwt_pin')
          : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan, silakan login ulang.');
      }

      const currentUserStr =
        typeof window !== 'undefined'
          ? localStorage.getItem('currentUser')
          : null;
      // user_id harus mengikuti data bukakas (kasir pada sesi tersebut),
      // bukan selalu user yang sedang login
      const payload: { user_id: number; bukakas_id: number; catatan: string } = {
        user_id: item.user_id,
        bukakas_id: item.id,
        catatan: item.catatan || 'Tutup shift malam',
      };

      const res = await fetch(`${API_BASE_URL}/bukakas/tutupkasir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res
        .json()
        .catch(() => ({ success: false, message: 'Gagal membaca respon server' }));

      if (!res.ok || json.success === false || !json.data) {
        throw new Error(json.message || 'Gagal mengambil data tutup kasir');
      }

      setTutupKasirData(json.data as TutupKasirData);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Terjadi kesalahan saat mengambil data tutup kasir';
      alert(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) =>
    `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
  };

  const handlePrint = async () => {
    if (!tutupKasirData) {
      alert('Data ringkasan tutup kasir belum tersedia.');
      return;
    }

    if (isPrinting) return;
    setIsPrinting(true);

    try {
      const data = tutupKasirData;

      // Ambil pengaturan struk dari utility function
      const { getPrinterSettings } = await import('@/utils/printerSettings');
      const settings = getPrinterSettings();
      const storeName = settings.storeName;
      const address = settings.address;
      const phone = settings.phone;
      const footerNote = settings.footerNote;

      const now = new Date();
      // Susun item per produk (kategori - produk) untuk perhitungan totalPendapatan
      const receiptItems =
        data.produkterjual?.flatMap((kategori) => {
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
        ((data as { total_pendapatan?: number }).total_pendapatan ??
          receiptItems.reduce(
            (sum, p) => sum + (p.harga || 0) * (p.jumlah_terbeli || 0),
            0
          )) || data.total;

      const totalPengeluaran =
        (data.biayapengeluaran || 0) +
        ((data.pengeluaran || []) as Array<{ nominal?: number }>).reduce(
          (sum, p) => sum + (p.nominal || 0),
          0
        );

      const footerLines = [
        ``,
       
      ]
        .filter(Boolean)
        .join('\n');

      const receiptData: CloseCashierReceiptData = {
        storeName,
        address,
        phone,
        footerNote: footerNote ? `${footerNote}\n${footerLines}` : footerLines,
        waktuBuka: data.waktu_buka || '-',
        waktuTutup: data.waktu_sekarang || '-',
        totalTransaksi: data.total_transaksi,
        totalPenjualan: totalPendapatan,
        tunai: data.tunai,
        nonTunai: data.nontunai,
        pajak: data.pajak,
        diskon: data.diskon,
        biayaLainnya: data.biaya_lainnya,
        biayaPengeluaran: totalPengeluaran,
        saldoKas: data.saldo_kas,
        catatan: data.catatan || catatan || '',
        pengeluaran:
          data.pengeluaran?.map((p) => ({
            nama: p.nama,
            nominal: p.nominal,
            catatan: p.catatan,
          })) || [],
        produkterjual:
          data.produkterjual?.map((kat) => ({
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
      if (!printer || !printer.isConnected || printer.type === 'system') {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          return;
        }

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) {
          alert(
            'Popup print diblokir browser. Izinkan popup untuk mencetak struk.'
          );
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
        return;
      }

      if (printer.type === 'usb') {
        // Ambil device dari PrinterProvider
        let device: USBDevice | null = printer.usbDevice || null;

        // Jika device tidak ada atau tidak terbuka, coba reconnect
        if (!device || !device.opened) {
          device = await reconnectUSBDevice();
          
          // Update device di PrinterProvider jika reconnect berhasil
          if (device) {
            printer.setUsbDevice(device);
          }
        }

        // Jika masih tidak ada device, fallback ke print browser
        if (!device) {
          console.error(
            'Printer USB belum terhubung, fallback ke window.print'
          );
          alert(
            'Printer USB belum terhubung. Silakan hubungkan printer di menu Pengaturan / Printer lalu coba lagi.'
          );
          if (typeof window !== 'undefined') {
            window.print();
          }
          return;
        }

        try {
          await printToPrinter('usb', device, escposData);
        } catch (printError) {
          // Jika print gagal, coba reconnect sekali lagi
          console.warn('Print gagal, mencoba reconnect:', printError);
          const reconnectedDevice = await reconnectUSBDevice();
          
          if (reconnectedDevice) {
            printer.setUsbDevice(reconnectedDevice);
            await printToPrinter('usb', reconnectedDevice, escposData);
          } else {
            throw printError;
          }
        }
      } else {
        // Bluetooth belum diimplementasikan, fallback ke print sistem
        if (typeof window !== 'undefined') {
          alert(
            'Printer Bluetooth belum didukung penuh. Menggunakan dialog print bawaan sistem.'
          );
          window.print();
        }
      }
    } catch (err) {
      console.error('Print error:', err);
      try {
        if (typeof window !== 'undefined') {
          alert(
            'Terjadi kesalahan saat mencetak struk. Coba lagi atau cek koneksi printer / ijin popup browser.'
          );
          window.print();
        }
      } catch (fallbackErr) {
        console.error('Fallback window.print error:', fallbackErr);
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const normalizedSearch = searchName.trim().toLowerCase();
  const filteredItems = normalizedSearch
    ? items.filter((item) =>
        (item.user?.nama || '')
          .toString()
          .toLowerCase()
          .includes(normalizedSearch)
      )
    : items;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Static sidebar for desktop (2xl up - very large screens only) */}
      <div className="hidden 2xl:block fixed left-0 top-0 bottom-0 w-64 z-50">
        <Sidebar />
      </div>

      {/* Sidebar overlay for tablet (md, lg, xl - all tablets including landscape) */}
      {!sidebarCollapsed && (
        <div className="hidden md:block 2xl:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarCollapsed(true)}
          ></div>
          <div className="absolute left-0 top-0 bottom-0 w-[10.5rem] md:w-[13rem] lg:w-[15rem] xl:w-[17rem] bg-white shadow-xl z-50 overflow-y-auto">
            <Sidebar isOverlay={true} />
          </div>
        </div>
      )}

      {/* Show Sidebar Indicator for Tablet (md, lg, xl - when collapsed) */}
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
                animationDelay: '0s',
              }}
            ></i>
            <i
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors"
              style={{
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0.3s',
              }}
            ></i>
          </div>
        </button>
      )}

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSidebar(false)}
          ></div>
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
                animationDelay: '0s',
              }}
            ></i>
            <i
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors"
              style={{
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0.3s',
              }}
            ></i>
          </div>
        </button>
      )}

      <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 2xl:pl-72 2xl:pr-8">
        <header className="bg-white border-b px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Laporan Kasir
            </h1>
            <p className="text-xs md:text-sm text-gray-500">
              Riwayat buka tutup kasir dan ringkasan saldo.
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs md:text-sm text-gray-600">
                  Monitoring semua sesi buka / tutup kasir.
                </p>
                <p className="text-[11px] text-gray-400">
                  Klik salah satu baris untuk melihat detail dan cetak
                  ringkasan tutup kasir.
                </p>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 text-xs text-gray-500">
                <div className="relative">
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => {
                      setSearchName(e.target.value);
                    }}
                    placeholder="Cari nama kasir..."
                    className="pl-8 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <i className="ri-search-line absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] md:text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-gray-400">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] md:text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <span className="hidden md:inline px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
                  Total data: <span className="font-semibold">{total}</span>
                </span>
              </div>
            </div>

            {loading && (
              <p className="text-sm text-gray-500">Memuat data bukakas...</p>
            )}

            {error && !loading && (
              <p className="text-sm text-red-500 mb-3">{error}</p>
            )}

            {!loading && !error && filteredItems.length === 0 && (
              <p className="text-sm text-gray-500">
                Tidak ada data bukakas yang cocok dengan filter.
              </p>
            )}

            {!loading && !error && filteredItems.length > 0 && (
              <>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="min-w-full text-xs md:text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b text-gray-600">
                      <th className="py-2 px-2 text-left">ID</th>
                      <th className="py-2 px-2 text-left">Kasir</th>
                      <th className="py-2 px-2 text-left">Status</th>
                      <th className="py-2 px-2 text-left">Buka</th>
                      <th className="py-2 px-2 text-left">Tutup</th>
                      <th className="py-2 px-2 text-right">Modal Awal</th>
                        <th className="py-2 px-2 text-right">Tunai</th>
                        <th className="py-2 px-2 text-right">Non Tunai</th>
                        <th className="py-2 px-2 text-right">
                          Total Penjualan
                        </th>
                        <th className="py-2 px-2 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleOpenModal(item)}
                          className="border-b last:border-0 hover:bg-emerald-50/60 cursor-pointer transition-colors"
                        >
                        <td className="py-2 px-2 whitespace-nowrap">
                          #{item.id}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {item.user?.nama || '-'}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {item.user?.level || ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === 'buka'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {item.status === 'buka' ? 'Buka' : 'Tutup'}
                          </span>
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          {formatDateTime(item.waktu_buka)}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          {formatDateTime(item.waktu_tutup)}
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap">
                          {formatCurrency(item.modal_awal)}
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap">
                          {formatCurrency(item.tunai)}
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap">
                          {formatCurrency(item.non_tunai)}
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap">
                          {formatCurrency(item.total_penjualan)}
                        </td>
                          <td className="py-2 px-2 text-center">
                            {item.status === 'buka' ? (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-500 text-white">
                                Tutup Kasir
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                                Lihat Detail
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-3">
                  <p className="text-[11px] md:text-xs text-gray-500">
                    Menampilkan{' '}
                    <span className="font-semibold">
                      {filteredItems.length > 0 ? (page - 1) * limit + 1 : 0}
                    </span>{' '}
                    -{' '}
                    <span className="font-semibold">
                      (page - 1) * limit + {filteredItems.length}
                    </span>{' '}
                    dari{' '}
                    <span className="font-semibold">{total}</span> data
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1 || loading}
                      className="px-2.5 py-1.5 text-[11px] rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      &laquo; Prev
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const p = idx + 1;
                      const isActive = p === page;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`px-2.5 py-1.5 text-[11px] rounded-lg border ${
                            isActive
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                          disabled={loading}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages || loading}
                      className="px-2.5 py-1.5 text-[11px] rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Next &raquo;
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Ringkasan Tutup Kasir
              </h2>
              <p className="text-xs text-gray-500">
                ID Bukakas #{selectedItem.id} •{' '}
                {selectedItem.user?.nama || 'Kasir'}
              </p>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {detailLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Memuat ringkasan...</span>
                </div>
              )}

              {!detailLoading && !tutupKasirData && (
                <p className="text-xs text-red-500">
                  Gagal memuat ringkasan tutup kasir.
                </p>
              )}

              {!detailLoading && tutupKasirData && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ringkasan</p>
                    <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-3 text-[11px] font-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Kasir</span>
                        <span className="text-gray-900 font-semibold">
                          {selectedItem.user?.nama || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Waktu Buka</span>
                        <span className="text-gray-900">
                          {tutupKasirData.waktu_buka || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Waktu Tutup</span>
                        <span className="text-gray-900">
                          {(tutupKasirData as any).waktu_tutup ||
                            tutupKasirData.waktu_sekarang ||
                            '-'}
                        </span>
                      </div>

                      <div className="border-t border-dashed border-gray-300 my-1.5" />

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Total Transaksi</span>
                        <span className="text-gray-900 font-semibold">
                          {tutupKasirData.total_transaksi ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Total Pendapatan</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(
                            (tutupKasirData as any).total_pendapatan ??
                              tutupKasirData.total
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Pendapatan Selesai</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(
                            (tutupKasirData as any).total_pendapatan_selesai ??
                              (tutupKasirData as any).total_pendapatan ??
                              tutupKasirData.total
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Total Piutang</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency((tutupKasirData as any).total_piutang ?? 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Transaksi Piutang</span>
                        <span className="text-gray-900 font-semibold">
                          {(tutupKasirData as any).total_transaksi_piutang ?? 0}
                        </span>
                      </div>

                      <div className="border-t border-dashed border-gray-300 my-1.5" />

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Total</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(tutupKasirData.total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Saldo Kas</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(tutupKasirData.saldo_kas)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Tunai</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(tutupKasirData.tunai)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Non Tunai</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(tutupKasirData.nontunai)}
                        </span>
                      </div>

                      <div className="border-t border-dashed border-gray-300 my-1.5" />

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Biaya Lainnya</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency((tutupKasirData as any).biaya_lainnya ?? 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Total Pengeluaran</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(
                            ((tutupKasirData as any).biayapengeluaran || 0) +
                              ((tutupKasirData.pengeluaran || []) as Array<{
                                nominal?: number;
                              }>).reduce(
                                (sum, p) => sum + (p.nominal || 0),
                                0
                              )
                          )}
                        </span>
                      </div>
                    </div>
                    {tutupKasirData.catatan ? (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-[11px] text-amber-700 mt-2">
                        Catatan: {tutupKasirData.catatan}
                      </div>
                    ) : null}
                  </div>

                  {Array.isArray(tutupKasirData.pengeluaran) &&
                    tutupKasirData.pengeluaran.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Pengeluaran</p>
                        <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-2 space-y-2">
                          {tutupKasirData.pengeluaran.map((p, idx) => (
                            <div
                              key={idx}
                              className="border border-gray-100 rounded-md px-2 py-1.5 text-[11px] space-y-0.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-800">
                                  {p.nama || 'Pengeluaran'}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(Number(p.nominal || 0))}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500">
                                Jenis:{' '}
                                {(p as any).jenis
                                  ? String((p as any).jenis).toUpperCase()
                                  : '-'}
                              </p>
                              {p.catatan && (
                                <p className="text-[10px] text-gray-600">
                                  Catatan: {p.catatan}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {Array.isArray(tutupKasirData.produkterjual) &&
                    tutupKasirData.produkterjual.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Produk Terjual
                        </p>
                        <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-lg p-2 space-y-2">
                          {tutupKasirData.produkterjual.map((kat, idx) => (
                            <div key={idx} className="text-[11px]">
                              <p className="font-semibold text-gray-800 mb-1">
                                {kat.nama_kategori}
                              </p>
                              {Array.isArray(kat.produk) &&
                                kat.produk.map((p) => (
                                  <div
                                    key={p.id ?? `${idx}-${p.nama}`}
                                    className="flex items-center justify-between text-[11px] py-0.5"
                                  >
                                    <span className="text-gray-700">
                                      {p.nama}
                                    </span>
                                    <span className="text-gray-600">
                                      {p.jumlah_terbeli ?? p.qty} x Rp{' '}
                                      {Number(p.harga || 0).toLocaleString(
                                        'id-ID'
                                      )}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSelectedItem(null);
                  setTutupKasirData(null);
                }}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 flex items-center gap-2"
                disabled={detailLoading || !tutupKasirData || isPrinting}
              >
                {isPrinting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Mencetak...</span>
                  </>
                ) : (
                  'Cetak Struk'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


