/**
 * Konfigurasi API Base URL
 * 
 * Untuk mengubah URL API, edit nilai di bawah ini:
 * - Ganti 'https://your-api-url.com/api' dengan URL API yang sebenarnya
 * - Atau set environment variable NEXT_PUBLIC_API_URL saat build
 * 
 * Contoh: 'https://api.example.com/api' atau 'http://localhost:8000/api'
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-url.com/api';

/**
 * Interface untuk request login
 */
export interface LoginRequest {
  notelp: string;
  password: string;
  device: string;
  version: string;
}

/**
 * Interface untuk response login
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
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
  };
}

/**
 * Interface untuk user dari user-stall
 */
export interface UserStall {
  created_at: string;
  id: number;
  kode: string;
  last_login: string | null;
  level: string;
  nama: string;
  notelp: string;
  pin: string;
  stall_id: number;
  status: boolean;
  updated_at: string;
}

/**
 * Interface untuk response user-stall
 */
export interface UserStallResponse {
  success: boolean;
  message: string;
  data: {
    tenant_stall_id: number;
    total: number;
    users: UserStall[];
  };
}

/**
 * Interface untuk request login PIN
 */
export interface LoginPinRequest {
  pin: string;
  user_id: number;
}

/**
 * Interface untuk response login PIN
 */
export interface LoginPinResponse {
  success: boolean;
  message: string;
  data: {
    auto_print: string;
    data: string;
    last_login: string;
    level: string;
    logo: string;
    lokasi: string;
    nama: string;
    nama_kios: string;
    notelp: string;
    permissions: Array<{
      action: string;
      description: string;
      display_name: string;
      id: number;
      module: string;
      name: string;
    }>;
    pin: string;
    qris: string;
    receipt_footer_text: string;
    show_logo_on_receipt: number;
    stall_id: number;
    status: boolean;
    status_uang_bukakasir: number;
    user_id: number;
  };
  jwt?: string;
}

/**
 * Fungsi untuk melakukan login
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat melakukan login');
  }
}

/**
 * Fungsi untuk mengambil data users dari user-stall
 */
export async function getUserStall(jwt: string): Promise<UserStallResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/user-stall`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: UserStallResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat mengambil data users');
  }
}

/**
 * Fungsi untuk login dengan PIN
 */
export async function loginPin(credentials: LoginPinRequest, jwt: string): Promise<LoginPinResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: LoginPinResponse = await response.json();
    
    // Ambil JWT dari header Authorization atau dari field data.data (encrypted JWT)
    const authHeader = response.headers.get('Authorization');
    const jwtPin = authHeader?.replace('Bearer ', '') || data.data.data;
    
    return {
      ...data,
      jwt: jwtPin,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat verifikasi PIN');
  }
}

