'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ToastNotification from '@/components/ToastNotification';
import { getUserSession } from '@/utils/storage';
import { updatePassword } from '@/utils/api';

const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  
  // State untuk show/hide password
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State untuk validasi real-time
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Validasi real-time untuk konfirmasi password
  useEffect(() => {
    if (confirmPassword.length === 0) {
      setConfirmPasswordError('');
      return;
    }
    
    // Jika password baru belum diisi, tidak perlu validasi
    if (newPassword.length === 0) {
      setConfirmPasswordError('');
      return;
    }
    
    // Cek apakah konfirmasi password cocok dengan password baru
    // Validasi dilakukan per karakter yang sudah diketik
    if (confirmPassword.length <= newPassword.length) {
      // Cek apakah karakter yang sudah diketik cocok
      const isMatching = confirmPassword === newPassword.substring(0, confirmPassword.length);
      if (!isMatching) {
        setConfirmPasswordError('Kata sandi baru dan konfirmasi kata sandi tidak cocok');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      // Jika konfirmasi password lebih panjang dari password baru, pasti tidak cocok
      setConfirmPasswordError('Kata sandi baru dan konfirmasi kata sandi tidak cocok');
    }
    
    // Jika password baru sudah cukup panjang, pastikan sama persis
    if (newPassword.length >= MIN_PASSWORD_LENGTH && confirmPassword.length >= MIN_PASSWORD_LENGTH) {
      if (newPassword !== confirmPassword) {
        setConfirmPasswordError('Kata sandi baru dan konfirmasi kata sandi tidak cocok');
      } else {
        setConfirmPasswordError('');
      }
    }
  }, [newPassword, confirmPassword]);
  
  // Validasi real-time untuk password baru
  useEffect(() => {
    if (newPassword.length === 0) {
      setNewPasswordError('');
      return;
    }
    
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setNewPasswordError(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter`);
      return;
    }
    
    if (newPassword === currentPassword && currentPassword.length > 0) {
      setNewPasswordError('Kata sandi baru harus berbeda dengan kata sandi saat ini');
    } else {
      setNewPasswordError('');
    }
  }, [newPassword, currentPassword]);
  
  // Validasi real-time untuk password saat ini
  useEffect(() => {
    if (currentPassword.length === 0) {
      setCurrentPasswordError('');
      return;
    }
    
    setCurrentPasswordError('');
  }, [currentPassword]);
  
  // Cek apakah form valid
  const isFormValid = 
    currentPassword.length > 0 &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword.length >= MIN_PASSWORD_LENGTH &&
    newPassword === confirmPassword &&
    newPassword !== currentPassword &&
    !currentPasswordError &&
    !newPasswordError &&
    !confirmPasswordError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi
    if (!currentPassword) {
      setError('Masukkan kata sandi saat ini');
      return;
    }

    if (!newPassword) {
      setError('Masukkan kata sandi baru');
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Kata sandi baru minimal ${MIN_PASSWORD_LENGTH} karakter`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Kata sandi baru dan konfirmasi kata sandi tidak cocok');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Kata sandi baru harus berbeda dengan kata sandi saat ini');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get JWT
      const userSession = getUserSession();
      const jwt = userSession?.data || localStorage.getItem('jwt_pin') || localStorage.getItem('jwt');

      if (!jwt) {
        throw new Error('Session tidak ditemukan. Silakan login ulang.');
      }

      // Panggil API update password
      await updatePassword(
        {
          password_saat_ini: currentPassword,
          password_baru: newPassword,
          password_baru_ulangi: confirmPassword,
        },
        jwt
      );

      // Success
      setNotificationMessage('Kata sandi berhasil diubah');
      setNotificationType('success');
      setShowNotification(true);
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        router.push('/profile-detail');
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengubah kata sandi';
      setError(errorMessage);
      setNotificationMessage(errorMessage);
      setNotificationType('error');
      setShowNotification(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pl-0 lg:pl-64 pb-10">
      <Sidebar />

      <div className="max-w-md mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Ganti Kata Sandi
          </h1>
          <p className="text-sm text-gray-600">
            Demi keamanan, gunakan kata sandi yang kuat dan unik.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kata sandi saat ini
              </label>
              <div className="relative">
              <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setError('');
                    setCurrentPasswordError('');
                  }}
                  className={`w-full px-3.5 py-2.5 ${currentPassword.length > 0 && !currentPasswordError ? 'pr-20' : 'pr-10'} rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                    currentPasswordError
                      ? 'border-red-300 focus:ring-red-500'
                      : currentPassword.length > 0
                      ? 'border-green-300 focus:ring-emerald-500'
                      : 'border-gray-300 focus:ring-emerald-500'
                  }`}
                  placeholder="Masukkan kata sandi saat ini"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <i className="ri-eye-off-line text-lg"></i>
                  ) : (
                    <i className="ri-eye-line text-lg"></i>
                  )}
                </button>
                {currentPassword.length > 0 && !currentPasswordError && (
                  <i className="ri-check-line absolute right-12 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                )}
                {currentPasswordError && (
                  <i className="ri-close-line absolute right-12 top-1/2 -translate-y-1/2 text-red-500 text-lg"></i>
                )}
              </div>
              {currentPasswordError && (
                <p className="mt-1 text-xs text-red-600">{currentPasswordError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kata sandi baru
              </label>
              <div className="relative">
              <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                    setNewPasswordError('');
                  }}
                  className={`w-full px-3.5 py-2.5 ${newPassword.length >= MIN_PASSWORD_LENGTH && !newPasswordError ? 'pr-20' : 'pr-10'} rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                    newPasswordError
                      ? 'border-red-300 focus:ring-red-500'
                      : newPassword.length >= MIN_PASSWORD_LENGTH && !newPasswordError
                      ? 'border-green-300 focus:ring-emerald-500'
                      : 'border-gray-300 focus:ring-emerald-500'
                  }`}
                  placeholder={`Masukkan kata sandi baru (min. ${MIN_PASSWORD_LENGTH} karakter)`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <i className="ri-eye-off-line text-lg"></i>
                  ) : (
                    <i className="ri-eye-line text-lg"></i>
                  )}
                </button>
                {newPassword.length >= MIN_PASSWORD_LENGTH && !newPasswordError && (
                  <i className="ri-check-line absolute right-12 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                )}
                {newPasswordError && (
                  <i className="ri-close-line absolute right-12 top-1/2 -translate-y-1/2 text-red-500 text-lg"></i>
                )}
              </div>
              {newPasswordError && (
                <p className="mt-1 text-xs text-red-600">{newPasswordError}</p>
              )}
              {newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH && (
                <p className="mt-1 text-xs text-gray-500">
                  Minimal {MIN_PASSWORD_LENGTH} karakter ({MIN_PASSWORD_LENGTH - newPassword.length} karakter lagi)
                </p>
              )}
              {newPassword.length >= MIN_PASSWORD_LENGTH && !newPasswordError && (
                <p className="mt-1 text-xs text-green-600">
                  <i className="ri-checkbox-circle-line mr-1"></i>
                  Kata sandi baru valid
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ulangi kata sandi baru
              </label>
              <div className="relative">
              <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                    setConfirmPasswordError('');
                  }}
                  className={`w-full px-3.5 py-2.5 ${confirmPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword && newPassword.length >= MIN_PASSWORD_LENGTH && !confirmPasswordError ? 'pr-20' : 'pr-10'} rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                    confirmPasswordError
                      ? 'border-red-300 focus:ring-red-500'
                      : confirmPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword && newPassword.length >= MIN_PASSWORD_LENGTH
                      ? 'border-green-300 focus:ring-emerald-500'
                      : 'border-gray-300 focus:ring-emerald-500'
                  }`}
                  placeholder="Ulangi kata sandi baru"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <i className="ri-eye-off-line text-lg"></i>
                  ) : (
                    <i className="ri-eye-line text-lg"></i>
                  )}
                </button>
                {confirmPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword && newPassword.length >= MIN_PASSWORD_LENGTH && !confirmPasswordError && (
                  <i className="ri-check-line absolute right-12 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                )}
                {confirmPasswordError && (
                  <i className="ri-close-line absolute right-12 top-1/2 -translate-y-1/2 text-red-500 text-lg"></i>
                )}
              </div>
              {confirmPasswordError && (
                <p className="mt-1 text-xs text-red-600">{confirmPasswordError}</p>
              )}
              {confirmPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword && newPassword.length >= MIN_PASSWORD_LENGTH && !confirmPasswordError && (
                <p className="mt-1 text-xs text-green-600">
                  <i className="ri-checkbox-circle-line mr-1"></i>
                  Kata sandi cocok
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="mt-2 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                'Simpan Kata Sandi'
              )}
            </button>

            {!isFormValid && (
              <p className="mt-2 text-xs text-gray-500 text-center">
                Lengkapi semua field dengan benar untuk mengaktifkan tombol simpan
              </p>
            )}
          </form>
        </div>
      </div>

      <ToastNotification
        show={showNotification}
        message={notificationMessage}
        type={notificationType}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
}


