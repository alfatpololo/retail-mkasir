/**
 * Interface untuk printer settings
 */
export interface PrinterSettings {
  storeName: string;
  address: string;
  phone: string;
  footerNote: string;
  paperSize: '58mm' | '80mm';
  autoPrint: boolean;
  showLogo: boolean;
}

/**
 * Mendapatkan printer settings dari localStorage atau pin_session
 */
export function getPrinterSettings(): PrinterSettings {
  const defaultSettings: PrinterSettings = {
    storeName: 'TOKO',
    address: '',
    phone: '',
    footerNote: 'Terima kasih',
    paperSize: '58mm',
    autoPrint: false,
    showLogo: false,
  };

  try {
    // Cek dari receipt_settings di localStorage (prioritas utama)
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('receipt_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return {
          storeName: parsed.storeName || defaultSettings.storeName,
          address: parsed.address || defaultSettings.address,
          phone: parsed.phone || defaultSettings.phone,
          footerNote: parsed.footerNote || defaultSettings.footerNote,
          paperSize: parsed.paperSize || defaultSettings.paperSize,
          autoPrint: parsed.autoPrint ?? defaultSettings.autoPrint,
          showLogo: parsed.showLogo ?? defaultSettings.showLogo,
        };
      }

      // Fallback: ambil dari pin_session
      const pinSession = localStorage.getItem('pin_session');
      if (pinSession) {
        const sessionData = JSON.parse(pinSession);
        return {
          storeName: sessionData.nama_kios || defaultSettings.storeName,
          address: sessionData.lokasi || defaultSettings.address,
          phone: sessionData.notelp || defaultSettings.phone,
          footerNote: sessionData.receipt_footer_text || defaultSettings.footerNote,
          paperSize: sessionData.paper_size || defaultSettings.paperSize,
          autoPrint: sessionData.auto_print === 1 || sessionData.auto_print === '1' || defaultSettings.autoPrint,
          showLogo: sessionData.show_logo_on_receipt === 1 || sessionData.show_logo_on_receipt === '1' || defaultSettings.showLogo,
        };
      }
    }
  } catch (error) {
    console.warn('Gagal membaca printer settings:', error);
  }

  return defaultSettings;
}

/**
 * Mengecek apakah auto print aktif
 */
export function isAutoPrintEnabled(): boolean {
  const settings = getPrinterSettings();
  return settings.autoPrint;
}

