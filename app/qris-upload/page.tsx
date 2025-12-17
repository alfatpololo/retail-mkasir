'use client';

import Sidebar from '@/components/Sidebar';

export default function QrisUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 pl-0 2xl:pl-64">
      <Sidebar />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Upload QRIS
          </h1>
          <p className="text-sm text-gray-600">
            Unggah gambar QRIS untuk pembayaran non-tunai.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-8 space-y-6">
          <div className="border-2 border-dashed border-gray-200 rounded-xl px-6 py-10 flex flex-col items-center justify-center text-center">
            <span className="ri-qr-code-line text-4xl text-gray-400 mb-3" />
            <p className="text-sm text-gray-700 font-medium mb-1">
              Tarik & lepas file QRIS di sini
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Format PNG/JPG, maks. 2MB.
            </p>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              Pilih File
            </button>
          </div>

          <p className="text-[11px] text-gray-500">
            Halaman ini masih berupa tampilan awal. Tambahkan logika upload
            sesuaikan dengan API backend Anda.
          </p>
        </div>
      </div>
    </div>
  );
}


