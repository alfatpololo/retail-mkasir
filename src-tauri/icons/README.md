# Icon Files

File icon yang diperlukan untuk Tauri:

1. `32x32.png` - 32x32 pixel PNG
2. `128x128.png` - 128x128 pixel PNG  
3. `128x128@2x.png` - 256x256 pixel PNG (retina/high DPI)
4. `icon.icns` - macOS icon format
5. `icon.ico` - Windows icon format

## Generate Icons dari Logo

Anda bisa menggunakan logo dari `public/images/logomkasir.png` untuk membuat icon.

### Cara 1: Menggunakan Tauri Icon Generator (Recommended)

```bash
# Install Tauri CLI jika belum
npm install -D @tauri-apps/cli

# Generate icons dari logo
npx @tauri-apps/cli icon public/images/logomkasir.png
```

Command ini akan otomatis generate semua format icon yang diperlukan ke folder `src-tauri/icons/`.

### Cara 2: Manual (Online Tools)

1. **PNG Icons:**
   - Buka logo di image editor
   - Export sebagai:
     - `32x32.png` (32x32 pixels)
     - `128x128.png` (128x128 pixels)
     - `128x128@2x.png` (256x256 pixels)

2. **macOS .icns:**
   - Upload PNG ke: https://cloudconvert.com/png-to-icns
   - Download dan rename menjadi `icon.icns`

3. **Windows .ico:**
   - Upload PNG ke: https://cloudconvert.com/png-to-ico
   - Download dan rename menjadi `icon.ico`

### Cara 3: Menggunakan ImageMagick (Command Line)

```bash
# Install ImageMagick dulu (macOS: brew install imagemagick)

# Generate PNG sizes
convert public/images/logomkasir.png -resize 32x32 icons/32x32.png
convert public/images/logomkasir.png -resize 128x128 icons/128x128.png
convert public/images/logomkasir.png -resize 256x256 icons/128x128@2x.png

# Generate .icns (macOS only, requires iconutil)
mkdir icon.iconset
cp icons/32x32.png icon.iconset/icon_16x16.png
cp icons/128x128.png icon.iconset/icon_128x128.png
cp icons/128x128@2x.png icon.iconset/icon_256x256.png
iconutil -c icns icon.iconset -o icons/icon.icns
rm -rf icon.iconset
```

## Catatan

- Icon akan muncul di taskbar/dock, window title bar, dan installer
- Pastikan icon memiliki background transparan atau solid color
- Ukuran file icon tidak terlalu besar (usahakan < 500KB total)

