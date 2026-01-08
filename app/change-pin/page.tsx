'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ToastNotification from '@/components/ToastNotification';
import { updatePin } from '@/utils/api';
import { getUserSession } from '@/utils/storage';

export default function ChangePinPage() {
  const router = useRouter();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  
  // State untuk show/hide PIN
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  
  // State untuk validasi real-time
  const [currentPinError, setCurrentPinError] = useState('');
  const [newPinError, setNewPinError] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');
  
  // Validasi real-time untuk konfirmasi PIN
  useEffect(() => {
    if (confirmPin.length === 0) {
      setConfirmPinError('');
      return;
    }
    
    // Jika PIN baru belum diisi, tidak perlu validasi
    if (newPin.length === 0) {
      setConfirmPinError('');
      return;
    }
    
    // Cek apakah konfirmasi PIN cocok dengan PIN baru
    // Validasi dilakukan per karakter yang sudah diketik
    if (confirmPin.length <= newPin.length) {
      // Cek apakah karakter yang sudah diketik cocok
      const isMatching = confirmPin === newPin.substring(0, confirmPin.length);
      if (!isMatching) {
        setConfirmPinError('PIN baru dan konfirmasi PIN tidak cocok');
      } else {
        setConfirmPinError('');
      }
    } else {
      // Jika konfirmasi PIN lebih panjang dari PIN baru, pasti tidak cocok
      setConfirmPinError('PIN baru dan konfirmasi PIN tidak cocok');
    }
    
    // Jika sudah 6 digit, pastikan sama persis
    if (newPin.length === 6 && confirmPin.length === 6) {
      if (newPin !== confirmPin) {
        setConfirmPinError('PIN baru dan konfirmasi PIN tidak cocok');
      } else {
        setConfirmPinError('');
      }
    }
  }, [newPin, confirmPin]);
  
  // Validasi real-time untuk PIN baru
  useEffect(() => {
    if (newPin.length === 0) {
      setNewPinError('');
      return;
    }
    
    if (newPin.length < 6) {
      setNewPinError('');
      return;
    }
    
    if (newPin.length === 6) {
      if (newPin === currentPin && currentPin.length === 6) {
        setNewPinError('PIN baru harus berbeda dengan PIN saat ini');
      } else {
        setNewPinError('');
      }
    }
  }, [newPin, currentPin]);
  
  // Validasi real-time untuk PIN saat ini
  useEffect(() => {
    if (currentPin.length === 0) {
      setCurrentPinError('');
      return;
    }
    
    if (currentPin.length < 6) {
      setCurrentPinError('');
      return;
    }
    
    if (currentPin.length === 6) {
      setCurrentPinError('');
    }
  }, [currentPin]);
  
  // Cek apakah form valid
  const isFormValid = 
    currentPin.length === 6 &&
    newPin.length === 6 &&
    confirmPin.length === 6 &&
    newPin === confirmPin &&
    newPin !== currentPin &&
    !currentPinError &&
    !newPinError &&
    !confirmPinError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi
    if (!currentPin) {
      setError('Masukkan PIN saat ini');
      return;
    }

    if (currentPin.length !== 6) {
      setError('PIN saat ini harus 6 digit');
      return;
    }

    if (!newPin) {
      setError('Masukkan PIN baru');
      return;
    }

    if (newPin.length !== 6) {
      setError('PIN baru harus 6 digit');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PIN baru dan konfirmasi PIN tidak cocok');
      return;
    }

    if (newPin === currentPin) {
      setError('PIN baru harus berbeda dengan PIN saat ini');
      return;
    }

    setIsLoading(true);

    try {
      // Get JWT
      const userSession = getUserSession();
      const jwt = userSession?.data || localStorage.getItem('jwt_pin') || localStorage.getItem('jwt');

      if (!jwt) {
        throw new Error('Session tidak ditemukan. Silakan login ulang.');
      }

      // Update PIN menggunakan API updatePin
      await updatePin(
        {
          pin_saat_ini: currentPin,
          pin_baru: newPin,
          pin_baru_ulangi: confirmPin,
        },
        jwt
      );

      // Success
      setNotificationMessage('PIN berhasil diubah');
      setNotificationType('success');
      setShowNotification(true);
      setTimeout(() => {
        router.push('/profile-detail');
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengubah PIN';
      setError(errorMessage);
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
            Ganti PIN
          </h1>
          <p className="text-sm text-gray-600">
            PIN digunakan untuk login ke sistem kasir. Pastikan PIN Anda aman dan mudah diingat.
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
                PIN saat ini
              </label>
              <div className="relative">
                <input
                  type={showCurrentPin ? 'text' : 'password'}
                  value={currentPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Hanya angka
                    setCurrentPin(value);
                    setError('');
                    setCurrentPinError('');
                  }}
                  maxLength={6}
                  className={`w-full px-3.5 py-2.5 ${currentPin.length === 6 && !currentPinError ? 'pr-20' : 'pr-10'} rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                    currentPinError
                      ? 'border-red-300 focus:ring-red-500'
                      : currentPin.length === 6
                      ? 'border-green-300 focus:ring-emerald-500'
                      : 'border-gray-300 focus:ring-emerald-500'
                  }`}
                  placeholder="Masukkan PIN saat ini (6 digit)"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showCurrentPin ? (
                    <i className="ri-eye-off-line text-lg"></i>
                  ) : (
                    <i className="ri-eye-line text-lg"></i>
                  )}
                </button>
                {currentPin.length === 6 && !currentPinError && (
                  <i className="ri-check-line absolute right-12 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                )}
                {currentPinError && (
                  <i className="ri-close-line absolute right-12 top-1/2 -translate-y-1/2 text-red-500 text-lg"></i>
                )}
              </div>
              {currentPinError && (
                <p className="mt-1 text-xs text-red-600">{currentPinError}</p>
              )}
              {currentPin.length > 0 && currentPin.length < 6 && (
                <p className="mt-1 text-xs text-gray-500">
                  {6 - currentPin.length} digit lagi
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                PIN baru
              </label>
              <div className="relative">
                <input
                  type={showNewPin ? 'text' : 'password'}
                  value={newPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Hanya angka
                    setNewPin(value);
                    setError('');
                    setNewPinError('');
                  }}
                  maxLength={6}
                  className={`w-full px-3.5 py-2.5 ${newPin.length === 6 && !newPinError ? 'pr-20' : 'pr-10'} rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                    newPinError
                      ? 'border-red-300 focus:ring-red-500'
                      : newPin.length === 6 && !newPinError
                      ? 'border-green-300 focus:ring-emerald-500'
                      : 'border-gray-300 focus:ring-emerald-500'
                  }`}
                  placeholder="Masukkan PIN baru (6 digit)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showNewPin ? (
                    <i className="ri-eye-off-line text-lg"></i>
                  ) : (
                    <i className="ri-eye-line text-lg"></i>
                  )}
                </button>
                {newPin.length === 6 && !newPinError && (
                  <i className="ri-check-line absolute right-12 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                )}
                {newPinError && (
                  <i className="ri-close-line absolute right-12 top-1/2 -translate-y-1/2 text-red-500 text-lg"></i>
                )}
              </div>
              {newPinError && (
                <p className="mt-1 text-xs text-red-600">{newPinError}</p>
              )}
              {newPin.length > 0 && newPin.length < 6 && (
                <p className="mt-1 text-xs text-gray-500">
                  {6 - newPin.length} digit lagi
                </p>
              )}
              {newPin.length === 6 && !newPinError && (
                <p className="mt-1 text-xs text-green-600">
                  <i className="ri-checkbox-circle-line mr-1"></i>
                  PIN baru valid
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ulangi PIN baru
              </label>
              <div className="relative">
                <input
                  type={showConfirmPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Hanya angka
                    setConfirmPin(value);
                    setError('');
                    setConfirmPinError('');
                  }}
                  maxLength={6}
                  className={`w-full px-3.5 py-2.5 ${confirmPin.length === 6 && newPin === confirmPin && newPin.length === 6 && !confirmPinError ? 'pr-20' : 'pr-10'} rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                    confirmPinError
                      ? 'border-red-300 focus:ring-red-500'
                      : confirmPin.length === 6 && newPin === confirmPin && newPin.length === 6
                      ? 'border-green-300 focus:ring-emerald-500'
                      : 'border-gray-300 focus:ring-emerald-500'
                  }`}
                  placeholder="Ulangi PIN baru (6 digit)"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPin ? (
                    <i className="ri-eye-off-line text-lg"></i>
                  ) : (
                    <i className="ri-eye-line text-lg"></i>
                  )}
                </button>
                {confirmPin.length === 6 && newPin === confirmPin && newPin.length === 6 && !confirmPinError && (
                  <i className="ri-check-line absolute right-12 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                )}
                {confirmPinError && (
                  <i className="ri-close-line absolute right-12 top-1/2 -translate-y-1/2 text-red-500 text-lg"></i>
                )}
              </div>
              {confirmPinError && (
                <p className="mt-1 text-xs text-red-600">{confirmPinError}</p>
              )}
              {confirmPin.length > 0 && confirmPin.length < 6 && (
                <p className="mt-1 text-xs text-gray-500">
                  {6 - confirmPin.length} digit lagi
                </p>
              )}
              {confirmPin.length === 6 && newPin === confirmPin && newPin.length === 6 && !confirmPinError && (
                <p className="mt-1 text-xs text-green-600">
                  <i className="ri-checkbox-circle-line mr-1"></i>
                  PIN cocok
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="mt-2 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan PIN'}
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

