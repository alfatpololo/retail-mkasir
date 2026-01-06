# Retail MKASIR - Point of Sale System

Aplikasi Point of Sale (POS) modern untuk retail/minimarket yang dibangun dengan Next.js dan dapat di-build untuk desktop menggunakan Tauri.

## Getting Started

### Web Development

First, install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Desktop Application (Tauri)

Untuk build aplikasi desktop, lihat dokumentasi lengkap di [TAURI_SETUP.md](./TAURI_SETUP.md).

**Quick Start:**

1. Install Rust (jika belum):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development mode:
   ```bash
   npm run tauri:dev
   ```

4. Build untuk production:
   ```bash
   npm run tauri:build
   ```

## Available Scripts

- `npm run dev` - Run Next.js development server (web)
- `npm run build` - Build Next.js for production (web)
- `npm run tauri:dev` - Run Tauri development mode (desktop)
- `npm run tauri:build` - Build Tauri app for production (desktop)
- `npm run lint` - Run ESLint

## Features

- 🎨 10 pilihan tema warna dengan gradient yang menarik
- 🖨️ Dukungan printer untuk struk
- 📱 Responsive design untuk mobile dan desktop
- 🛒 Sistem cart dan checkout
- 📊 Laporan dan transaksi
- 🏷️ Manajemen produk dan kategori
- 👥 Manajemen customer
- 💰 Manajemen kasir dan tutup buka kasir

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS
- **Desktop:** Tauri 2.x
- **Icons:** Remix Icon

## Platform Support

### Web
- Modern browsers (Chrome, Firefox, Safari, Edge)

### Desktop (via Tauri)
- macOS (Apple Silicon & Intel)
- Windows (x64)
- Linux (x64)

## Documentation

- [Tauri Setup Guide](./TAURI_SETUP.md) - Panduan lengkap setup dan build Tauri

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tauri Documentation](https://tauri.app/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
