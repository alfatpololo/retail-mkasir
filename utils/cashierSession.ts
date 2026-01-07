import { API_BASE_URL } from './api';

// Key lokal untuk status sesi kasir
const KEY_IS_OPEN = 'cashier_is_open';
const KEY_LAST_OPEN_DATE = 'cashier_last_open_date';
const KEY_LAST_OPEN_SALDO = 'cashier_last_open_saldo';
const KEY_BUKAKAS_ID = 'cashier_bukakas_id';

// Model data ringkasan tutup kasir (disederhanakan, cukup yang dipakai UI)
export interface TutupKasirData {
  biaya_lainnya: number;
  biayapengeluaran?: number;
  catatan: string;
  diskon: number;
  nontunai: number;
  pajak: number;
  // ringkasan tambahan dari API baru
  total_pendapatan?: number;
  total_pendapatan_selesai?: number;
  total_piutang?: number;
  total_transaksi_piutang?: number;
  pengeluaran?: Array<{
    id?: number | string;
    nama?: string;
    nominal?: number;
    jenis?: string;
    catatan?: string;
    tanggal?: string;
    created_at?: string;
  }>;
  produkterjual?: Array<{
    nama_kategori?: string;
    produk?: Array<{
      id?: number | string;
      nama?: string;
      nama_kategori?: string;
      qty?: number;
      jumlah_terbeli?: number;
      harga?: number;
      subtotal?: number;
    }>;
  }>;
  saldo_kas: number;
  total: number;
  total_transaksi: number;
  tunai: number;
  waktu_buka: string;
  waktu_sekarang: string;
  waktu_tutup: string;
}

// Model data bukakas dari API bukakas/{id}
export interface BukakasData {
  id: number;
  created_at: string;
  updated_at: string;
  stall_id: number;
  user_id: number;
  waktu_buka: string;
  saldo_kas: number;
  modal_awal: number;
  tunai: number;
  non_tunai: number;
  total_transaksi: number;
  total_penjualan: number;
  catatan: string;
  status: string;
  user: {
    id: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    nama: string;
    notelp: string;
    kode: string;
    level: string;
    status: boolean;
    token_devices: string;
    stall_id: number;
    last_login: string;
  };
}

export interface BukakasResponse {
  success: boolean;
  message: string;
  data: BukakasData;
}

/** Ambil user_id yang login dari localStorage.currentUser */
export function getLoggedInUserId(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const str = localStorage.getItem('currentUser');
    if (!str) return null;
    const obj = JSON.parse(str);
    const id = obj?.id ?? obj?.user_id;
    return typeof id === 'number' ? id : Number(id) || null;
  } catch {
    return null;
  }
}

/** Ambil status_uang_bukakasir yang disimpan saat login PIN (jika ada) */
export function getStatusUangBukakasir(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem('status_uang_bukakasir');
  return raw ? Number(raw) || 0 : 0;
}

export function markOpened(params: { saldoAwal: number; bukakasId?: number }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_IS_OPEN, 'true');
  localStorage.setItem(KEY_LAST_OPEN_DATE, new Date().toISOString());
  localStorage.setItem(KEY_LAST_OPEN_SALDO, String(params.saldoAwal));
  if (params.bukakasId) {
    localStorage.setItem(KEY_BUKAKAS_ID, String(params.bukakasId));
  }
}

export function markClosed() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_IS_OPEN, 'false');
  localStorage.removeItem(KEY_BUKAKAS_ID);
  localStorage.removeItem(KEY_LAST_OPEN_DATE);
}

export function getBukakasId(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY_BUKAKAS_ID);
  return raw ? Number(raw) || null : null;
}

