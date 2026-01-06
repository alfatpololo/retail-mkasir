# Setup Tauri untuk Build Desktop Application

Dokumen ini menjelaskan cara setup dan build aplikasi Retail MKASIR untuk desktop menggunakan Tauri.

## Prerequisites

Sebelum memulai, pastikan sudah terinstall:

1. **Node.js** (v18 atau lebih baru) - sudah terinstall ✓
2. **Rust** - install dengan command:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
   Atau download dari: https://www.rust-lang.org/tools/install

3. **System Dependencies:**

   **macOS:**
   ```bash
   # Install Xcode Command Line Tools
   xcode-select --install
   ```

   **Windows:**
   - Install Microsoft C++ Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Install WebView2 (usually comes with Windows 11, or download from Microsoft)

   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.1-dev \
     build-essential \
     curl \
     wget \
     file \
     libssl-dev \
     libgtk-3-dev \
     libayatana-appindicator3-dev \
     librsvg2-dev
   ```

## Installation

1. **Install Tauri dependencies:**
   ```bash
   npm install
   ```

2. **Verifikasi Rust installation:**
   ```bash
   rustc --version
   cargo --version
   ```

## Development

Jalankan aplikasi dalam mode development:

```bash
npm run tauri:dev
```

Command ini akan:
- Menjalankan Next.js dev server
- Build Tauri app dengan hot reload
- Membuka window desktop aplikasi

## Build untuk Production

### Build untuk semua platform:

```bash
npm run tauri:build
```

### Build untuk platform spesifik:

**macOS:**
```bash
npm run tauri:build -- --target aarch64-apple-darwin  # Apple Silicon
npm run tauri:build -- --target x86_64-apple-darwin   # Intel Mac
```

**Windows:**
```bash
npm run tauri:build -- --target x86_64-pc-windows-msvc
```

**Linux:**
```bash
npm run tauri:build -- --target x86_64-unknown-linux-gnu
```

Build output akan berada di: `src-tauri/target/{target}/release/`

## Menambahkan Icons

Ganti file di `src-tauri/icons/` dengan icon aplikasi Anda:

- `32x32.png` - 32x32 pixel PNG
- `128x128.png` - 128x128 pixel PNG
- `128x128@2x.png` - 256x256 pixel PNG (retina)
- `icon.icns` - macOS icon (dapat dibuat dari PNG)
- `icon.ico` - Windows icon (dapat dibuat dari PNG)

Tools untuk generate icons:
- macOS: https://cloudconvert.com/png-to-icns
- Windows: https://cloudconvert.com/png-to-ico

Atau gunakan Tauri Icon Generator:
```bash
npx @tauri-apps/cli icon path/to/your/icon.png
```

## Konfigurasi

File konfigurasi utama ada di:
- `src-tauri/tauri.conf.json` - Konfigurasi Tauri
- `src-tauri/Cargo.toml` - Konfigurasi Rust dependencies

## Troubleshooting

### Error: "WebView2 not found" (Windows)
- Install Microsoft Edge WebView2 runtime
- Download dari: https://developer.microsoft.com/microsoft-edge/webview2/

### Error: "libwebkit2gtk-4.1-dev not found" (Linux)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev
```

### Error: Build failed
- Pastikan Rust terinstall dengan benar: `rustc --version`
- Update Rust: `rustup update`
- Clean build: `cd src-tauri && cargo clean && cd ..`

### Error: Port 3000 sudah digunakan
- Ubah port di `tauri.conf.json`:
  ```json
  "devPath": "http://localhost:3001"
  ```
- Atau stop process yang menggunakan port 3000

## Tips

1. **First build akan memakan waktu lama** karena perlu download dan compile Rust dependencies
2. **Build size** untuk production bisa mencapai 10-50MB tergantung platform
3. **Code signing** untuk macOS dan Windows memerlukan developer certificate untuk distribusi
4. **Auto-updater** dapat ditambahkan menggunakan `tauri-plugin-updater`

## Platform-specific Notes

### macOS
- Akan menghasilkan `.app` bundle
- Code signing diperlukan untuk distribusi (bisa skip untuk testing)
- Notarization diperlukan untuk distribusi di luar App Store

### Windows
- Akan menghasilkan `.msi` installer dan `.exe` executable
- Code signing diperlukan untuk menghindari Windows Defender warning
- Dapat dibuat portable executable

### Linux
- Akan menghasilkan `.AppImage`, `.deb`, atau `.rpm` tergantung konfigurasi
- `.AppImage` adalah format universal yang bisa jalan di semua distro
- `.deb` untuk Debian/Ubuntu, `.rpm` untuk Fedora/RHEL

