@echo off
echo 🚀 Starting Wall Street Beater Price Fetcher...
echo.

echo 📦 Installing dependencies...
cd backend-nodejs
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🚀 Starting unified server...
echo ✅ Wall Street Beater Price Fetcher is starting!
echo 🌐 Application: http://localhost:3000
echo 📊 API: http://localhost:3000/price/AAPL
echo.
echo Press Ctrl+C to stop the server...
npm start
