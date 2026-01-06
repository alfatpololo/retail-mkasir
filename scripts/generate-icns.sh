#!/bin/bash

# Generate .icns file from PNG icons (macOS only)
# Usage: ./scripts/generate-icns.sh

ICONS_DIR="src-tauri/icons"
ICONSET="icon.iconset"

echo "Generating .icns file..."

# Create iconset directory
mkdir -p "$ICONSET"

# Copy icons to iconset with proper naming
# macOS requires specific naming convention
if [ -f "$ICONS_DIR/32x32.png" ]; then
    cp "$ICONS_DIR/32x32.png" "$ICONSET/icon_16x16.png"
    cp "$ICONS_DIR/32x32.png" "$ICONSET/icon_16x16@2x.png"
fi

if [ -f "$ICONS_DIR/128x128.png" ]; then
    cp "$ICONS_DIR/128x128.png" "$ICONSET/icon_128x128.png"
fi

if [ -f "$ICONS_DIR/128x128@2x.png" ]; then
    cp "$ICONS_DIR/128x128@2x.png" "$ICONSET/icon_256x256.png"
    cp "$ICONS_DIR/128x128@2x.png" "$ICONSET/icon_512x512.png"
    cp "$ICONS_DIR/128x128@2x.png" "$ICONSET/icon_512x512@2x.png"
fi

# Generate .icns file
iconutil -c icns "$ICONSET" -o "$ICONS_DIR/icon.icns"

# Cleanup
rm -rf "$ICONSET"

if [ -f "$ICONS_DIR/icon.icns" ]; then
    echo "✓ icon.icns generated successfully!"
else
    echo "✗ Failed to generate icon.icns"
    exit 1
fi

