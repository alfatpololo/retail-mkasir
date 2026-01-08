'use client';

import { useEffect } from 'react';

interface ToastNotificationProps {
  show: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function ToastNotification({
  show,
  message,
  type,
  onClose,
  duration = 3000,
}: ToastNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] animate-slide-in-right">
      <div className={`bg-white rounded-xl shadow-2xl border ${
        type === 'success' 
          ? 'border-emerald-200' 
          : 'border-red-200'
      } p-4 min-w-[320px] max-w-md`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            type === 'success' 
              ? 'bg-emerald-100' 
              : 'bg-red-100'
          }`}>
            <i className={`${
              type === 'success' 
                ? 'ri-checkbox-circle-fill text-emerald-500' 
                : 'ri-error-warning-fill text-red-500'
            } text-2xl`}></i>
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${
              type === 'success' ? 'text-gray-900' : 'text-red-900'
            } mb-1`}>
              {type === 'success' ? 'Berhasil!' : 'Error'}
            </p>
            <p className={`text-xs ${
              type === 'success' ? 'text-gray-600' : 'text-red-600'
            }`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <i className="ri-close-line text-gray-400"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

