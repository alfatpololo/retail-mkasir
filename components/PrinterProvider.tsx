'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type PrinterConnectionType = 'usb' | 'bluetooth' | 'system';

export interface PrinterConnectionState {
  isConnected: boolean;
  type: PrinterConnectionType;
  deviceName?: string;
  lastUpdated?: string;
}

interface PrinterContextValue extends PrinterConnectionState {
  setConnection: (state: PrinterConnectionState) => void;
  clearConnection: () => void;
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

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PrinterConnectionState;
        setState({
          ...DEFAULT_STATE,
          ...parsed,
        });
      }
    } catch {
      // abaikan error parsing
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  return (
    <PrinterContext.Provider
      value={{
        ...state,
        setConnection,
        clearConnection,
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