/** Cek perlu buka / tutup kasir (dipakai di POS) */
export async function shouldShowBukaKasir(): Promise<{
  needOpen: boolean;
  needClose: boolean;
}> {
  const userId = getLoggedInUserId();
  if (!userId) return { needOpen: true, needClose: false };

  const jwtPin =
    typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;

  if (!jwtPin) {
    // Belum login PIN, nanti dicek lagi setelah login
    return { needOpen: false, needClose: false };
  }

  try {
    const url = `${API_BASE_URL}/bukakas/current?user_id=${userId}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtPin}`,
      },
      cache: 'no-store', // Pastikan tidak menggunakan cache browser
    });

    const json = await res.json().catch(() => ({} as { success?: boolean; message?: string; data?: unknown }));
    const success = json.success === true;
    
    // Tangani berbagai struktur response data
    // API bisa mengembalikan data langsung atau nested di dalam data
    let bukakasData = json.data as { id?: number; bukakas_id?: number; bukakasId?: number; [key: string]: unknown } | undefined;
    
    // Jika data tidak ada di json.data, coba langsung dari json (untuk backward compatibility)
    if (!bukakasData && json && typeof json === 'object' && 'id' in json) {
      bukakasData = json as { id?: number; bukakas_id?: number; bukakasId?: number; [key: string]: unknown };
    }
    
    const message: string = (json.message as string) || '';

    // Cek apakah benar-benar ada bukakas aktif
    // Cek berbagai kemungkinan field untuk ID
    const hasBukakasId = !!(
      bukakasData?.id || 
      bukakasData?.bukakas_id || 
      bukakasData?.bukakasId ||
      (typeof bukakasData === 'object' && bukakasData && 'id' in bukakasData)
    );

    // Jika server bilang tidak ada bukakas aktif secara eksplisit,
    // (status 404 atau success: false dengan message yang sesuai)
    // cek status_uang_bukakasir. Hanya auto-buka kasir jika status_uang_bukakasir === 1
    if ((!res.ok || !success || !hasBukakasId) && 
        (message.toLowerCase().includes('no active bukakas') || 
         message.toLowerCase().includes('not found') ||
         res.status === 404)) {
      const statusUangBukakasir = getStatusUangBukakasir();
      
      // Jika status_uang_bukakasir === 1, auto-buka kasir
      if (statusUangBukakasir === 1) {
        console.log(
          'Tidak ada bukakas aktif, status_uang_bukakasir = 1, mencoba otomatis buka kasir dengan saldo awal 0'
        );

        try {
          const saldoAwal = 0;
          const result = await bukaKasirApi({
            saldoAwal,
            catatan: '',
            permanen: false,
          });

          // Verifikasi bahwa bukakas_id benar-benar tersimpan setelah auto-buka kasir
          const savedBukakasId = getBukakasId();
          if (!savedBukakasId) {
            // Coba ambil dari response API dan simpan manual
            const responseData = result?.data as { id?: number; bukakas_id?: number; bukakasId?: number; [key: string]: unknown } | undefined;
            const bukakasId = responseData?.id ?? responseData?.bukakas_id ?? responseData?.bukakasId;
            if (bukakasId && typeof bukakasId === 'number') {
              localStorage.setItem(KEY_BUKAKAS_ID, String(bukakasId));
            } else {
              throw new Error('Gagal mendapatkan bukakas_id setelah auto-buka kasir');
            }
          }

          // Setelah buka kasir berhasil, anggap tidak perlu buka/tutup lagi sekarang
          // (bukakasId dan status lokal sudah di-set di bukaKasirApi -> markOpened)
          return { needOpen: false, needClose: false };
        } catch (e) {
          // Kalau gagal otomatis buka kasir, lanjut ke flow lama (needOpen: true)
          // Error sudah di-log di bukaKasirApi, tidak perlu log lagi di sini
        }
      }
      // Jika status_uang_bukakasir !== 1, tidak auto-buka kasir
      // Flow akan lanjut ke bawah dan return needOpen: true
    }

    // Jika ada bukakas aktif di server (status 200 dengan success: true DAN ada data DAN ada id)
    // Atau jika status 200 meskipun success tidak eksplisit true (untuk backward compatibility)
    if (res.ok && ((success && bukakasData && hasBukakasId) || (bukakasData && hasBukakasId))) {
      const bukakasId =
        bukakasData.id ?? bukakasData.bukakas_id ?? bukakasData.bukakasId;
      
      if (bukakasId && typeof bukakasId === 'number') {
        // Simpan bukakas_id ke localStorage untuk digunakan di aplikasi
        localStorage.setItem(KEY_BUKAKAS_ID, String(bukakasId));
      }

      const saldo = bukakasData.modal_awal ?? bukakasData.saldo_awal;
      if (typeof saldo === 'number') {
        localStorage.setItem(KEY_LAST_OPEN_SALDO, String(saldo));
      }

      const openDateRaw =
        bukakasData.created_at ??
        bukakasData.open_date ??
        bukakasData.tanggal;
      const openDate =
        openDateRaw && (typeof openDateRaw === 'string' || typeof openDateRaw === 'number' || openDateRaw instanceof Date)
          ? new Date(openDateRaw as string | number | Date)
          : new Date();
      localStorage.setItem(KEY_IS_OPEN, 'true');
      localStorage.setItem(KEY_LAST_OPEN_DATE, openDate.toISOString());

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bukakasDate = new Date(openDate);
      bukakasDate.setHours(0, 0, 0, 0);
      const isOverdue = bukakasDate < today;

      if (isOverdue) {
        return { needOpen: true, needClose: true };
      }

      return { needOpen: false, needClose: false };
    }

    // Tidak ada bukakas aktif di server (success: false ATAU data: null ATAU tidak ada id)
    // Clear semua data lokal kasir untuk memastikan tidak ada data lama
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY_IS_OPEN, 'false');
      localStorage.removeItem(KEY_BUKAKAS_ID);
      localStorage.removeItem(KEY_LAST_OPEN_DATE);
      localStorage.removeItem(KEY_LAST_OPEN_SALDO);
    }
    
    return { needOpen: true, needClose: false };
  } catch (error) {
    // Fallback ke lokal - hanya jika API error (network error, dll)
    // Tapi jika error karena tidak ada bukakas, jangan pakai data lokal
    if (typeof window === 'undefined') {
      return { needOpen: true, needClose: false };
    }
    
    // Jika API error, untuk aman anggap tidak ada bukakas aktif dan clear data lokal
    // Karena kita tidak bisa verifikasi apakah bukakas_id masih valid
    localStorage.setItem(KEY_IS_OPEN, 'false');
    localStorage.removeItem(KEY_BUKAKAS_ID);
    localStorage.removeItem(KEY_LAST_OPEN_DATE);
    localStorage.removeItem(KEY_LAST_OPEN_SALDO);
    return { needOpen: true, needClose: false };
  }
}

