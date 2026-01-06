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
      cache: 'no-store', // Pastikan selalu fetch data terbaru, tidak menggunakan cache
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
export async function getReceiptSettings(jwt: string): Promise<SettingsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/receipt`, {
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

    const data: SettingsResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat mengambil pengaturan struk');
  }
}

/**
 * Fungsi untuk menyimpan pengaturan struk ke API
 */
export async function saveReceiptSettings(settings: ReceiptSettings, jwt: string): Promise<SettingsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: SettingsResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat menyimpan pengaturan struk');
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
export async function getEmployeeById(id: number, jwt: string): Promise<Employee> {
  try {
    const response = await fetch(`${API_BASE_URL}/user-tenant/${id}`, {
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

    const data: EmployeeResponse = await response.json();
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat mengambil data karyawan');
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

    const response = await fetch(`${API_BASE_URL}/user-tenant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: EmployeeResponse = await response.json();
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat menambahkan karyawan');
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

    const response = await fetch(`${API_BASE_URL}/user-tenant/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: EmployeeResponse = await response.json();
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat memperbarui karyawan');
  }
}

/**
 * DELETE /user-tenant/{id} - Delete employee
 */
export async function deleteEmployee(id: number, jwt: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/user-tenant/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat menghapus karyawan');
  }
}

