@echo off
REM Icon generation script for Tauri (Windows batch version)
REM This script creates placeholder icons in the required sizes
REM For production, replace with your actual app icons

setlocal enabledelayedexpansion
set ICON_DIR=src-tauri\icons

echo.
echo Tauri Icon Generation Script
echo =============================
echo.
echo This script will help create placeholder icons.
echo For production, replace these with your actual app logo.
echo.

REM Create icons directory if it doesn't exist
if not exist "%ICON_DIR%" mkdir "%ICON_DIR%"

echo Checking for ImageMagick...

REM Check if ImageMagick is installed
where convert >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ImageMagick not found. Please install it:
    echo.
    echo 1. Download: https://imagemagick.org/script/download.php
    echo 2. Run the Windows installer
    echo 3. Make sure to check "Add ImageMagick to PATH"
    echo 4. Restart your terminal
    echo 5. Run this script again
    echo.
    pause
    exit /b 1
)

echo Found ImageMagick, generating icons...
echo.

set COLOR=#6366f1

REM Generate different icon sizes
for %%S in (32, 128, 256, 512, 1024) do (
    echo Generating %%Sx%%S.png...
    convert -size %%Sx%%S xc:%COLOR% ^
            -bordercolor white -border 20 ^
            "%ICON_DIR%\%%Sx%%S.png"
)

echo Generating 128x128@2x.png...
convert -size 256x256 xc:%COLOR% ^
        -bordercolor white -border 20 ^
        "%ICON_DIR%\128x128@2x.png"

echo Generating icon.ico for Windows...
convert "%ICON_DIR%\256x256.png" ^
        -define icon:auto-resize=256,128,96,64,48,32,16 ^
        "%ICON_DIR%\icon.ico"

echo.
echo Icon generation complete!
echo.
echo Files created in: %ICON_DIR%\
echo.
echo IMPORTANT: For production use
echo - Replace these placeholder icons with your actual app logo
echo - Icons should be PNG with transparent background
echo - Keep the 32x32, 128x128, 256x256, 512x512, 1024x1024 sizes
echo - Also need icon.ico (Windows) and icon.icns (macOS)
echo.
pause
