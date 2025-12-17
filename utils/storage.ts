/**
 * Utility untuk menyimpan dan mengambil data dari localStorage/sessionStorage
 */

const STORAGE_KEY = 'mkasir_user_session';

export interface UserSession {
  biaya_lainnya: number;
  data: string;
  file_sound: string;
  kategori_kios: string;
  kode: string;
  level: string;
  media: string;
  nama_kios: string;
  nama_user: string;
  notelp: string;
  owner: boolean;
  pajak: number;
  setLayoutDashboard: string;
  stall_id: number;
  stall_id_master: number;
  status_biaya_lainnya: boolean;
  status_jenis_kios: string;
  status_pajak: boolean;
  status_paket: string;
  status_sales: {
    id: number;
    nama: string;
  };
  type_kios: string;
  user_id: number;
  user_id_master: number;
}

/**
 * Simpan session user ke localStorage
 */
export function saveUserSession(sessionData: UserSession): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error saving user session:', error);
    // Fallback ke sessionStorage jika localStorage penuh
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.error('Error saving to sessionStorage:', e);
    }
  }
}

/**
 * Ambil session user dari localStorage
 */
export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Fallback ke sessionStorage
    const sessionStored = sessionStorage.getItem(STORAGE_KEY);
    if (sessionStored) {
      return JSON.parse(sessionStored);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

/**
 * Hapus session user
 */
export function clearUserSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing user session:', error);
  }
}

/**
 * Cek apakah user sudah login
 */
export function isUserLoggedIn(): boolean {
  return getUserSession() !== null;
}

/**
 * Logout total:
 * - Hapus session user (mkasir_user_session)
 * - Hapus currentUser, jwt, jwt_pin, pin_session
 * - Hapus status/bendera kasir lokal (status_uang_bukakasir, cashier_*)
 */
export function logoutUser(): void {
  if (typeof window === 'undefined') return;

  try {
    // Hapus session utama
    clearUserSession();

    // Hapus data user & PIN
    localStorage.removeItem('currentUser');
    localStorage.removeItem('jwt');
    localStorage.removeItem('jwt_pin');
    localStorage.removeItem('pin_session');

    // Hapus flag-status lain yang dipakai di app
    localStorage.removeItem('status_uang_bukakasir');

    // Key lokal yang dipakai modul kasir
    localStorage.removeItem('cashier_is_open');
    localStorage.removeItem('cashier_last_open_date');
    localStorage.removeItem('cashier_last_open_saldo');
    localStorage.removeItem('cashier_bukakas_id');

    // Bersihkan juga sessionStorage cadangan
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error during logout:', error);
  }
}


