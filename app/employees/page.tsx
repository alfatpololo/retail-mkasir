'use client';

import Sidebar from '@/components/Sidebar';

export default function EmployeesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Karyawan
          </h1>
          <p className="text-sm text-gray-600">
            Kelola data dan akses karyawan kasir Anda.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-8 text-center text-gray-500 text-sm">
          Belum ada implementasi daftar karyawan. Tambahkan integrasi API dan
          form karyawan di sini nanti.
        </div>
      </div>
    </div>
  );
}


