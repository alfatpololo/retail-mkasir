// Utility functions untuk print ESC/POS

// Type untuk USB Device (WebUSB API)
export type USBDevice = {
  opened: boolean;
  vendorId: number;
  productId: number;
  serialNumber?: string;
  manufacturerName?: string;
  productName?: string;
  configuration?: {
    interfaces: Array<{
      interfaceNumber: number;
      alternate: {
        endpoints: Array<{
          endpointNumber: number;
          direction: 'in' | 'out';
          type: 'bulk' | 'interrupt' | 'isochronous' | 'control';
        }>;
      };
      alternates?: Array<{
        endpoints: Array<{
          endpointNumber: number;
          direction: 'in' | 'out';
          type: 'bulk' | 'interrupt' | 'isochronous' | 'control';
        }>;
      }>;
      claimed: boolean;
    }>;
  };
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: ArrayBuffer | ArrayBufferView): Promise<{ status: 'ok' | 'stall' | 'babble'; bytesWritten: number }>;
  transferIn(endpointNumber: number, length: number): Promise<{ status: 'ok' | 'stall' | 'babble'; data?: DataView }>;
};

export interface ReceiptData {
  storeName: string;
  address: string;
  phone: string;
  footerNote: string;
  transactionId: string;
  date: string;
  time: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  paid: number;
  change: number;
  paymentMethod: string;
  customerName?: string;
  isDebt?: boolean;
  cashierName?: string;
  /** Jika true, sembunyikan blok pembayaran (Bayar/Metode/Kembali) */
  skipPaymentSection?: boolean;
  /** Ukuran kertas: '58mm' atau '80mm' */
  paperSize?: '58mm' | '80mm';
  /** Jika true, tampilkan logo pada struk */
  showLogo?: boolean;
}

export interface CloseCashierReceiptData {
  storeName: string;
  address: string;
  phone: string;
  footerNote: string;
  waktuBuka: string;
  waktuTutup: string;
  totalTransaksi: number;
  totalPenjualan: number;
  tunai: number;
  nonTunai: number;
  pajak: number;
  diskon: number;
  biayaLainnya: number;
  biayaPengeluaran: number;
  saldoKas: number;
  catatan?: string;
  pengeluaran?: Array<{
    nama?: string;
    nominal?: number;
    catatan?: string;
  }>;
  produkterjual?: Array<{
    nama_kategori?: string;
    produk?: Array<{
      nama?: string;
      jumlah_terbeli?: number;
      qty?: number;
      harga?: number;
    }>;
  }>;
}

