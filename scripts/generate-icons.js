#!/usr/bin/env node

/**
 * Script untuk generate Tauri icons dari logo
 * Usage: node scripts/generate-icons.js [path-to-icon.png]
 */

const fs = require('fs');
const path = require('path');

const inputIcon = process.argv[2] || 'public/images/iconmkasir.png';
const outputDir = 'src-tauri/icons';

// Check if sharp is available, otherwise use alternative method
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Error: sharp package not found.');
  console.error('Please install it first: npm install --save-dev sharp');
  console.error('\nOr use ImageMagick/sips (macOS) to manually resize:');
  console.error('\nmacOS:');
  console.error(`  sips -z 1024 1024 ${inputIcon} --out ${outputDir}/1024x1024.png`);
  console.error(`  sips -z 32 32 ${outputDir}/1024x1024.png --out ${outputDir}/32x32.png`);
  console.error(`  sips -z 128 128 ${outputDir}/1024x1024.png --out ${outputDir}/128x128.png`);
  console.error(`  sips -z 256 256 ${outputDir}/1024x1024.png --out ${outputDir}/128x128@2x.png`);
  process.exit(1);
}

async function generateIcons() {
  try {
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Generating icons from: ${inputIcon}`);
    
    // Read and get metadata
    const image = sharp(inputIcon);
    const metadata = await image.metadata();
    
    console.log(`Original size: ${metadata.width}x${metadata.height}`);
    
    // Determine target size (use the larger dimension to make it square)
    const targetSize = Math.max(metadata.width, metadata.height, 1024);
    const squareSize = 1024; // Tauri recommends 1024x1024
    
    // Resize to square (center crop + resize to ensure square)
    const squareBuffer = await image
      .resize(squareSize, squareSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
      })
      .toBuffer();
    
    const squareImage = sharp(squareBuffer);
    
    // Generate all required sizes
    const sizes = [
      { size: 32, name: '32x32.png' },
      { size: 128, name: '128x128.png' },
      { size: 256, name: '128x128@2x.png' },
      { size: 512, name: '512x512.png' }, // Extra for icns
      { size: 1024, name: '1024x1024.png' } // Extra for icns
    ];
    
    console.log('\nGenerating icon sizes:');
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      await squareImage
        .clone()
        .resize(size, size)
        .toFile(outputPath);
      console.log(`  ✓ ${name} (${size}x${size})`);
    }
    
    console.log('\n✓ Icons generated successfully!');
    console.log('\nNote: For .icns and .ico files, you can:');
    console.log('  1. Use online converters (cloudconvert.com)');
    console.log('  2. Use iconutil on macOS for .icns');
    console.log('  3. The PNG files above are sufficient for basic builds');
    
  } catch (error) {
    console.error('Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();

