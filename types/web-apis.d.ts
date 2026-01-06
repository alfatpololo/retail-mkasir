// Type definitions for Web APIs not in TypeScript standard library

// WebUSB API
interface USBDevice {
  opened: boolean;
  vendorId: number;
  productId: number;
  serialNumber?: string;
  manufacturerName?: string;
  productName?: string;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
  transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
}

interface USBOutTransferResult {
  status: 'ok' | 'stall' | 'babble';
  bytesWritten: number;
}

interface USBInTransferResult {
  status: 'ok' | 'stall' | 'babble';
  data?: DataView;
}

interface Navigator {
  usb?: {
    getDevices(): Promise<USBDevice[]>;
    requestDevice(options: { filters: Array<{ vendorId?: number; productId?: number }> }): Promise<USBDevice>;
  };
  bluetooth?: {
    requestDevice(options: { filters?: Array<{ services?: string[]; name?: string }>; acceptAllDevices?: boolean }): Promise<BluetoothDevice>;
    getAvailability(): Promise<boolean>;
  };
}

// BarcodeDetector API
interface BarcodeDetectorOptions {
  formats?: string[];
}

interface DetectedBarcode {
  rawValue: string;
  value: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: Array<{ x: number; y: number }>;
}

interface BarcodeDetector {
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: BarcodeDetectorOptions): BarcodeDetector;
}

interface Window {
  BarcodeDetector?: BarcodeDetectorConstructor;
}

// Bluetooth API
interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  watchAdvertisements(): Promise<void>;
  unwatchAdvertisements(): void;
  addEventListener(type: 'advertisementreceived', listener: (event: BluetoothAdvertisingEvent) => void): void;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService extends EventTarget {
  device: BluetoothDevice;
  uuid: string;
  isPrimary: boolean;
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothCharacteristicProperties {
  broadcast: boolean;
  read: boolean;
  writeWithoutResponse: boolean;
  write: boolean;
  notify: boolean;
  indicate: boolean;
  authenticatedSignedWrites: boolean;
  reliableWrite: boolean;
  writableAuxiliaries: boolean;
}

interface BluetoothAdvertisingEvent extends Event {
  device: BluetoothDevice;
  uuids: string[];
  name?: string;
  appearance?: number;
  txPower?: number;
  rssi?: number;
  manufacturerData?: Map<number, DataView>;
  serviceData?: Map<string, DataView>;
}

