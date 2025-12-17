'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password !== form.confirm) {
      alert('Konfirmasi password tidak cocok');
      return;
    }

    if (form.password.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    if (!form.phone || form.phone.length < 10) {
      alert('Nomor HP tidak valid');
      return;
    }

    setIsLoading(true);

    try {
      // Simpan user ke localStorage
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      // Cek apakah nomor HP sudah terdaftar
      const existingUser = users.find((u: any) => u.phone === form.phone);
      if (existingUser) {
        alert('Nomor HP sudah terdaftar. Silakan login.');
        setIsLoading(false);
        return;
      }

      const newUser = {
        id: `USER-${Date.now()}`,
        name: form.name,
        phone: form.phone,
        password: form.password, // Dalam production, password harus di-hash
        pin: '123456', // Default PIN untuk kasir (dalam production, ini harus di-set oleh admin)
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      alert('Registrasi berhasil! Silakan login.');
      router.push('/login');
    } catch (error) {
      console.error('Register error:', error);
      alert('Terjadi kesalahan saat registrasi');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Daftar Akun Baru</h1>
          <p className="text-sm text-gray-600">Masukkan data dasar untuk membuat akun.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama lengkap"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nomor HP</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
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
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Konfirmasi Kata Sandi</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Ulangi kata sandi"
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
            {isLoading ? 'Mendaftar...' : 'Daftar'}
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
    </div>
  );
}