// Fungsi untuk generate ESC/POS receipt (dioptimalkan untuk kertas 58mm, ±32 kolom)
export function generateReceiptESC_POS(data: ReceiptData): Uint8Array {
  const encoder = new TextEncoder();
  const commands: number[] = [];

  // Lebar struk berdasarkan ukuran kertas
  // 58mm = 32 karakter, 80mm = 48 karakter
  const paperSize = data.paperSize || '58mm';
  const RECEIPT_WIDTH = paperSize === '80mm' ? 48 : 32;

  const formatAmount = (value: number | undefined | null): string => {
    const num =
      typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    return num.toLocaleString('id-ID');
  };

  const padRight = (text: string, width: number) => {
    if (text.length >= width) return text.slice(0, width);
    return text + ' '.repeat(width - text.length);
  };

  const padLeft = (text: string, width: number) => {
    if (text.length >= width) return text.slice(0, width);
    return ' '.repeat(width - text.length) + text;
  };

  const formatLine = (left: string, right: string): string => {
    const leftTrimmed = left.length > RECEIPT_WIDTH ? left.slice(0, RECEIPT_WIDTH) : left;
    const rightTrimmed = right.length > RECEIPT_WIDTH ? right.slice(0, RECEIPT_WIDTH) : right;

    const spaceCount = Math.max(1, RECEIPT_WIDTH - leftTrimmed.length - rightTrimmed.length);
    return leftTrimmed + ' '.repeat(spaceCount) + rightTrimmed;
  };

  // Helper function untuk separator
  const addSeparator = () => {
    const dashes = Array(RECEIPT_WIDTH).fill(0x2D); // 32 dashes
    commands.push(...dashes);
    commands.push(0x0A); // LF
  };

  // Initialize printer
  commands.push(0x1B, 0x40); // ESC @

  // Center align
  commands.push(0x1B, 0x61, 0x01); // ESC a 1

  // Store name - ukuran normal tapi bold (tidak double width/height agar tidak terlalu besar)
  const storeName = data.storeName || 'TOKO';
  commands.push(0x1B, 0x45, 0x01); // ESC E 1 (bold ON)
  const storeBytes = encoder.encode(storeName.toUpperCase());
  commands.push(...Array.from(storeBytes));
  commands.push(0x0A); // LF
  commands.push(0x1B, 0x45, 0x00); // ESC E 0 (bold OFF)

  // Address
  if (data.address) {
    const addressLines = data.address.split('\n');
    addressLines.forEach((line) => {
      const trimmed =
        line.length > RECEIPT_WIDTH
          ? line.slice(0, RECEIPT_WIDTH)
          : line;
      const addressBytes = encoder.encode(trimmed);
      commands.push(...Array.from(addressBytes));
      commands.push(0x0A); // LF
    });
  }

  // Phone
  if (data.phone) {
    const phoneBytes = encoder.encode(data.phone);
    commands.push(...Array.from(phoneBytes));
    commands.push(0x0A); // LF
  }

  // Separator
  addSeparator();

  // Left align
  commands.push(0x1B, 0x61, 0x00); // ESC a 0

  // Transaction ID
  const trxId = `TRX: ${data.transactionId}`;
  const trxBytes = encoder.encode(trxId);
  commands.push(...Array.from(trxBytes));
  commands.push(0x0A); // LF

  // Date & Time
  const dateTime = `${data.date} ${data.time}`;
  const dateTimeBytes = encoder.encode(dateTime);
  commands.push(...Array.from(dateTimeBytes));
  commands.push(0x0A); // LF

  // Cashier name (jika ada)
  if (data.cashierName) {
    const cashierLine = `Kasir: ${data.cashierName}`;
    const cashierBytes = encoder.encode(
      cashierLine.length > RECEIPT_WIDTH
        ? cashierLine.slice(0, RECEIPT_WIDTH)
        : cashierLine
    );
    commands.push(...Array.from(cashierBytes));
    commands.push(0x0A); // LF
  }

  // Customer name (hanya tampil jika ada isinya)
  if (data.customerName && data.customerName.trim() !== '') {
    const customerLine = `Pelanggan: ${data.customerName}`;
    const customerBytes = encoder.encode(
      customerLine.length > RECEIPT_WIDTH
        ? customerLine.slice(0, RECEIPT_WIDTH)
        : customerLine
    );
    commands.push(...Array.from(customerBytes));
    commands.push(0x0A); // LF
  }

  // Spasi sebelum detail item
  commands.push(0x0A); // LF

  // Items header
  commands.push(0x1B, 0x45, 0x01); // ESC E 1 - Bold ON
  // Header: nama barang di baris sendiri, detail qty/harga di baris berikutnya
  const itemsHeader = encoder.encode('ITEM');
  commands.push(...Array.from(itemsHeader));
  commands.push(0x1B, 0x45, 0x00); // ESC E 0 - Bold OFF
  commands.push(0x0A); // LF
  addSeparator();

  // Items
  data.items.forEach((item) => {
    // Baris 1: Nama item (dipotong sesuai lebar kertas)
    let itemName = item.name || '';
    if (itemName.length > RECEIPT_WIDTH) {
      itemName = itemName.substring(0, RECEIPT_WIDTH - 3) + '...';
    }
    const nameBytes = encoder.encode(itemName);
    commands.push(...Array.from(nameBytes));
    commands.push(0x0A); // LF

    // Baris 2: "qty x harga" di kiri, subtotal di kanan
    const qtyPrice = `${item.quantity} x ${item.price.toLocaleString('id-ID')}`;
    const subtotalStr = item.subtotal.toLocaleString('id-ID');
    const detailLine = formatLine(qtyPrice, subtotalStr);
    const detailBytes = encoder.encode(detailLine);
    commands.push(...Array.from(detailBytes));
    commands.push(0x0A); // LF
  });

  commands.push(0x0A); // LF

  // Separator
  addSeparator();

  // Subtotal
  const subtotalLine = formatLine('Subtotal', formatAmount(data.subtotal));
  const subtotalBytes = encoder.encode(subtotalLine);
  commands.push(...Array.from(subtotalBytes));
  commands.push(0x0A); // LF

  // Tax (jika ada)
  if (data.tax && data.tax > 0) {
    const taxLine = formatLine('Pajak', formatAmount(data.tax));
    const taxBytes = encoder.encode(taxLine);
    commands.push(...Array.from(taxBytes));
    commands.push(0x0A); // LF
  }

  // Discount (jika ada)
  if (data.discount && data.discount > 0) {
    const discLine = formatLine(
      'Diskon',
      `-${formatAmount(data.discount)}`
    );
    const discBytes = encoder.encode(discLine);
    commands.push(...Array.from(discBytes));
    commands.push(0x0A); // LF
  }

  // Total (bold)
  commands.push(0x1B, 0x45, 0x01); // ESC E 1 - Bold ON
  // Untuk menjaga alignment di kertas 58mm, gunakan ukuran normal (tidak double-width)
  const totalStr = formatAmount(data.total);
  const totalLine = formatLine('TOTAL', totalStr);
  const totalBytes = encoder.encode(totalLine);
  commands.push(...Array.from(totalBytes));
  commands.push(0x1B, 0x45, 0x00); // ESC E 0 - Bold OFF
  commands.push(0x0A, 0x0A); // LF x2

  // Payment info (boleh disembunyikan untuk struk tutup kasir)
  if (!data.skipPaymentSection) {
    const paidLine = formatLine('Bayar', formatAmount(data.paid));
    const paidBytes = encoder.encode(paidLine);
    commands.push(...Array.from(paidBytes));
    commands.push(0x0A); // LF

    // Payment method (selalu tampil)
    const methodText =
      data.paymentMethod && data.paymentMethod.trim() !== ''
        ? data.paymentMethod
        : '-';
    const methodLine = formatLine('Metode', methodText);
    const methodBytes = encoder.encode(methodLine);
    commands.push(...Array.from(methodBytes));
    commands.push(0x0A); // LF

    if (!data.isDebt) {
      const rawChange =
        typeof data.change === 'number' && !Number.isNaN(data.change)
          ? data.change
          : 0;
      const safeChange = Math.max(0, rawChange);
      const changeLine = formatLine('Kembali', formatAmount(safeChange));
      const changeBytes = encoder.encode(changeLine);
      commands.push(...Array.from(changeBytes));
      commands.push(0x0A); // LF
    }
  }

  // Payment method
  // Separator sebelum footer
  addSeparator();

  // Footer (selalu tampil, default "Terima kasih" jika kosong)
  const footerText =
    data.footerNote && data.footerNote.trim() !== ''
      ? data.footerNote
      : 'Terima kasih';

  commands.push(0x1B, 0x61, 0x01); // ESC a 1 - Center align
  const footerLines = footerText.split('\n');
  footerLines.forEach((line) => {
    let remaining = line;
    while (remaining.length > 0) {
      const chunk = remaining.slice(0, RECEIPT_WIDTH);
      remaining = remaining.slice(RECEIPT_WIDTH);
      const footerBytes = encoder.encode(chunk);
      commands.push(...Array.from(footerBytes));
      commands.push(0x0A); // LF
    }
  });
  commands.push(0x1B, 0x61, 0x00); // ESC a 0 - Left align
  // Tambah jarak ekstra ke bawah sebelum potong kertas
  commands.push(0x0A, 0x0A, 0x0A); // LF x3

  // Cut paper (partial cut)
  commands.push(0x1D, 0x56, 0x42, 0x00); // GS V B 0

  return new Uint8Array(commands);
}

