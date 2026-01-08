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
  logo_url?: string | null;
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
  jwt: string,
  logoFile?: File | null
): Promise<StallProfile> {
  const formData = new FormData();

  // Tambahkan semua field profil ke FormData
  formData.append('nama', profile.nama);
  formData.append('alamat', profile.alamat);
  formData.append('provinsi', profile.provinsi);
  formData.append('kota', profile.kota);
  formData.append('notelp', profile.notelp);
  formData.append('email', profile.email);
  formData.append('jam_mulai_operasional', profile.jam_mulai_operasional);
  formData.append('jam_selesai_operasional', profile.jam_selesai_operasional);
  formData.append('nama_pemilik', profile.nama_pemilik);
  formData.append('kode', profile.kode);
  formData.append('tampil_detik_presensi', profile.tampil_detik_presensi.toString());
  formData.append('status', profile.status.toString());
  formData.append('status_pajak', profile.status_pajak.toString());
  formData.append('pajak', profile.pajak.toString());
  formData.append('status_biaya_lainnya', profile.status_biaya_lainnya.toString());
  formData.append('tipe_biaya_lainnya', profile.tipe_biaya_lainnya);

  // Tambahkan lat dan long jika ada
  if (profile.lat !== null && profile.lat !== undefined) {
    formData.append('lat', profile.lat.toString());
  }
  if (profile.long !== null && profile.long !== undefined) {
    formData.append('long', profile.long.toString());
  }

  // Tambahkan file logo jika ada
  if (logoFile) {
    formData.append('logo', logoFile);
  }

  const response = await fetch(`${API_BASE_URL}/master/stall/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      // Jangan set Content-Type header, biarkan browser set otomatis dengan boundary untuk multipart/form-data
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data: StallProfileResponse = await response.json();
  return data.data;
}


