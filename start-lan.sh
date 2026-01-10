#!/bin/bash

# Loto LAN Party - Startup Script
# Run this on the Host Machine

echo "🎱 LOTO - LAN HOST MODE"
echo "----------------------"
echo "📦 Checking dependencies..."

if [ ! -d "node_modules" ]; then
    echo "First run detected. Installing..."
    npm ci
fi

# Detect OS
OS="$(uname)"
if [ "$OS" == "Darwin" ]; then
    # macOS
    IP=$(ipconfig getifaddr en0)
else
    # Linux
    IP=$(hostname -I | cut -d' ' -f1)
fi

echo "✅ Host IP detected: $IP"
echo "🚀 Starting server..."
echo "📱 Open http://$IP:3000 to verify connection"
echo "----------------------"

# Start in production mode if built, otherwise dev
if [ -d ".next" ]; then
    npm start
else
    echo "Building for production..."
    npm run build
    npm start
fi