/** Panggil API buka kasir */
export async function bukaKasirApi(params: {
  saldoAwal: number;
  catatan: string;
  permanen: boolean;
}) {
  const userId = getLoggedInUserId();
  if (!userId) throw new Error('User tidak ditemukan');

  const jwtPin =
    typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
  if (!jwtPin) throw new Error('JWT PIN tidak ditemukan');

  const res = await fetch(`${API_BASE_URL}/bukakas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtPin}`,
    },
    body: JSON.stringify({
      user_id: userId,
      modal_awal: params.saldoAwal,
      catatan: params.catatan,
      permanen: params.permanen ? 1 : 0,
    }),
  });

  const json = await res.json().catch(() => ({} as { success?: boolean; message?: string; data?: unknown }));
  if (!res.ok || json.success === false) {
    throw new Error((json.message as string) || 'Gagal buka kasir');
  }

  const bukakasData = json.data || {};
  const bukakasId =
    bukakasData.id ?? bukakasData.bukakas_id ?? bukakasData.bukakasId;

  markOpened({
    saldoAwal: params.saldoAwal,
    bukakasId: typeof bukakasId === 'number' ? bukakasId : undefined,
  });

  return json;
}

/** Panggil API tutup kasir */
export async function tutupKasirApi(catatan: string) {
  const userId = getLoggedInUserId();
  if (!userId) throw new Error('User tidak ditemukan');

  const jwtPin =
    typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
  if (!jwtPin) throw new Error('JWT PIN tidak ditemukan');

  const res = await fetch(`${API_BASE_URL}/bukakas/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtPin}`,
    },
    body: JSON.stringify({
      user_id: userId,
      catatan: catatan ?? '',
    }),
  });

  const json = await res.json().catch(() => ({} as { success?: boolean; message?: string; data?: unknown }));
  if (!res.ok || json.success === false) {
    throw new Error((json.message as string) || 'Gagal tutup kasir');
  }

  markClosed();
  return json;
}

/** Ambil ringkasan tutup kasir
 * Catatan:
 * - Jika bukakas_id tidak ada di localStorage, tetap kirim request tanpa field itu.
 *   Banyak API akan otomatis pakai sesi bukakas aktif berdasarkan user.
 */
export async function fetchTutupKasirData(): Promise<TutupKasirData | null> {
  // Pastikan dulu kita sudah sinkron dengan server:
  // kalau masih ada bukakas aktif di /bukakas/current, ambil id-nya dan simpan.
  try {
    const status = await shouldShowBukaKasir();
    // Kalau server bilang tidak ada bukakas aktif (needOpen true dan needClose false),
    // artinya memang belum ada sesi buka kasir, langsung kembalikan null.
    if (status.needOpen && !status.needClose) {
      return null;
    }
  } catch {
    // kalau gagal sync, lanjut pakai data lokal apa adanya
  }

  const jwtPin =
    typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
  if (!jwtPin) throw new Error('JWT PIN tidak ditemukan');

  const bukakasId = getBukakasId();
  const payload: Record<string, unknown> = {};
  const userId = getLoggedInUserId();
  if (userId) {
    payload.user_id = userId;
  }
  if (bukakasId) {
    payload.bukakas_id = bukakasId;
  }

  const res = await fetch(`${API_BASE_URL}/bukakas/tutupkasir`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtPin}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({} as { success?: boolean; message?: string; data?: TutupKasirData }));
  if (!res.ok || json.success === false || !json.data) {
    // Beri informasi lebih detail untuk ditampilkan di UI
    const message =
      (json.message as string) ||
      `Gagal mengambil data ringkasan kasir (status: ${res.status})`;
    throw new Error(message);
  }

  return json.data as TutupKasirData;
}

/** Ambil data bukakas dari API bukakas/{id} */
export async function fetchBukakasData(id: number): Promise<BukakasData> {
  const jwtPin =
    typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
  if (!jwtPin) throw new Error('JWT PIN tidak ditemukan');

  const res = await fetch(`${API_BASE_URL}/bukakas/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtPin}`,
    },
  });

  const json = await res.json().catch(() => ({} as { success?: boolean; message?: string; data?: BukakasData }));
  if (!res.ok || json.success === false || !json.data) {
    const message =
      (json.message as string) ||
      `Gagal mengambil data bukakas (status: ${res.status})`;
    throw new Error(message);
  }

  return json.data as BukakasData;
}


