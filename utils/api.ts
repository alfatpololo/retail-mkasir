/**
 * Konfigurasi API Base URL
 * 
 * Untuk mengubah URL API, edit nilai di bawah ini:
 * - Ganti dengan URL API yang sebenarnya
 * - Atau set environment variable NEXT_PUBLIC_API_URL saat build
 * 
 * Contoh: 'https://api.example.com/api' atau 'http://localhost:8000/api'
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Interface untuk konfigurasi fetch API
 */
interface FetchApiOptions extends RequestInit {
  jwt?: string;
  body?: any;
}

/**
 * Helper function untuk melakukan fetch API dengan error handling yang konsisten
 */
async function fetchApi<T>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const { jwt, body, headers: customHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store', // Pastikan selalu fetch data terbaru, tidak menggunakan cache
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string })?.message ||
        `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Helper function untuk menangani error dengan pesan yang konsisten
 */
function handleApiError(error: unknown, defaultMessage: string): never {
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(defaultMessage);
}

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
    return await fetchApi<LoginResponse>('/login', {
      method: 'POST',
      body: credentials,
    });
  } catch (error) {
    handleApiError(error, 'Terjadi kesalahan saat melakukan login');
  }
}

/**
 * Fungsi untuk mengambil data users dari user-stall
 */
export async function getUserStall(jwt: string): Promise<UserStallResponse> {
  try {
    return await fetchApi<UserStallResponse>('/user-stall', {
      method: 'GET',
      jwt,
    });
  } catch (error) {
    handleApiError(error, 'Terjadi kesalahan saat mengambil data users');
  }
}

/**
 * Fungsi untuk login dengan PIN
 */
export async function loginPin(
  credentials: LoginPinRequest,
  jwt: string
): Promise<LoginPinResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(credentials),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string })?.message ||
          `HTTP error! status: ${response.status}`
      );
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
    handleApiError(error, 'Terjadi kesalahan saat verifikasi PIN');
  }
}

/**
 * Interface untuk receipt settings
 */
export interface ReceiptSettings {
  storeName: string;
  address: string;
  phone: string;
  footerNote: string;
  paperSize: string;
  printer: string;
  autoPrint?: boolean;
  showLogo?: boolean;
}

/**
 * Interface untuk response settings
 */
export interface SettingsResponse {
  success: boolean;
  message: string;
  data: ReceiptSettings;
}

/**
 * Fungsi untuk mengambil pengaturan struk dari API
 */
export async function getReceiptSettings(
  jwt: string
): Promise<SettingsResponse> {
  try {
    return await fetchApi<SettingsResponse>('/settings/receipt', {
      method: 'GET',
      jwt,
    });
  } catch (error) {
    handleApiError(error, 'Terjadi kesalahan saat mengambil pengaturan struk');
  }
}

/**
 * Fungsi untuk menyimpan pengaturan struk ke API
 */
export async function saveReceiptSettings(
  settings: ReceiptSettings,
  jwt: string
): Promise<SettingsResponse> {
  try {
    return await fetchApi<SettingsResponse>('/settings/receipt', {
      method: 'POST',
      jwt,
      body: settings,
    });
  } catch (error) {
    handleApiError(error, 'Terjadi kesalahan saat menyimpan pengaturan struk');
  }
}

/**
 * Interface untuk payload update printer
 */
export interface UpdatePrinterPayload {
  nama: string;
  alamat: string;
  notelp: string;
  receipt_footer_text: string;
  paper_size: string;
  auto_print: number; // 1 atau 0
  show_logo_on_receipt: number; // 1 atau 0
}

/**
 * Interface untuk response update printer
 */
export interface UpdatePrinterResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * PUT /api/v1/master/stall/update_printer - Update pengaturan printer/struk
 */
export async function updatePrinterSettings(
  payload: UpdatePrinterPayload,
  jwt: string
): Promise<UpdatePrinterResponse> {
  try {
    return await fetchApi<UpdatePrinterResponse>(
      '/master/stall/update_printer',
      {
        method: 'PUT',
        jwt,
        body: payload,
      }
    );
  } catch (error) {
    handleApiError(error, 'Terjadi kesalahan saat menyimpan pengaturan printer');
  }
}

/**
 * Interface untuk Employee (User Tenant)
 */
export interface Employee {
  id: number;
  nama: string;
  kode: string;
  notelp: string;
  level: string;
  pin?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  stall_id: number;
}

/**
 * Interface untuk response employee list
 */
export interface EmployeeListResponse {
  success: boolean;
  message: string;
  data: {
    tenant_stall_id: number;
    total: number;
    users: Employee[];
  };
}

/**
 * Interface untuk response single employee
 */
export interface EmployeeResponse {
  success: boolean;
  message: string;
  data: Employee;
}

/**
 * Normalisasi nomor telepon: 08xxx -> 628xxx
 */
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.substring(1);
  } else if (!normalized.startsWith('62')) {
    normalized = '62' + normalized;
  }
  return normalized;
}

/**
 * GET /user-tenant/{id} - Get employee by ID
 */
export async function getEmployeeById(
  id: number,
  jwt: string
): Promise<Employee> {
  try {
    const data = await fetchApi<EmployeeResponse>(`/user-tenant/${id}`, {
      method: 'GET',
      jwt,
    });
    return data.data;
  } catch (error) {
    handleApiError(error, 'Terjadi kesalahan saat mengambil data karyawan');
  }
}

/**
 * POST /user-tenant - Create new employee
 */
export async function createEmployee(
  employee: {
    nama: string;
    notelp: string;
    level: string;
    pin?: string;
  },
  jwt: string
): Promise<Employee> {
  try {
    const normalizedPhone = normalizePhone(employee.notelp);

    const body: {
      nama: string;
      notelp: string;
      level: string;
      pin?: string;
    } = {
      nama: employee.nama,
      notelp: normalizedPhone,
      level: employee.level,
    };

    if (employee.pin && employee.pin.length > 0) {
      if (employee.pin.length !== 6) {
        throw new Error('PIN harus 6 digit');
      }
      body.pin = employee.pin;
    }

    const data = await fetchApi<EmployeeResponse>('/user-tenant', {
      method: 'POST',
      jwt,
      body,
    });
    return data.data;
  } catch (error) {
    handleApiError(error, 'Terjadi kesalahan saat menambahkan karyawan');
  }
}

/**
 * PUT /user-tenant/{id} - Update employee
 */
export async function updateEmployee(
  id: number,
  employee: {
    nama?: string;
    notelp?: string;
    level?: string;
    pin?: string;
    status?: boolean;
  },
  jwt: string
): Promise<Employee> {
  try {
    const body: {
      nama?: string;
      notelp?: string;
      level?: string;
      pin?: string;
      status?: boolean;
    } = {};

    if (employee.nama !== undefined && employee.nama.length > 0) {
      body.nama = employee.nama;
    }

    if (employee.notelp !== undefined && employee.notelp.length > 0) {
      body.notelp = normalizePhone(employee.notelp);
    }

    if (employee.level !== undefined && employee.level.length > 0) {
      body.level = employee.level;
    }

    if (employee.pin !== undefined) {
      if (employee.pin.length > 0) {
        if (employee.pin.length !== 6) {
          throw new Error('PIN harus 6 digit');
        }
        body.pin = employee.pin;
      }
    }

    if (employee.status !== undefined) {
      body.status = employee.status;
    }

    const data = await fetchApi<EmployeeResponse>(`/user-tenant/${id}`, {
      method: 'PUT',
      jwt,
      body,
    });
    return data.data;
  } catch (error) {
    handleApiError(error, 'Terjadi kesalahan saat memperbarui karyawan');
  }
}

/**
 * DELETE /user-tenant/{id} - Delete employee
 */
export async function deleteEmployee(id: number, jwt: string): Promise<void> {
  try {
    await fetchApi(`/user-tenant/${id}`, {
      method: 'DELETE',
      jwt,
    });
  } catch (error) {
    handleApiError(error, 'Terjadi kesalahan saat menghapus karyawan');
  }
}

/**
 * Interface untuk request update PIN
 */
export interface UpdatePinRequest {
  pin_saat_ini: string;
  pin_baru: string;
  pin_baru_ulangi: string;
}

/**
 * Interface untuk response update PIN
 */
export interface UpdatePinResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * PUT /update-pin - Update PIN user
 */
export async function updatePin(
  pinData: UpdatePinRequest,
  jwt: string
): Promise<UpdatePinResponse> {
  try {
    // Validasi PIN
    if (pinData.pin_saat_ini.length !== 6) {
      throw new Error('PIN saat ini harus 6 digit');
    }
    if (pinData.pin_baru.length !== 6) {
      throw new Error('PIN baru harus 6 digit');
    }
    if (pinData.pin_baru !== pinData.pin_baru_ulangi) {
      throw new Error('PIN baru dan ulangi PIN tidak cocok');
    }

    return await fetchApi<UpdatePinResponse>('/update-pin', {
      method: 'PUT',
      jwt,
      body: pinData,
    });
  } catch (error) {
    handleApiError(error, 'Terjadi kesalahan saat memperbarui PIN');
  }
}

/**
 * Interface untuk request update password
 */
export interface UpdatePasswordRequest {
  password_saat_ini: string;
  password_baru: string;
  password_baru_ulangi: string;
}

/**
 * Interface untuk response update password
 */
export interface UpdatePasswordResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * PUT /update-password-stall - Update password stall
 */
export async function updatePassword(
  passwordData: UpdatePasswordRequest,
  jwt: string
): Promise<UpdatePasswordResponse> {
  try {
    // Validasi password
    if (!passwordData.password_saat_ini) {
      throw new Error('Password saat ini harus diisi');
    }
    if (!passwordData.password_baru) {
      throw new Error('Password baru harus diisi');
    }
    if (passwordData.password_baru.length < 8) {
      throw new Error('Password baru minimal 8 karakter');
    }
    if (passwordData.password_baru !== passwordData.password_baru_ulangi) {
      throw new Error('Password baru dan ulangi password tidak cocok');
    }

    return await fetchApi<UpdatePasswordResponse>('/update-password-stall', {
      method: 'PUT',
      jwt,
      body: passwordData,
    });
  } catch (error) {
    handleApiError(error, 'Terjadi kesalahan saat memperbarui password');
  }
}

