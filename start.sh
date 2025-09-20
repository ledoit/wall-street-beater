#!/bin/bash

echo "🚀 Starting Wall Street Beater Price Fetcher..."
echo

echo "📦 Installing dependencies..."
cd backend-nodejs
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo
echo "🚀 Starting unified server..."
echo "✅ Wall Street Beater Price Fetcher is starting!"
echo "🌐 Application: http://localhost:3000"
echo "📊 API: http://localhost:3000/price/AAPL"
echo
echo "Press Ctrl+C to stop the server..."

# Start the unified server
npm start
