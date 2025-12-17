'use client';

import Sidebar from '@/components/Sidebar';

export default function EmployeesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pl-0 lg:pl-64">
      <Sidebar />

      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
              <i className="ri-user-settings-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Karyawan
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Kelola data dan akses karyawan kasir Anda.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 px-6 py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <i className="ri-user-settings-line text-5xl text-gray-300"></i>
            <p className="text-sm font-medium text-gray-500">Belum ada implementasi daftar karyawan</p>
            <p className="text-xs text-gray-400">Tambahkan integrasi API dan form karyawan di sini nanti</p>
          </div>
        </div>
      </div>
    </div>
  );
}


