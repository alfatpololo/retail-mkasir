'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PinPage() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Cek apakah user sudah login
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      router.push('/login');
      return;
    }
  }, [router]);

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
    
    if (pinToCheck.length !== 6) {
      setError('PIN harus 6 digit');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (!currentUserStr) {
        router.push('/login');
        return;
      }

      const currentUser = JSON.parse(currentUserStr);
      
      // Cek PIN dari localStorage (dalam production, ini harus dari server)
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      const user = users.find((u: any) => u.id === currentUser.id);

      // Default PIN untuk kasir (dalam production, ini harus dari database)
      // Jika user belum punya PIN, set default PIN
      if (!user.pin) {
        // Set default PIN untuk user baru
        user.pin = '123456';
        const updatedUsers = users.map((u: any) => 
          u.id === user.id ? user : u
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      }

      if (user.pin !== pinToCheck) {
        setError('PIN salah. Silakan coba lagi.');
        setPin('');
        setIsLoading(false);
        return;
      }

      // Update session dengan PIN verified
      localStorage.setItem('currentUser', JSON.stringify({
        ...currentUser,
        pinVerified: true,
      }));

      // Redirect ke halaman POS
      router.push('/');
    } catch (error) {
      console.error('PIN verification error:', error);
      setError('Terjadi kesalahan saat verifikasi PIN');
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
            <p className="text-sm text-gray-600">Masukkan 6 digit PIN untuk melanjutkan</p>
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
              disabled={isLoading}
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
                disabled={isLoading || pin.length >= 6}
                className="py-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl text-xl font-bold text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPin('')}
              disabled={isLoading || pin.length === 0}
              className="py-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={() => handlePinChange(pin + '0')}
              disabled={isLoading || pin.length >= 6}
              className="py-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl text-xl font-bold text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              0
            </button>
            <button
              onClick={() => setPin(pin.slice(0, -1))}
              disabled={isLoading || pin.length === 0}
              className="py-4 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-xl text-sm font-semibold text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-delete-back-line text-xl"></i>
            </button>
          </div>

          {/* Logout option */}
          <div className="text-center pt-4">
            <button
              onClick={() => {
                localStorage.removeItem('currentUser');
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

