'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { convertTo62Format } from '@/utils/phone';
import { API_BASE_URL } from '@/utils/api';

interface MediaOption {
  id: string;
  nama: string;
}

interface TypeKiosOption {
  id: string;
  nama: string;
  deskripsi?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    alamat: '',
    kodeReferal: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown options
  const [selectedMedia, setSelectedMedia] = useState<string>('');
  const [selectedTypeKios, setSelectedTypeKios] = useState<string>('');
  const [listMedia, setListMedia] = useState<MediaOption[]>([]);
  const [listTypeKios, setListTypeKios] = useState<TypeKiosOption[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isLoadingTypeKios, setIsLoadingTypeKios] = useState(false);

  // Form errors
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Load media options
  useEffect(() => {
    loadMediaOptions();
  }, []);

  // Load type kios options
  useEffect(() => {
    loadTypeKiosOptions();
  }, []);

  const loadMediaOptions = async () => {
    setIsLoadingMedia(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/media`);
      const data = await response.json();
      
      if (data.status === 'Success' || data.success === true) {
        if (Array.isArray(data.data)) {
          setListMedia(data.data);
        }
      }
    } catch (e) {
      // Use default options if API fails
      setListMedia([
        { id: '1', nama: 'Google' },
        { id: '2', nama: 'Facebook' },
        { id: '3', nama: 'Instagram' },
        { id: '4', nama: 'Teman/Keluarga' },
        { id: '5', nama: 'Lainnya' },
      ]);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const loadTypeKiosOptions = async () => {
    setIsLoadingTypeKios(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/type_kios`);
      const data = await response.json();
      
      if (data.status === 'Success' || data.success === true) {
        if (Array.isArray(data.data)) {
          setListTypeKios(data.data);
        }
      }
    } catch (e) {
      // Use default options if API fails
      setListTypeKios([
        { id: '1', nama: 'Warung/Toko Kelontong', deskripsi: 'Toko kelontong tradisional' },
        { id: '2', nama: 'Minimarket', deskripsi: 'Minimarket modern' },
        { id: '3', nama: 'Restoran/Kafe', deskripsi: 'Usaha makanan dan minuman' },
        { id: '4', nama: 'Retail Fashion', deskripsi: 'Toko pakaian dan aksesoris' },
        { id: '5', nama: 'Lainnya', deskripsi: 'Jenis usaha lainnya' },
      ]);
    } finally {
      setIsLoadingTypeKios(false);
    }
  };

  // Validation helpers
  const validateRequired = (value: string, fieldName: string): string => {
    if (!value || value.trim() === '') {
      return `${fieldName} harus diisi`;
    }
    return '';
  };

  const validateEmail = (email: string): string => {
    if (!email || email.trim() === '') {
      return 'Email harus diisi';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Format email tidak valid';
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password || password.length === 0) {
      return 'Kata sandi harus diisi';
    }
    if (password.length < 6) {
      return 'Kata sandi minimal 6 karakter';
    }
    return '';
  };

  const validatePhone = (phone: string): string => {
    if (!phone || phone.trim() === '') {
      return 'No HP harus diisi';
    }
    const cleaned = phone.replace(/\D/g, '');
    if (!/^[0-9]+$/.test(cleaned)) {
      return 'No HP hanya boleh berisi angka';
    }
    if (!(cleaned.startsWith('08') || cleaned.startsWith('62'))) {
      return 'No HP harus diawali dengan 08 atau 62';
    }
    if (cleaned.length < 9) {
      return 'No HP minimal 9 angka';
    }
    return '';
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    errors.nama = validateRequired(formData.nama, 'Nama usaha');
    errors.phone = validatePhone(formData.phone);
    errors.email = validateEmail(formData.email);
    errors.password = validatePassword(formData.password);
    
    if (!formData.confirmPassword || formData.confirmPassword.length === 0) {
      errors.confirmPassword = 'Konfirmasi kata sandi harus diisi';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok';
    }

    errors.alamat = validateRequired(formData.alamat, 'Alamat lengkap');

    if (!selectedMedia) {
      errors.media = 'Sumber informasi harus dipilih';
    }

    if (!selectedTypeKios) {
      errors.typeKios = 'Type kios harus dipilih';
    }

    if (!isAgreed) {
      errors.agreed = 'Anda harus menyetujui syarat dan ketentuan';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Normalize phone number
      let phoneNumber = formData.phone.trim();
      if (phoneNumber.startsWith('08')) {
        phoneNumber = '628' + phoneNumber.substring(2);
      } else if (phoneNumber.startsWith('+628')) {
        phoneNumber = '628' + phoneNumber.substring(4);
      } else {
        phoneNumber = convertTo62Format(phoneNumber);
      }

      const body = {
        nama: formData.nama.trim(),
        notelp: phoneNumber,
        email: formData.email.trim(),
        password: formData.password,
        lokasi: formData.alamat.trim(),
        kode_referal: formData.kodeReferal.trim() === '' ? null : formData.kodeReferal.trim(),
        type_kios: selectedTypeKios,
        media: selectedMedia,
      };

      const response = await fetch(`${API_BASE_URL}/auth/registerStall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      const success = data.status === 'Success' || data.success === true;

      if (success) {
        setSuccess('Registrasi berhasil! Silakan login.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message?.toString() || 'Registrasi gagal');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Register error:', error);
      let message = 'Gagal terhubung ke server';
      
      if (error instanceof Error) {
        if (error.message?.includes('timeout') || error.message?.includes('network')) {
          message = 'Koneksi ke server timeout. Periksa jaringan Anda.';
        } else {
          message = error.message;
        }
      } else if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error as { response?: { data?: { message?: string } } };
        message = errorResponse.response?.data?.message?.toString() || 'Terjadi kesalahan server';
      }
      
      setError(message);
      setIsLoading(false);
    }
  };

  const showTermsDialog = () => {
    setShowTermsModal(true);
  };

  const handleAgreeTerms = () => {
    setIsAgreed(true);
    setShowTermsModal(false);
    setFormErrors({...formErrors, agreed: ''});
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left: Form */}
      <div className="w-full md:w-1/2 lg:w-5/12 px-6 sm:px-10 lg:px-14 py-10 flex flex-col justify-center space-y-8 bg-white overflow-y-auto">
        <div className="space-y-2">
          <div className="flex items-center">
            <Image src="/images/logomkasirijo.png" alt="MKASIR" width={128} height={128} className="w-32 h-32 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Daftar Sekarang</h1>
          <p className="text-sm text-gray-600">Bergabung dengan POS Retail dan mulai kelola bisnis Anda dengan mudah</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600 flex-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-600 flex-1">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Usaha */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nama Usaha *</label>
            <div className="relative">
              <span className="ri-store-3-line absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-base" />
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => {
                  setFormData({ ...formData, nama: e.target.value });
                  if (formErrors.nama) setFormErrors({...formErrors, nama: ''});
                }}
                placeholder="Masukkan nama usaha Anda"
                className={`w-full rounded-lg border ${formErrors.nama ? 'border-red-300' : 'border-gray-300'} pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                required
              />
            </div>
            {formErrors.nama && <p className="text-xs text-red-600">{formErrors.nama}</p>}
          </div>

          {/* No HP */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">No HP (WhatsApp) *</label>
            <div className="relative">
              <span className="ri-phone-line absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-base" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, phone: value });
                  if (formErrors.phone) setFormErrors({...formErrors, phone: ''});
                }}
                placeholder="Contoh: 08123456789"
                maxLength={14}
                className={`w-full rounded-lg border ${formErrors.phone ? 'border-red-300' : 'border-gray-300'} pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                required
              />
            </div>
            {formErrors.phone && <p className="text-xs text-red-600">{formErrors.phone}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email *</label>
            <div className="relative">
              <span className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-base" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (formErrors.email) setFormErrors({...formErrors, email: ''});
                }}
                placeholder="nama@email.com"
                className={`w-full rounded-lg border ${formErrors.email ? 'border-red-300' : 'border-gray-300'} pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                required
              />
            </div>
            {formErrors.email && <p className="text-xs text-red-600">{formErrors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Kata Sandi *</label>
            <div className="relative">
              <span className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-base" />
              <input
                type={hidePassword ? 'password' : 'text'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (formErrors.password) setFormErrors({...formErrors, password: ''});
                }}
                placeholder="Masukkan kata sandi yang kuat"
                className={`w-full rounded-lg border ${formErrors.password ? 'border-red-300' : 'border-gray-300'} pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                required
              />
              <button
                type="button"
                onClick={() => setHidePassword(!hidePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {hidePassword ? (
                  <span className="ri-eye-off-line text-lg" />
                ) : (
                  <span className="ri-eye-line text-lg" />
                )}
              </button>
            </div>
            {formErrors.password && <p className="text-xs text-red-600">{formErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Konfirmasi Kata Sandi *</label>
            <div className="relative">
              <span className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-base" />
              <input
                type={hideConfirmPassword ? 'password' : 'text'}
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (formErrors.confirmPassword) setFormErrors({...formErrors, confirmPassword: ''});
                }}
                placeholder="Masukkan ulang kata sandi Anda"
                className={`w-full rounded-lg border ${formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'} pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                required
              />
              <button
                type="button"
                onClick={() => setHideConfirmPassword(!hideConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {hideConfirmPassword ? (
                  <span className="ri-eye-off-line text-lg" />
                ) : (
                  <span className="ri-eye-line text-lg" />
                )}
              </button>
            </div>
            {formErrors.confirmPassword && <p className="text-xs text-red-600">{formErrors.confirmPassword}</p>}
          </div>

          {/* Alamat */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Alamat Lengkap *</label>
            <div className="relative">
              <span className="ri-map-pin-line absolute left-3 top-3 text-emerald-500 text-base" />
              <textarea
                value={formData.alamat}
                onChange={(e) => {
                  setFormData({ ...formData, alamat: e.target.value });
                  if (formErrors.alamat) setFormErrors({...formErrors, alamat: ''});
                }}
                placeholder="Masukkan alamat lengkap usaha Anda"
                rows={3}
                className={`w-full rounded-lg border ${formErrors.alamat ? 'border-red-300' : 'border-gray-300'} pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
                required
              />
            </div>
            {formErrors.alamat && <p className="text-xs text-red-600">{formErrors.alamat}</p>}
          </div>

          {/* Kode Referal */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Kode Referal</label>
            <div className="relative">
              <span className="ri-gift-line absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-base" />
              <input
                type="text"
                value={formData.kodeReferal}
                onChange={(e) => setFormData({ ...formData, kodeReferal: e.target.value })}
                placeholder="Masukkan kode referal (opsional)"
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Media Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Dari mana Anda pertama kali mengetahui POS Retail? *</label>
            <div className="relative">
              <span className="ri-information-line absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-base z-10" />
              {isLoadingMedia ? (
                <div className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                </div>
              ) : (
                <select
                  value={selectedMedia}
                  onChange={(e) => {
                    setSelectedMedia(e.target.value);
                    if (formErrors.media) setFormErrors({...formErrors, media: ''});
                  }}
                  className={`w-full rounded-lg border ${formErrors.media ? 'border-red-300' : 'border-gray-300'} pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none cursor-pointer`}
                  required
                >
                  <option value="">Pilih sumber informasi</option>
                  {listMedia.map((media) => (
                    <option key={media.id} value={media.nama}>
                      {media.nama}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {formErrors.media && <p className="text-xs text-red-600">{formErrors.media}</p>}
          </div>

          {/* Type Kios Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Type Kios *</label>
            <div className="relative">
              <span className="ri-store-2-line absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-base z-10" />
              {isLoadingTypeKios ? (
                <div className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                </div>
              ) : (
                <select
                  value={selectedTypeKios}
                  onChange={(e) => {
                    setSelectedTypeKios(e.target.value);
                    if (formErrors.typeKios) setFormErrors({...formErrors, typeKios: ''});
                  }}
                  className={`w-full rounded-lg border ${formErrors.typeKios ? 'border-red-300' : 'border-gray-300'} pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none cursor-pointer`}
                  required
                >
                  <option value="">Pilih tipe kios</option>
                  {listTypeKios.map((type) => (
                    <option key={type.id} value={type.nama}>
                      {type.nama}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {formErrors.typeKios && <p className="text-xs text-red-600">{formErrors.typeKios}</p>}
          </div>

          {/* Terms Checkbox */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => {
                  if (e.target.checked) {
                    showTermsDialog();
                  } else {
                    setIsAgreed(false);
                  }
                }}
                className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 flex-1">
                Saya sudah membaca dan setuju dengan{' '}
                <button
                  type="button"
                  onClick={showTermsDialog}
                  className="text-emerald-600 font-semibold underline hover:text-emerald-700"
                >
                  Syarat dan Ketentuan
                </button>
              </span>
            </label>
            {formErrors.agreed && <p className="text-xs text-red-600 mt-1 ml-7">{formErrors.agreed}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                <span>Mendaftar...</span>
              </>
            ) : (
              <>
                <span className="ri-user-add-line text-base text-white" />
                <span>Daftar Sekarang</span>
              </>
            )}
          </button>
        </form>

        <div className="text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>

      {/* Right: Illustration */}
      <div className="hidden md:flex flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80"
          alt="Kasir"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-emerald-900/25" />
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <span className="ri-file-text-line text-emerald-600 text-xl" />
              <h2 className="text-lg font-bold text-gray-900 flex-1">Syarat & Ketentuan</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="ri-close-line text-2xl" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-700 mb-4">
                Dengan mendaftar dan menggunakan layanan POS Retail, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh Syarat dan Ketentuan berikut:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">1. Akun Pengguna</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>Anda bertanggung jawab sepenuhnya atas keamanan akun.</li>
                    <li>Satu akun hanya dapat digunakan untuk satu usaha/bisnis.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">2. Penggunaan Layanan</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>Layanan disediakan untuk membantu pengelolaan kasir dan inventori.</li>
                    <li>Anda dilarang menggunakan layanan untuk tujuan ilegal.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">3. Data dan Privasi</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>Kami akan menjaga kerahasiaan data bisnis Anda.</li>
                    <li>Data transaksi akan disimpan untuk keperluan analisis.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Tutup
              </button>
              <button
                onClick={handleAgreeTerms}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
              >
                Saya Setuju
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
