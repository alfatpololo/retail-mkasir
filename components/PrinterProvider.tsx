'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { reconnectUSBDevice, reconnectBluetoothDevice, USBDevice } from '@/utils/printerUtils';

export type PrinterConnectionType = 'usb' | 'bluetooth' | 'system';

export interface PrinterConnectionState {
  isConnected: boolean;
  type: PrinterConnectionType;
  deviceName?: string;
  lastUpdated?: string;
  usbDevice?: USBDevice; // Referensi USB device untuk print langsung
  bluetoothDevice?: any; // Referensi Bluetooth device untuk print langsung
}

interface PrinterContextValue extends PrinterConnectionState {
  setConnection: (state: PrinterConnectionState) => void;
  clearConnection: () => void;
  setUsbDevice: (device: USBDevice | null) => void;
  setBluetoothDevice: (device: any) => void;
}

const DEFAULT_STATE: PrinterConnectionState = {
  isConnected: false,
  type: 'system',
};

const STORAGE_KEY = 'mkasir_printer_connection';

const PrinterContext = createContext<PrinterContextValue | undefined>(undefined);

export function PrinterProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PrinterConnectionState>(DEFAULT_STATE);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const restoreConnection = async () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as PrinterConnectionState;
          const restoredState = {
            ...DEFAULT_STATE,
            ...parsed,
          };
          
          setState(restoredState);
          
          // Auto-reconnect berdasarkan tipe koneksi
          if (restoredState.isConnected) {
            if (restoredState.type === 'usb') {
              try {
                const device = await reconnectUSBDevice();
                if (device) {
                  setState((prev) => ({
                    ...prev,
                    usbDevice: device,
                  }));
                }
              } catch (error) {
                console.error('Error saat auto-reconnect printer USB:', error);
              }
            } else if (restoredState.type === 'bluetooth') {
              try {
                const device = await reconnectBluetoothDevice();
                if (device) {
                  setState((prev) => ({
                    ...prev,
                    bluetoothDevice: device,
                  }));
                }
              } catch (error) {
                console.error('Error saat auto-reconnect printer Bluetooth:', error);
              }
            }
          }
        }
      } catch {
        // abaikan error parsing
      }
    };

    restoreConnection();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Jangan simpan device ke localStorage karena tidak bisa di-serialize
      const { usbDevice, bluetoothDevice, ...stateToSave } = state;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // abaikan error penyimpanan
    }
  }, [state]);

  const setConnection = (next: PrinterConnectionState) => {
    setState({
      ...next,
      lastUpdated: new Date().toISOString(),
    });
  };

  const clearConnection = () => {
    setState(DEFAULT_STATE);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // abaikan
      }
    }
  };

  const setUsbDevice = (device: USBDevice | null) => {
    setState((prev) => ({
      ...prev,
      usbDevice: device || undefined,
    }));
  };

  const setBluetoothDevice = (device: any) => {
    setState((prev) => ({
      ...prev,
      bluetoothDevice: device || undefined,
    }));
  };

  return (
    <PrinterContext.Provider
      value={{
        ...state,
        setConnection,
        clearConnection,
        setUsbDevice,
        setBluetoothDevice,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const ctx = useContext(PrinterContext);
  if (!ctx) {
    throw new Error('usePrinter harus dipakai di dalam PrinterProvider');
  }
  return ctx;
}


