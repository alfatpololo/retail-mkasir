'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { convertTo62Format } from '@/utils/phone';
import { login } from '@/utils/api';
import { saveUserSession } from '@/utils/storage';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validasi nomor HP
    if (!phone || phone.length < 10) {
      setError('Nomor HP tidak valid');
      setIsLoading(false);
      return;
    }

    // Validasi password
    if (!password || password.length < 6) {
      setError('Password minimal 6 karakter');
      setIsLoading(false);
      return;
    }

    try {
      // Konversi nomor telepon ke format 62
      const formattedPhone = convertTo62Format(phone);

      // Panggil API login
      const response = await login({
        notelp: formattedPhone,
        password: password,
        device: 'mobile',
        version: '1.0.0',
      });

      // Cek apakah login berhasil
      if (response.success && response.data) {
        // Simpan data user ke storage
        saveUserSession(response.data);

        // Simpan juga ke currentUser untuk kompatibilitas dengan halaman PIN
        localStorage.setItem('currentUser', JSON.stringify({
          id: response.data.user_id,
          name: response.data.nama_user,
          phone: response.data.notelp,
          loggedIn: true,
          pinVerified: false,
        }));

        // Redirect ke halaman PIN atau dashboard
        router.push('/pin');
      } else {
        setError(response.message || 'Login gagal');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Terjadi kesalahan saat login. Pastikan API URL sudah benar.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left: Form */}
      <div className="w-full md:w-1/2 lg:w-5/12 px-6 sm:px-10 lg:px-14 py-10 flex flex-col justify-center space-y-8 bg-white">
        <div className="space-y-2">
          <div className="flex items-center">
            <Image src="/images/logomkasirijo.png" alt="MKASIR" width={128} height={128} className="w-32 h-32 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Masuk ke Akun</h1>
          <p className="text-sm text-gray-600">Gunakan nomor HP dan kata sandi Anda.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nomor HP</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="08xxxxxxxxxx"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              minLength={10}
              maxLength={13}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Kata Sandi</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="********"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white btn-orange-gradient hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="text-sm text-gray-600">
          Belum punya akun?{' '}
          <Link href="/register" className="text-emerald-600 font-semibold hover:underline">
            Daftar sekarang
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
    </div>
  );
}

