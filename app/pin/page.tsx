'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserSession, logoutUser } from '@/utils/storage';
import { getUserStall, loginPin, UserStall } from '@/utils/api';

export default function PinPage() {
  const [selectedCashier, setSelectedCashier] = useState<UserStall | null>(null);
  const [cashiers, setCashiers] = useState<UserStall[]>([]);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCashiers, setIsLoadingCashiers] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchCashiers = useCallback(async () => {
    setIsLoadingCashiers(true);
    setError('');

    try {
      const userSession = getUserSession();
      if (!userSession) {
        router.push('/login');
        return;
      }

      // Ambil JWT dari session (field 'data' biasanya berisi JWT encrypted)
      // Atau cek apakah ada JWT yang disimpan terpisah
      const jwt = userSession.data || localStorage.getItem('jwt') || '';
      
      if (!jwt) {
        // Jika JWT tidak ada, paksa logout & kembali ke login
        logoutUser();
        router.push('/login');
        return;
      }

      const response = await getUserStall(jwt);
      
      if (response.success && response.data.users) {
        // Filter hanya user dengan level kasir atau semua user yang aktif
        const activeUsers = response.data.users.filter(user => user.status);
        setCashiers(activeUsers);
      } else {
        setError(response.message || 'Gagal mengambil data kasir');
      }
    } catch (error: any) {
      console.error('Error fetching cashiers:', error);

      // Jika error berkaitan dengan JWT / otentikasi, langsung logout & redirect
      const message = error.message || '';
      if (
        message.toLowerCase().includes('jwt') ||
        message.toLowerCase().includes('unauthenticated') ||
        message.toLowerCase().includes('unauthorized')
      ) {
        logoutUser();
        router.push('/login');
        return;
      }

      setError(message || 'Terjadi kesalahan saat mengambil data kasir');
    } finally {
      setIsLoadingCashiers(false);
    }
  }, [router]);

  useEffect(() => {
    // Cek apakah user sudah login menggunakan session storage
    const userSession = getUserSession();
    const currentUser = localStorage.getItem('currentUser');
    
    // Jika tidak ada session dan tidak ada currentUser, redirect ke login
    if (!userSession && !currentUser) {
      router.push('/login');
      return;
    }

    // Fetch cashiers jika belum ada
    if (cashiers.length === 0 && !isLoadingCashiers) {
      fetchCashiers();
    }
  }, [router, cashiers.length, isLoadingCashiers, fetchCashiers]);

  const handlePinChange = (value: string) => {
    // Hanya terima angka dan maksimal 6 digit
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setPin(value);
      setError('');
      
      // Auto submit jika PIN sudah 6 digit
      if (value.length === 6) {
        handleSubmit(value);
      }
    }
  };

  const handleSubmit = async (pinValue?: string) => {
    const pinToCheck = pinValue || pin;
    
    if (!selectedCashier) {
      setError('Pilih kasir terlebih dahulu');
      return;
    }

    if (pinToCheck.length !== 6) {
      setError('PIN harus 6 digit');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Cek session dari storage
      const userSession = getUserSession();
      
      if (!userSession) {
        router.push('/login');
        return;
      }

      // Ambil JWT dari session
      const jwt = userSession.data || localStorage.getItem('jwt') || '';
      
      if (!jwt) {
        // Jika JWT tidak ada, paksa logout & kembali ke login
        logoutUser();
        router.push('/login');
        return;
      }

      // Kirim PIN ke API login-pin
      const response = await loginPin(
        {
          pin: pinToCheck,
          user_id: selectedCashier.id,
        },
        jwt
      );

      if (response.success && response.data) {
        // Simpan JWT PIN
        const jwtPin = response.jwt || response.data.data;
        localStorage.setItem('jwt_pin', jwtPin);

        // Simpan semua data response ke storage
        localStorage.setItem('pin_session', JSON.stringify(response.data));
        
        // Simpan currentUser dengan data dari response
        localStorage.setItem('currentUser', JSON.stringify({
          id: response.data.user_id,
          name: response.data.nama,
          phone: response.data.notelp,
          level: response.data.level,
          stall_id: response.data.stall_id,
          nama_kios: response.data.nama_kios,
          permissions: response.data.permissions,
          pinVerified: true,
          loggedIn: true,
        }));

        // Redirect ke halaman POS
        router.push('/');
      } else {
        setError('PIN salah. Silakan coba lagi.');
        setPin('');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('PIN verification error:', error);
      const message = error.message || '';

      // Jika error berkaitan dengan JWT / otentikasi, langsung logout & redirect
      if (
        message.toLowerCase().includes('jwt') ||
        message.toLowerCase().includes('unauthenticated') ||
        message.toLowerCase().includes('unauthorized')
      ) {
        logoutUser();
        router.push('/login');
        return;
      }

      setError(message || 'Terjadi kesalahan saat verifikasi PIN');
      setPin('');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 6) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Image 
              src="/images/logomkasirijo.png" 
              alt="MKASIR" 
              width={100} 
              height={100} 
              className="w-24 h-24 object-contain" 
            />
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Masukkan PIN Kasir</h1>
            <p className="text-sm text-gray-600">Pilih kasir dan masukkan 6 digit PIN untuk melanjutkan</p>
          </div>

          {/* Cashier Selection Dropdown */}
          <div className="space-y-4">
            {isLoadingCashiers ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                <p className="text-sm text-gray-600 mt-2">Memuat data kasir...</p>
              </div>
            ) : cashiers.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Pilih Kasir</label>
                <select
                  value={selectedCashier?.id || ''}
                  onChange={(e) => {
                    const cashierId = parseInt(e.target.value);
                    const cashier = cashiers.find(c => c.id === cashierId);
                    if (cashier) {
                      setSelectedCashier(cashier);
                      setError('');
                    } else {
                      setSelectedCashier(null);
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Pilih Kasir --</option>
                  {cashiers.map((cashier) => (
                    <option key={cashier.id} value={cashier.id}>
                      {cashier.nama} ({cashier.kode}) - {cashier.level}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">Tidak ada kasir tersedia</p>
                <button
                  onClick={fetchCashiers}
                  className="mt-2 text-sm text-emerald-600 hover:underline"
                >
                  Muat ulang
                </button>
              </div>
            )}
          </div>

          {/* PIN Input */}
          <div className="space-y-4">
            <div 
              className="flex justify-center gap-2 cursor-pointer"
              onClick={() => {
                const input = document.getElementById('pin-input');
                if (input) input.focus();
              }}
            >
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                    index < pin.length
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-300 bg-gray-50 text-gray-400'
                  }`}
                >
                  {index < pin.length ? '•' : ''}
                </div>
              ))}
            </div>

            {/* Hidden input untuk keyboard */}
            <input
              id="pin-input"
              type="tel"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              maxLength={6}
              disabled={isLoading || !selectedCashier}
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
            />

            {/* Error message */}
            {error && (
              <div className="text-center">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
              </div>
            )}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePinChange(pin + num.toString())}
                disabled={isLoading || pin.length >= 6 || !selectedCashier}
                className="py-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl text-xl font-bold text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPin('')}
              disabled={isLoading || pin.length === 0 || !selectedCashier}
              className="py-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={() => handlePinChange(pin + '0')}
              disabled={isLoading || pin.length >= 6 || !selectedCashier}
              className="py-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl text-xl font-bold text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              0
            </button>
            <button
              onClick={() => setPin(pin.slice(0, -1))}
              disabled={isLoading || pin.length === 0 || !selectedCashier}
              className="py-4 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-xl text-sm font-semibold text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-delete-back-line text-xl"></i>
            </button>
          </div>

          {/* Logout option */}
          <div className="text-center pt-4">
            <button
              onClick={() => {
                // Logout penuh dari halaman PIN
                logoutUser();
                router.push('/login');
              }}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Bukan Anda? Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

