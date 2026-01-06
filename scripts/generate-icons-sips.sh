#!/bin/bash

# Script untuk generate Tauri icons menggunakan sips (macOS built-in tool)
# Usage: ./scripts/generate-icons-sips.sh [path-to-icon.png]

INPUT_ICON="${1:-public/images/iconmkasir.png}"
OUTPUT_DIR="src-tauri/icons"

# Check if input file exists
if [ ! -f "$INPUT_ICON" ]; then
    echo "Error: File not found: $INPUT_ICON"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Generating icons from: $INPUT_ICON"
echo "Output directory: $OUTPUT_DIR"

# First, resize to 1024x1024 square (this will maintain aspect ratio with padding)
echo "Creating square 1024x1024 base..."
sips -z 1024 1024 "$INPUT_ICON" --out "$OUTPUT_DIR/temp_1024.png" > /dev/null 2>&1

# If that doesn't work (sips might not support -z for non-square), try different approach
if [ ! -f "$OUTPUT_DIR/temp_1024.png" ]; then
    echo "Trying alternative method..."
    # Get dimensions
    WIDTH=$(sips -g pixelWidth "$INPUT_ICON" | awk '/pixelWidth:/{print $2}')
    HEIGHT=$(sips -g pixelHeight "$INPUT_ICON" | awk '/pixelHeight:/{print $2}')
    
    # Use the larger dimension
    SIZE=$((WIDTH > HEIGHT ? WIDTH : HEIGHT))
    if [ $SIZE -lt 1024 ]; then
        SIZE=1024
    fi
    
    # Resize maintaining aspect ratio
    sips --resampleHeightWidthMax $SIZE "$INPUT_ICON" --out "$OUTPUT_DIR/temp_1024.png" > /dev/null 2>&1
fi

# Generate required sizes
echo "Generating icon sizes..."

# 32x32
sips -z 32 32 "$OUTPUT_DIR/temp_1024.png" --out "$OUTPUT_DIR/32x32.png" > /dev/null 2>&1 && echo "  ✓ 32x32.png"

# 128x128
sips -z 128 128 "$OUTPUT_DIR/temp_1024.png" --out "$OUTPUT_DIR/128x128.png" > /dev/null 2>&1 && echo "  ✓ 128x128.png"

# 256x256 (for 128x128@2x)
sips -z 256 256 "$OUTPUT_DIR/temp_1024.png" --out "$OUTPUT_DIR/128x128@2x.png" > /dev/null 2>&1 && echo "  ✓ 128x128@2x.png"

# Cleanup temp file
rm -f "$OUTPUT_DIR/temp_1024.png"

echo ""
echo "✓ PNG icons generated successfully!"
echo ""
echo "Note: For .icns (macOS) and .ico (Windows) files, you can:"
echo "  1. Use online converters like cloudconvert.com"
echo "  2. Use iconutil on macOS:"
echo "     mkdir icon.iconset"
echo "     cp $OUTPUT_DIR/32x32.png icon.iconset/icon_16x16.png"
echo "     cp $OUTPUT_DIR/128x128.png icon.iconset/icon_128x128.png"
echo "     cp $OUTPUT_DIR/128x128@2x.png icon.iconset/icon_256x256.png"
echo "     iconutil -c icns icon.iconset -o $OUTPUT_DIR/icon.icns"
echo "     rm -rf icon.iconset"
echo ""
echo "  3. Or the PNG files are sufficient for basic Tauri builds"

