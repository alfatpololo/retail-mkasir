'use client';

import { usePrinter } from './PrinterProvider';
import Link from 'next/link';

export default function PrinterStatusIndicator({ showLabel = true, size = 'default' }: { showLabel?: boolean; size?: 'small' | 'default' | 'large' }) {
  const { isConnected, type, deviceName } = usePrinter();

  const getTypeLabel = () => {
    switch (type) {
      case 'usb':
        return 'USB';
      case 'bluetooth':
        return 'BT';
      case 'system':
        return 'Sistem';
      default:
        return 'Unknown';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'usb':
        return 'ri-usb-line';
      case 'bluetooth':
        return 'ri-bluetooth-line';
      case 'system':
        return 'ri-computer-line';
      default:
        return 'ri-printer-line';
    }
  };

  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    default: 'text-sm px-3 py-1.5',
    large: 'text-base px-4 py-2',
  };

  const iconSizeClasses = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg',
  };

  if (!isConnected) {
    return (
      <Link
        href="/settings"
        className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-all cursor-pointer`}
        title="Printer tidak terhubung. Klik untuk ke Settings"
      >
        <i className={`ri-printer-line ${iconSizeClasses[size]}`}></i>
        {showLabel && <span className="font-medium">Printer: Tidak Terhubung</span>}
        <i className="ri-arrow-right-s-line text-xs"></i>
      </Link>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700`}
      title={`Printer terhubung via ${getTypeLabel()}: ${deviceName || 'Printer Default'}`}
    >
      <i className={`ri-checkbox-circle-line ${iconSizeClasses[size]} text-emerald-600`}></i>
      <i className={`${getTypeIcon()} ${iconSizeClasses[size]}`}></i>
      {showLabel && (
        <>
          <span className="font-medium">Printer:</span>
          <span className="font-semibold">{getTypeLabel()}</span>
          {deviceName && size !== 'small' && (
            <span className="text-xs opacity-75 truncate max-w-[120px]">{deviceName}</span>
          )}
        </>
      )}
    </div>
  );
}