// Struk khusus ringkasan tutup kasir (tanpa template transaksi)
export function generateCloseCashierReceiptESC_POS(
  data: CloseCashierReceiptData
): Uint8Array {
  const encoder = new TextEncoder();
  const commands: number[] = [];
  const RECEIPT_WIDTH = 32;

  const formatAmount = (value: number | undefined | null): string => {
    const num =
      typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    return num.toLocaleString('id-ID');
  };

  const padLeft = (text: string, width: number) => {
    if (text.length >= width) return text.slice(0, width);
    return ' '.repeat(width - text.length) + text;
  };

  const formatLine = (left: string, right: string): string => {
    const leftTrimmed =
      left.length > RECEIPT_WIDTH ? left.slice(0, RECEIPT_WIDTH) : left;
    const rightTrimmed =
      right.length > RECEIPT_WIDTH ? right.slice(0, RECEIPT_WIDTH) : right;
    const spaceCount = Math.max(
      1,
      RECEIPT_WIDTH - leftTrimmed.length - rightTrimmed.length
    );
    return leftTrimmed + ' '.repeat(spaceCount) + rightTrimmed;
  };

  const addSeparator = () => {
    const dashes = Array(RECEIPT_WIDTH).fill(0x2d);
    commands.push(...dashes, 0x0a);
  };

  const addWrappedLines = (text: string) => {
    const lines = text.split('\n');
    lines.forEach((line) => {
      let remaining = line;
      while (remaining.length > 0) {
        const chunk = remaining.slice(0, RECEIPT_WIDTH);
        remaining = remaining.slice(RECEIPT_WIDTH);
        const bytes = encoder.encode(chunk);
        commands.push(...Array.from(bytes), 0x0a);
      }
    });
  };

  commands.push(0x1b, 0x40); // init

  // Header toko
  commands.push(0x1b, 0x61, 0x01); // center
  commands.push(0x1b, 0x45, 0x01); // bold on
  const storeBytes = encoder.encode((data.storeName || 'TOKO').toUpperCase());
  commands.push(...Array.from(storeBytes), 0x0a);
  commands.push(0x1b, 0x45, 0x00); // bold off

  if (data.address) {
    addWrappedLines(data.address);
  }
  if (data.phone) {
    const phoneBytes = encoder.encode(data.phone);
    commands.push(...Array.from(phoneBytes), 0x0a);
  }

  addSeparator();

  // Judul
  commands.push(0x1b, 0x61, 0x01); // center
  commands.push(0x1b, 0x45, 0x01);
  const title = encoder.encode('RINGKASAN TUTUP KASIR');
  commands.push(...Array.from(title), 0x0a);
  commands.push(0x1b, 0x45, 0x00);

  // Waktu
  const waktuBuka = encoder.encode(`Buka : ${data.waktuBuka || '-'}`);
  const waktuTutup = encoder.encode(`Tutup: ${data.waktuTutup || '-'}`);
  commands.push(...Array.from(waktuBuka), 0x0a);
  commands.push(...Array.from(waktuTutup), 0x0a);

  addSeparator();
  commands.push(0x1b, 0x61, 0x00); // left

  // Ringkasan angka utama
  commands.push(
    ...Array.from(encoder.encode(formatLine('Total Transaksi', `${data.totalTransaksi}`))),
    0x0a
  );
  commands.push(
    ...Array.from(encoder.encode(formatLine('Total Penjualan', `Rp ${formatAmount(data.totalPenjualan)}`))),
    0x0a
  );

  if (data.tunai > 0) {
    commands.push(
      ...Array.from(encoder.encode(formatLine('Tunai', `Rp ${formatAmount(data.tunai)}`))),
      0x0a
    );
  }
  if (data.nonTunai > 0) {
    commands.push(
      ...Array.from(encoder.encode(formatLine('Non Tunai', `Rp ${formatAmount(data.nonTunai)}`))),
      0x0a
    );
  }
  if (data.diskon > 0) {
    commands.push(
      ...Array.from(encoder.encode(formatLine('Diskon', `-Rp ${formatAmount(data.diskon)}`))),
      0x0a
    );
  }
  if (data.pajak > 0) {
    commands.push(
      ...Array.from(encoder.encode(formatLine('Pajak', `Rp ${formatAmount(data.pajak)}`))),
      0x0a
    );
  }
  if (data.biayaPengeluaran > 0) {
    commands.push(
      ...Array.from(encoder.encode(formatLine('Biaya Pengeluaran', `Rp ${formatAmount(data.biayaPengeluaran)}`))),
      0x0a
    );
  }
  if (data.biayaLainnya > 0) {
    commands.push(
      ...Array.from(encoder.encode(formatLine('Biaya Lainnya', `Rp ${formatAmount(data.biayaLainnya)}`))),
      0x0a
    );
  }

  if (data.pengeluaran && data.pengeluaran.length > 0) {
    addSeparator();
    commands.push(...Array.from(encoder.encode('Pengeluaran')), 0x0a);
    data.pengeluaran.forEach((p) => {
      const name = p.nama || 'Pengeluaran';
      const nominal = formatAmount(p.nominal);
      commands.push(...Array.from(encoder.encode(formatLine(name, `Rp ${nominal}`))), 0x0a);
      if (p.catatan) {
        addWrappedLines(p.catatan);
      }
    });
  }

  addSeparator();
  commands.push(0x1b, 0x45, 0x01);
  const totalLine = encoder.encode(formatLine('TOTAL', `Rp ${formatAmount(data.totalPenjualan)}`));
  commands.push(...Array.from(totalLine), 0x0a);
  commands.push(0x1b, 0x45, 0x00);

  const saldoLine = encoder.encode(formatLine('Saldo Kas', `Rp ${formatAmount(data.saldoKas)}`));
  commands.push(...Array.from(saldoLine), 0x0a, 0x0a);

  // Catatan
  if (data.catatan && data.catatan.trim() !== '') {
    commands.push(0x1b, 0x45, 0x01);
    const catTitle = encoder.encode('Catatan:');
    commands.push(...Array.from(catTitle), 0x0a);
    commands.push(0x1b, 0x45, 0x00);
    addWrappedLines(data.catatan.trim());
  }

  // Produk terjual per kategori
  if (Array.isArray(data.produkterjual) && data.produkterjual.length > 0) {
    addSeparator();
    commands.push(0x1b, 0x45, 0x01);
    const produkTitle = encoder.encode('Produk Terjual');
    commands.push(...Array.from(produkTitle), 0x0a);
    commands.push(0x1b, 0x45, 0x00);

    data.produkterjual.forEach((kategori) => {
      const namaKat = kategori.nama_kategori || 'Kategori';
      const katBytes = encoder.encode(namaKat);
      commands.push(...Array.from(katBytes), 0x0a);

      (kategori.produk || []).forEach((p) => {
        const qty = p.jumlah_terbeli ?? p.qty ?? 0;
        const harga = p.harga ?? 0;
        const nameLine = encoder.encode(`- ${p.nama || 'Produk'}`);
        commands.push(...Array.from(nameLine), 0x0a);
        const detail = encoder.encode(
          formatLine(`  ${qty} x ${formatAmount(harga)}`, `Rp ${formatAmount(qty * harga)}`)
        );
        commands.push(...Array.from(detail), 0x0a);
      });
    });
  }

  addSeparator();

  // Footer
  commands.push(0x1b, 0x61, 0x01); // center
  const footerText =
    data.footerNote && data.footerNote.trim() !== ''
      ? data.footerNote
      : 'Terima kasih';
  addWrappedLines(footerText);
  commands.push(0x1b, 0x61, 0x00); // left
  commands.push(0x0a, 0x0a, 0x0a);
  commands.push(0x1d, 0x56, 0x42, 0x00); // cut

  return new Uint8Array(commands);
}

