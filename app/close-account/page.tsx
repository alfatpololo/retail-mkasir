'use client';

import Sidebar from '@/components/Sidebar';

export default function CloseAccountPage() {
  return (
    <div className="min-h-screen bg-gray-50 pl-0 2xl:pl-64">
      <Sidebar />

      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Tutup Akun
          </h1>
          <p className="text-sm text-gray-600">
            Menutup akun akan menghapus akses login dan data terkait kasir ini.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-red-200 px-6 py-7">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-full bg-red-50 text-red-600">
              <span className="ri-error-warning-line text-xl" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">
                Peringatan
              </p>
              <p className="text-xs text-red-600">
                Aksi ini bersifat sensitif. Pastikan Anda sudah melakukan backup
                data penting sebelum menutup akun.
              </p>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Alasan menutup akun (opsional)
              </label>
              <textarea
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="bg-red-50 border border-red-100 rounded-lg px-3.5 py-3 text-[11px] text-red-700">
              Dengan menekan tombol &quot;Tutup Akun&quot;, Anda menyetujui
              bahwa akun ini akan dinonaktifkan dan tidak dapat digunakan
              kembali untuk login.
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
            >
              Tutup Akun
            </button>

            <p className="mt-3 text-[11px] text-gray-500">
              Logika penutupan akun (API, konfirmasi tambahan, dsb.) belum
              diterapkan. Tambahkan sesuai alur bisnis backend Anda.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}


