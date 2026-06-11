#!/bin/bash
# Icon generation script for Tauri
# This script creates placeholder icons in the required sizes
# For production, replace with your actual app icons

set -e

ICON_DIR="src-tauri/icons"

echo "📦 Tauri Icon Generation Script"
echo "================================"
echo ""
echo "This script will download icon placeholder images."
echo "For production, replace these with your actual app logo."
echo ""

# Create icons directory if it doesn't exist
mkdir -p "$ICON_DIR"

echo "Downloading placeholder icons..."

# Download placeholder images at different sizes
# Using a simple square color for placeholder

# Define colors for placeholder
PLACEHOLDER_COLOR="6366f1"  # Indigo color

# Create simple PNG placeholders using ImageMagick or wget
# If ImageMagick is available, use it; otherwise use a URL-based approach

if command -v convert &> /dev/null; then
    echo "✓ ImageMagick found, generating icons..."
    
    # Generate icons at required sizes
    for size in 32 128 256 512 1024; do
        convert -size "${size}x${size}" "xc:#${PLACEHOLDER_COLOR}" \
                -bordercolor white -border 20 \
                "${ICON_DIR}/${size}x${size}.png"
        echo "✓ Generated ${size}x${size}.png"
    done
    
    # Also create 128x128@2x version
    convert -size 256x256 "xc:#${PLACEHOLDER_COLOR}" \
            -bordercolor white -border 20 \
            "${ICON_DIR}/128x128@2x.png"
    echo "✓ Generated 128x128@2x.png"
    
    # Create ICO file for Windows (requires convert)
    convert "${ICON_DIR}/256x256.png" \
            -define icon:auto-resize=256,128,96,64,48,32,16 \
            "${ICON_DIR}/icon.ico"
    echo "✓ Generated icon.ico for Windows"
    
    # Create ICNS file for macOS (requires ImageMagick with ICNS support)
    if command -v png2icns &> /dev/null; then
        png2icns "${ICON_DIR}/icon.icns" "${ICON_DIR}/256x256.png"
        echo "✓ Generated icon.icns for macOS"
    else
        echo "⚠ png2icns not found, skipping ICNS generation"
        echo "  Install with: brew install libicns"
    fi
else
    echo "⚠ ImageMagick not found. Install with:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/script/download.php"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "✅ Icon generation complete!"
echo ""
echo "Next steps:"
echo "1. Replace placeholder icons with your actual app logo"
echo "2. Icons should be PNG format with transparent background"
echo "3. Required sizes: 32x32, 128x128, 256x256, 512x512, 1024x1024"
echo "4. Also need: icon.ico (Windows), icon.icns (macOS)"
echo ""
echo "Files are in: ${ICON_DIR}/"
