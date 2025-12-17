/**
 * Konversi nomor telepon ke format 62
 * Contoh: 089698930940 -> 6289698930940
 */
export function convertTo62Format(phone: string): string {
  // Hapus semua karakter non-digit
  const cleaned = phone.replace(/\D/g, '');
  
  // Jika sudah dimulai dengan 62, return langsung
  if (cleaned.startsWith('62')) {
    return cleaned;
  }
  
  // Jika dimulai dengan 0, ganti dengan 62
  if (cleaned.startsWith('0')) {
    return '62' + cleaned.substring(1);
  }
  
  // Jika tidak dimulai dengan 0 atau 62, tambahkan 62 di depan
  return '62' + cleaned;
}