// Fungsi untuk reconnect USB device jika sudah pernah di-connect
export async function reconnectUSBDevice(): Promise<USBDevice | null> {
  try {
    const hasWebUSB = typeof navigator.usb !== 'undefined';
    if (!hasWebUSB) return null;

    const devices = await navigator.usb!.getDevices();
    if (!devices || devices.length === 0) return null;

    const device = devices[0];
    if (!device) return null;
    
    // Pastikan device terbuka dan dikonfigurasi
    try {
      if (!device.opened) {
        await device.open();
      }
      
      try {
        await device.selectConfiguration(1);
      } catch {
        // Konfigurasi mungkin sudah dipilih
      }
      
      try {
        await device.claimInterface(0);
      } catch {
        // Interface mungkin sudah di-claim
      }
      
      return device;
    } catch (error) {
      console.error('Gagal membuka device:', error);
      return null;
    }
  } catch (error) {
    console.error('Gagal reconnect USB device:', error);
    return null;
  }
}

// Fungsi untuk mengirim data ke printer USB
export async function sendToUSBPrinter(device: USBDevice, data: Uint8Array, retryCount: number = 0): Promise<void> {
  if (!device || typeof device !== 'object') {
    throw new Error('Device USB tidak tersedia. Pastikan printer sudah terhubung.');
  }

  // Batasi retry maksimal 2 kali untuk mencegah infinite loop
  if (retryCount > 2) {
    throw new Error('Gagal mengirim data ke printer setelah beberapa kali percobaan. Pastikan printer terhubung dengan benar.');
  }

  // Pastikan device sudah terbuka
  if (!device.opened) {
    try {
      await device.open();
      await device.selectConfiguration(1);
    } catch (error) {
      // Jika gagal membuka, coba reconnect hanya jika belum pernah retry
      if (retryCount === 0) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('Gagal membuka device, mencoba reconnect:', errorMessage);
        
        // Coba reconnect
        const reconnectedDevice = await reconnectUSBDevice();
        if (reconnectedDevice) {
          // Gunakan device yang baru di-reconnect dengan retry count + 1
          return sendToUSBPrinter(reconnectedDevice, data, retryCount + 1);
        }
      }
      
      // Jika reconnect gagal atau sudah retry, throw error
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Gagal membuka koneksi ke printer: ${errorMessage}`);
    }
  }

  // Cari endpoint OUT yang benar dan claim interface dengan benar
  let endpointNumber: number | null = null;
  let claimedInterfaceNumber: number | null = null;

  try {
    const configuration = device.configuration;
    if (configuration) {
      const interfaces = configuration.interfaces;
      for (const iface of interfaces) {
        // Cari alternate yang memiliki endpoint OUT bulk
        for (const alt of iface.alternates || []) {
          for (const endpoint of alt.endpoints) {
            if (endpoint.direction === 'out' && endpoint.type === 'bulk') {
              // Pastikan interface di-claim sebelum menggunakan endpoint
              try {
                if (!iface.claimed) {
                  await device.claimInterface(iface.interfaceNumber);
                }
                // Set alternate interface jika diperlukan (biasanya alternate 0)
                if (alt !== iface.alternate && alt.interfaceNumber !== undefined) {
                  try {
                    await device.selectAlternateInterface(iface.interfaceNumber, alt.interfaceNumber);
                  } catch (altError) {
                    // Alternate mungkin sudah dipilih, lanjutkan
                    console.warn('Gagal select alternate interface:', altError);
                  }
                }
                endpointNumber = endpoint.endpointNumber;
                claimedInterfaceNumber = iface.interfaceNumber;
                break;
              } catch (claimError) {
                console.warn(`Gagal claim interface ${iface.interfaceNumber}, coba interface berikutnya:`, claimError);
                continue;
              }
            }
          }
          if (endpointNumber !== null) break;
        }
        if (endpointNumber !== null) break;
      }
    }
  } catch (e) {
    // Jika gagal mencari endpoint, gunakan default
    console.warn('Gagal mencari endpoint, menggunakan default:', e);
  }

  // Jika tidak ditemukan, coba interface 0 dengan endpoint 1 atau 2 (umum untuk printer ESC/POS)
  if (endpointNumber === null) {
    try {
      // Coba claim interface 0 jika belum di-claim
      try {
        await device.claimInterface(0);
        claimedInterfaceNumber = 0;
      } catch (e) {
        // Interface mungkin sudah di-claim, lanjutkan
      }
      // Coba endpoint 1 dulu
      endpointNumber = 1;
    } catch (e) {
      console.warn('Gagal setup default endpoint:', e);
    }
  }

  // Pastikan endpointNumber valid sebelum transfer
  if (endpointNumber === null) {
    throw new Error('Tidak dapat menemukan endpoint yang valid untuk printer. Pastikan printer terhubung dengan benar.');
  }

  // Pastikan interface sudah di-claim sebelum transfer
  if (claimedInterfaceNumber === null) {
    try {
      await device.claimInterface(0);
      claimedInterfaceNumber = 0;
    } catch (e) {
      // Interface mungkin sudah di-claim, lanjutkan
    }
  }

  // Kirim data ke printer
  try {
    await device.transferOut(endpointNumber, data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Jika error terkait endpoint/interface, coba reconnect
    if (errorMessage.includes('endpoint') || errorMessage.includes('interface') || errorMessage.includes('claimed')) {
      // Jika belum pernah retry, coba reconnect sekali
      if (retryCount === 0) {
        console.warn('Transfer gagal karena masalah endpoint/interface, mencoba reconnect:', errorMessage);
        const reconnectedDevice = await reconnectUSBDevice();
        if (reconnectedDevice) {
          // Coba kirim lagi dengan device yang baru dengan retry count + 1
          return sendToUSBPrinter(reconnectedDevice, data, retryCount + 1);
        }
      }
    }
    
    // Jika endpoint pertama gagal dan belum pernah retry, coba endpoint alternatif
    if (retryCount === 0 && endpointNumber === 1) {
      try {
        // Pastikan interface 0 sudah di-claim
        try {
          await device.claimInterface(0);
        } catch (e) {
          // Interface mungkin sudah di-claim
        }
        await device.transferOut(2, data);
        return; // Berhasil dengan endpoint 2
      } catch (err2) {
        // Jika endpoint 2 juga gagal, coba reconnect
        console.warn('Transfer ke endpoint 2 juga gagal, mencoba reconnect:', err2);
        const reconnectedDevice = await reconnectUSBDevice();
        if (reconnectedDevice) {
          return sendToUSBPrinter(reconnectedDevice, data, retryCount + 1);
        }
      }
    }
    
    throw new Error(`Gagal mengirim data ke printer. Pastikan printer terhubung dengan benar. Error: ${errorMessage}`);
  }
}

// Type untuk Bluetooth Device (menggunakan tipe dari web-apis.d.ts)
export type BluetoothDevice = {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  watchAdvertisements(): Promise<void>;
  unwatchAdvertisements(): void;
  addEventListener(type: 'advertisementreceived', listener: (event: BluetoothAdvertisingEvent) => void): void;
};

// Fungsi untuk reconnect Bluetooth device jika sudah pernah di-connect
export async function reconnectBluetoothDevice(): Promise<BluetoothDevice | null> {
  try {
    const hasBluetooth = typeof navigator.bluetooth !== 'undefined';
    if (!hasBluetooth) return null;

    // Web Bluetooth API tidak memiliki getDevices() seperti WebUSB
    // Perlu request device lagi, tapi kita bisa cek apakah ada permission
    // Untuk sekarang, return null dan akan di-reconnect saat print
    return null;
  } catch (error) {
    console.error('Gagal reconnect Bluetooth device:', error);
    return null;
  }
}

// Fungsi untuk mengirim data ke printer Bluetooth
export async function sendToBluetoothPrinter(device: BluetoothDevice, data: Uint8Array): Promise<void> {
  if (!device || typeof device !== 'object') {
    throw new Error('Device Bluetooth tidak tersedia. Pastikan printer sudah terhubung.');
  }

  try {
    // Connect ke GATT server jika belum
    if (!device.gatt) {
      throw new Error('Bluetooth device tidak memiliki GATT server');
    }
    if (!device.gatt.connected) {
      const server = await device.gatt.connect();
      
      // Cari service Serial Port Profile (SPP) - UUID standar untuk printer Bluetooth
      const service = await server.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
      
      // Cari characteristic untuk write
      const characteristic = await service.getCharacteristic('00001101-0000-1000-8000-00805f9b34fb');
      
      // Kirim data
      await characteristic.writeValue(data);
    } else {
      // Jika sudah connected, langsung kirim
      const service = await device.gatt.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00001101-0000-1000-8000-00805f9b34fb');
      await characteristic.writeValue(data);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Gagal mengirim data ke printer Bluetooth: ${errorMessage}`);
  }
}

// Fungsi universal untuk print ke printer (USB, Bluetooth, atau System)
export async function printToPrinter(
  connectionType: 'usb' | 'bluetooth' | 'system',
  device: USBDevice | BluetoothDevice | null,
  data: Uint8Array
): Promise<void> {
  if (connectionType === 'usb') {
    if (!device) {
      throw new Error('USB device tidak tersedia');
    }
    await sendToUSBPrinter(device as USBDevice, data);
  } else if (connectionType === 'bluetooth') {
    if (!device) {
      throw new Error('Bluetooth device tidak tersedia');
    }
    await sendToBluetoothPrinter(device as BluetoothDevice, data);
  } else {
    // System print - tidak perlu kirim data, akan menggunakan window.print()
    throw new Error('System print harus menggunakan window.print()');
  }
}

