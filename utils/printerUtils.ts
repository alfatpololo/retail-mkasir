// Utility functions untuk print ESC/POS

// Type untuk USB Device (WebUSB API)
// Menggunakan any karena WebUSB API belum ada di TypeScript standard library
export type USBDevice = any;

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
}

// Fungsi untuk generate ESC/POS receipt
export function generateReceiptESC_POS(data: ReceiptData): Uint8Array {
  const encoder = new TextEncoder();
  const commands: number[] = [];

  // Helper function untuk separator
  const addSeparator = () => {
    const dashes = Array(32).fill(0x2D); // 32 dashes
    commands.push(...dashes);
    commands.push(0x0A); // LF
  };

  // Initialize printer
  commands.push(0x1B, 0x40); // ESC @

  // Center align
  commands.push(0x1B, 0x61, 0x01); // ESC a 1

  // Double width & height untuk header
  commands.push(0x1D, 0x21, 0x11); // GS ! 11

  // Store name
  const storeName = data.storeName || 'TOKO';
  const storeBytes = encoder.encode(storeName.toUpperCase());
  commands.push(...Array.from(storeBytes));
  commands.push(0x0A); // LF

  // Reset text size
  commands.push(0x1D, 0x21, 0x00); // GS ! 00

  // Address
  if (data.address) {
    const addressBytes = encoder.encode(data.address);
    commands.push(...Array.from(addressBytes));
    commands.push(0x0A); // LF
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
  commands.push(0x0A, 0x0A); // LF x2

  // Customer name (jika ada)
  if (data.customerName) {
    const customerLabel = encoder.encode('Customer: ');
    const customerNameBytes = encoder.encode(data.customerName);
    commands.push(...Array.from(customerLabel));
    commands.push(...Array.from(customerNameBytes));
    commands.push(0x0A, 0x0A); // LF x2
  }

  // Items header
  commands.push(0x1B, 0x45, 0x01); // ESC E 1 - Bold ON
  const itemsHeader = encoder.encode('ITEM          QTY    HARGA');
  commands.push(...Array.from(itemsHeader));
  commands.push(0x1B, 0x45, 0x00); // ESC E 0 - Bold OFF
  commands.push(0x0A); // LF
  addSeparator();

  // Items
  data.items.forEach((item) => {
    // Item name (truncate jika terlalu panjang)
    let itemName = item.name;
    if (itemName.length > 20) {
      itemName = itemName.substring(0, 17) + '...';
    }
    const nameBytes = encoder.encode(itemName);
    commands.push(...Array.from(nameBytes));
    
    // Spacing
    const spaces = ' '.repeat(Math.max(0, 20 - itemName.length));
    const spaceBytes = encoder.encode(spaces);
    commands.push(...Array.from(spaceBytes));

    // Quantity
    const qty = `${item.quantity}x`;
    const qtyBytes = encoder.encode(qty);
    commands.push(...Array.from(qtyBytes));

    // Spacing
    commands.push(0x20, 0x20); // 2 spaces

    // Price
    const priceStr = item.price.toLocaleString('id-ID');
    const priceBytes = encoder.encode(priceStr);
    commands.push(...Array.from(priceBytes));
    commands.push(0x0A); // LF

    // Subtotal line
    const subtotalLabel = '  Subtotal:';
    const subtotalLabelBytes = encoder.encode(subtotalLabel);
    commands.push(...Array.from(subtotalLabelBytes));

    // Spacing
    const subtotalSpaces = ' '.repeat(Math.max(0, 15 - subtotalLabel.length));
    const subtotalSpaceBytes = encoder.encode(subtotalSpaces);
    commands.push(...Array.from(subtotalSpaceBytes));

    // Subtotal value
    const subtotalStr = item.subtotal.toLocaleString('id-ID');
    const subtotalBytes = encoder.encode(subtotalStr);
    commands.push(...Array.from(subtotalBytes));
    commands.push(0x0A); // LF
  });

  commands.push(0x0A); // LF

  // Separator
  addSeparator();

  // Subtotal
  const subtotalLabel = encoder.encode('Subtotal:');
  commands.push(...Array.from(subtotalLabel));
  const subtotalSpaces = ' '.repeat(20);
  const subtotalSpaceBytes = encoder.encode(subtotalSpaces);
  commands.push(...Array.from(subtotalSpaceBytes));
  const subtotalStr = data.subtotal.toLocaleString('id-ID');
  const subtotalValueBytes = encoder.encode(subtotalStr);
  commands.push(...Array.from(subtotalValueBytes));
  commands.push(0x0A); // LF

  // Tax (jika ada)
  if (data.tax && data.tax > 0) {
    const taxLabel = encoder.encode('Pajak:');
    commands.push(...Array.from(taxLabel));
    const taxSpaces = ' '.repeat(23);
    const taxSpaceBytes = encoder.encode(taxSpaces);
    commands.push(...Array.from(taxSpaceBytes));
    const taxStr = data.tax.toLocaleString('id-ID');
    const taxValueBytes = encoder.encode(taxStr);
    commands.push(...Array.from(taxValueBytes));
    commands.push(0x0A); // LF
  }

  // Discount (jika ada)
  if (data.discount && data.discount > 0) {
    const discLabel = encoder.encode('Diskon:');
    commands.push(...Array.from(discLabel));
    const discSpaces = ' '.repeat(22);
    const discSpaceBytes = encoder.encode(discSpaces);
    commands.push(...Array.from(discSpaceBytes));
    const discStr = `-${data.discount.toLocaleString('id-ID')}`;
    const discValueBytes = encoder.encode(discStr);
    commands.push(...Array.from(discValueBytes));
    commands.push(0x0A); // LF
  }

  // Total (bold)
  commands.push(0x1B, 0x45, 0x01); // ESC E 1 - Bold ON
  commands.push(0x1D, 0x21, 0x11); // GS ! 11 - Double width & height
  const totalLabel = encoder.encode('TOTAL:');
  commands.push(...Array.from(totalLabel));
  const totalSpaces = ' '.repeat(10);
  const totalSpaceBytes = encoder.encode(totalSpaces);
  commands.push(...Array.from(totalSpaceBytes));
  const totalStr = data.total.toLocaleString('id-ID');
  const totalValueBytes = encoder.encode(totalStr);
  commands.push(...Array.from(totalValueBytes));
  commands.push(0x1D, 0x21, 0x00); // GS ! 00 - Normal size
  commands.push(0x1B, 0x45, 0x00); // ESC E 0 - Bold OFF
  commands.push(0x0A, 0x0A); // LF x2

  // Payment info
  const paidLabel = encoder.encode('Bayar:');
  commands.push(...Array.from(paidLabel));
  const paidSpaces = ' '.repeat(23);
  const paidSpaceBytes = encoder.encode(paidSpaces);
  commands.push(...Array.from(paidSpaceBytes));
  const paidStr = data.paid.toLocaleString('id-ID');
  const paidValueBytes = encoder.encode(paidStr);
  commands.push(...Array.from(paidValueBytes));
  commands.push(0x0A); // LF

  if (!data.isDebt && data.change > 0) {
    const changeLabel = encoder.encode('Kembali:');
    commands.push(...Array.from(changeLabel));
    const changeSpaces = ' '.repeat(21);
    const changeSpaceBytes = encoder.encode(changeSpaces);
    commands.push(...Array.from(changeSpaceBytes));
    const changeStr = data.change.toLocaleString('id-ID');
    const changeValueBytes = encoder.encode(changeStr);
    commands.push(...Array.from(changeValueBytes));
    commands.push(0x0A); // LF
  }

  // Payment method
  const methodLabel = encoder.encode(`Metode: ${data.paymentMethod}`);
  commands.push(...Array.from(methodLabel));
  commands.push(0x0A, 0x0A); // LF x2

  // Separator
  addSeparator();

  // Footer
  if (data.footerNote) {
    commands.push(0x1B, 0x61, 0x01); // ESC a 1 - Center align
    const footerBytes = encoder.encode(data.footerNote);
    commands.push(...Array.from(footerBytes));
    commands.push(0x1B, 0x61, 0x00); // ESC a 0 - Left align
    commands.push(0x0A, 0x0A); // LF x2
  }

  // Cut paper (partial cut)
  commands.push(0x1D, 0x56, 0x42, 0x00); // GS V B 0

  return new Uint8Array(commands);
}

// Fungsi untuk reconnect USB device jika sudah pernah di-connect
export async function reconnectUSBDevice(): Promise<USBDevice | null> {
  try {
    const hasWebUSB = typeof (navigator as any).usb !== 'undefined';
    if (!hasWebUSB) return null;

    const devices = await (navigator as any).usb.getDevices();
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
export async function sendToUSBPrinter(device: USBDevice, data: Uint8Array): Promise<void> {
  if (!device || typeof device !== 'object') {
    throw new Error('Device USB tidak tersedia. Pastikan printer sudah terhubung.');
  }

  // Pastikan device sudah terbuka
  if (!device.opened) {
    try {
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);
    } catch (error: any) {
      throw new Error(`Gagal membuka koneksi ke printer: ${error?.message || error}`);
    }
  }

  // Cari endpoint OUT yang benar
  let endpointNumber: number | null = null;

  try {
    const configuration = device.configuration;
    if (configuration) {
      const interfaces = configuration.interfaces;
      for (const iface of interfaces) {
        // Pastikan interface sudah di-claim
        if (!iface.claimed) {
          try {
            await device.claimInterface(iface.interfaceNumber);
          } catch (e) {
            // Interface mungkin sudah di-claim, lanjutkan
          }
        }

        for (const alt of iface.alternates) {
          for (const endpoint of alt.endpoints) {
            if (endpoint.direction === 'out' && endpoint.type === 'bulk') {
              endpointNumber = endpoint.endpointNumber;
              break;
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

  // Jika tidak ditemukan, coba endpoint 1 atau 2 (umum untuk printer ESC/POS)
  if (endpointNumber === null) {
    endpointNumber = 1;
  }

  // Kirim data ke printer
  try {
    await device.transferOut(endpointNumber, data);
  } catch (error) {
    // Jika endpoint pertama gagal, coba endpoint 2
    if (endpointNumber === 1) {
      try {
        await device.transferOut(2, data);
      } catch (err2) {
        throw new Error(`Gagal mengirim data ke printer. Pastikan printer terhubung dengan benar. Error: ${err2}`);
      }
    } else {
      throw new Error(`Gagal mengirim data ke printer. Pastikan printer terhubung dengan benar. Error: ${error}`);
    }
  }
}

// Fungsi untuk reconnect Bluetooth device jika sudah pernah di-connect
export async function reconnectBluetoothDevice(): Promise<any | null> {
  try {
    const hasBluetooth = typeof (navigator as any).bluetooth !== 'undefined';
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
export async function sendToBluetoothPrinter(device: any, data: Uint8Array): Promise<void> {
  if (!device || typeof device !== 'object') {
    throw new Error('Device Bluetooth tidak tersedia. Pastikan printer sudah terhubung.');
  }

  try {
    // Connect ke GATT server jika belum
    if (!device.gatt || !device.gatt.connected) {
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
  } catch (error: any) {
    throw new Error(`Gagal mengirim data ke printer Bluetooth: ${error?.message || error}`);
  }
}

// Fungsi universal untuk print ke printer (USB, Bluetooth, atau System)
export async function printToPrinter(
  connectionType: 'usb' | 'bluetooth' | 'system',
  device: any,
  data: Uint8Array
): Promise<void> {
  if (connectionType === 'usb') {
    await sendToUSBPrinter(device, data);
  } else if (connectionType === 'bluetooth') {
    await sendToBluetoothPrinter(device, data);
  } else {
    // System print - tidak perlu kirim data, akan menggunakan window.print()
    throw new Error('System print harus menggunakan window.print()');
  }
}

