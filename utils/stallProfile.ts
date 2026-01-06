import { API_BASE_URL } from './api';

/**
 * Interface untuk profil stall (business profile)
 */
export interface StallProfile {
  nama: string;
  alamat: string;
  provinsi: string;
  kota: string;
  notelp: string;
  email: string;
  jam_mulai_operasional: string;
  jam_selesai_operasional: string;
  nama_pemilik: string;
  kode: string;
  lat: number | null;
  long: number | null;
  tampil_detik_presensi: boolean;
  status: boolean;
  status_pajak: boolean;
  pajak: number;
  status_biaya_lainnya: boolean;
  tipe_biaya_lainnya: string;
}

interface StallProfileResponse {
  success: boolean;
  message: string;
  data: StallProfile;
}

/**
 * GET /master/stall/profile - Ambil profil stall
 */
export async function getStallProfile(jwt: string): Promise<StallProfile> {
  const response = await fetch(`${API_BASE_URL}/master/stall/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data: StallProfileResponse = await response.json();
  return data.data;
}

/**
 * PUT /master/stall/profile - Update profil stall
 */
export async function updateStallProfile(
  profile: StallProfile,
  jwt: string
): Promise<StallProfile> {
  const body: Partial<StallProfile> & {
    lat: number | null;
    long: number | null;
  } = {
    ...profile,
    lat: profile.lat ?? null,
    long: profile.long ?? null,
  };

  const response = await fetch(`${API_BASE_URL}/master/stall/profile`, {
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

  const data: StallProfileResponse = await response.json();
  return data.data;
}


