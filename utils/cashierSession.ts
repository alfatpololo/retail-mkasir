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
  produkterjual?: any;
  saldo_kas: number;
  total: number;
  total_transaksi: number;
  tunai: number;
  waktu_buka: string;
  waktu_sekarang: string;
  waktu_tutup: string;
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
    });

    const json = await res.json().catch(() => ({} as any));
    const success = json.success === true;
    const bukakasData = json.data;

    if (success && bukakasData) {
      const bukakasId =
        bukakasData.id ?? bukakasData.bukakas_id ?? bukakasData.bukakasId;
      if (bukakasId) {
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
      const openDate = openDateRaw ? new Date(openDateRaw) : new Date();
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

    // Tidak ada bukakas aktif
    return { needOpen: true, needClose: false };
  } catch {
    // Fallback ke lokal
    if (typeof window === 'undefined') {
      return { needOpen: true, needClose: false };
    }
    const isOpen = localStorage.getItem(KEY_IS_OPEN) === 'true';
    const lastOpenStr = localStorage.getItem(KEY_LAST_OPEN_DATE);
    if (!isOpen || !lastOpenStr) return { needOpen: true, needClose: false };

    const last = new Date(lastOpenStr);
    const today = new Date();
    last.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (last < today) {
      return { needOpen: true, needClose: true };
    }

    return { needOpen: false, needClose: false };
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

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Gagal buka kasir');
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

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Gagal tutup kasir');
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

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json.success === false || !json.data) {
    // Beri informasi lebih detail untuk ditampilkan di UI
    const message =
      json.message ||
      `Gagal mengambil data ringkasan kasir (status: ${res.status})`;
    throw new Error(message);
  }

  return json.data as TutupKasirData;
}


