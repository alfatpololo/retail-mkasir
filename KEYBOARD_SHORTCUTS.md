# Keyboard Shortcuts

Daftar keyboard shortcuts yang tersedia di aplikasi Retail MKASIR Desktop.

## Shortcuts Global (Berlaku di Semua Halaman)

### Navigation & Search
- **`F`** atau **`Cmd/Ctrl + K`** - Focus ke search bar / scan input
- **`Esc`** - Tutup modal, clear search, atau kembali

### Cart & Checkout
- **`C`** - Toggle cart (buka/tutup keranjang)
- **`Enter`** - Submit form / Proses checkout (ketika di form)

### Product Management
- **`↑` (Arrow Up)** - Increment quantity (dalam cart item)
- **`↓` (Arrow Down)** - Decrement quantity (dalam cart item)
- **`Delete`** - Hapus item dari cart (ketika item selected)

## Platform-Specific Shortcuts

### macOS
- **`Cmd + K`** - Focus search (macOS standard)
- **`Cmd + W`** - Close window (handled by Tauri)
- **`Cmd + Q`** - Quit application (handled by Tauri)

### Windows
- **`Ctrl + K`** - Focus search
- **`Ctrl + W`** - Close window (handled by Tauri)
- **`Alt + F4`** - Close application (handled by Tauri)

### Linux
- **`Ctrl + K`** - Focus search
- **`Ctrl + W`** - Close window (handled by Tauri)
- **`Ctrl + Q`** - Quit application (handled by Tauri)

## Barcode Scanner Integration

Aplikasi secara otomatis mendeteksi input barcode:
- Ketik/tempel barcode (minimal 6 digit) lalu tekan **`Enter`**
- Otomatis fokus ke search dan mencari produk
- Tidak perlu fokus manual ke input field

## Catatan

1. **Shortcuts tidak akan trigger ketika:**
   - User sedang mengetik di input field atau textarea
   - Modal dialog sedang terbuka (kecuali Escape untuk tutup)

2. **Global shortcuts** (via Tauri plugin):
   - Berfungsi bahkan ketika aplikasi tidak dalam fokus (opsional, bisa diaktifkan)
   - `Cmd/Ctrl + K` untuk focus search (global)

3. **Shortcuts yang sama di semua OS:**
   - Menggunakan format `CommandOrControl` yang otomatis menjadi `Cmd` di macOS dan `Ctrl` di Windows/Linux

## Menambahkan Shortcut Baru

Untuk menambahkan shortcut baru, edit file:
- `utils/keyboardShortcuts.ts` - Definisi shortcuts
- `app/page.tsx` - Handler untuk shortcuts di halaman utama
- `src-tauri/src/main.rs` - Global shortcuts (untuk cross-app shortcuts)

