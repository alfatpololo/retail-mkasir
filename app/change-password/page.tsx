'use client';

import Sidebar from '@/components/Sidebar';

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 pl-0 2xl:pl-64">
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
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kata sandi saat ini
              </label>
              <input
                type="password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kata sandi baru
              </label>
              <input
                type="password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ulangi kata sandi baru
              </label>
              <input
                type="password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              Simpan Kata Sandi
            </button>

            <p className="mt-3 text-[11px] text-gray-500">
              Form ini masih contoh tampilan. Tambahkan validasi dan koneksi API
              untuk mengganti kata sandi sebenarnya.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}


