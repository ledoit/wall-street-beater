# 🚀 Wall Street Beater

A fast, accurate, and reliable stock price fetcher built with Node.js and React - **unified in a single server**.

## ✨ Features

- **Lightning Fast**: Built with Node.js for maximum performance
- **Real-time Data**: Fetch current stock prices instantly
- **Multi-Symbol Search**: Search multiple stocks simultaneously with flexible input
- **Quick Groups**: Pre-defined stock categories for instant loading
- **Beautiful UI**: Modern React frontend with responsive design
- **Flexible Input**: Supports space-separated, comma-separated, or mixed symbol formats
- **Error Handling**: Robust error handling with dismissible notifications
- **Unified Server**: Single port (3000) serves both API and frontend
- **Standalone**: No Docker required - runs natively on any platform

## 🚀 Quick Start

### Option 1: One-Click Start (Recommended)

**Windows:**
```bash
# Double-click start.bat or run:
start.bat
```

**Mac/Linux:**
```bash
# Run the startup script:
./start.sh
```

### Option 2: Manual Start

```bash
cd app

# Install dependencies
npm install

# Start the unified server
npm start

# Application will be available at http://localhost:3000
```

## 📊 API Endpoints

### Get Multiple Stock Prices
```bash
GET /prices?symbols=AAPL,TSLA,MSFT
```

**Example:**
```bash
curl "http://localhost:3000/prices?symbols=AAPL,TSLA,MSFT"
```

**Response:**
```json
{
  "success": true,
  "prices": [
    {
      "symbol": "AAPL",
      "price": 150.25,
      "currency": "USD",
      "timestamp": 1703123456,
      "source": "yahoo",
      "change_24h": 2.15,
      "change_percent_24h": 1.45
    }
  ],
  "total_requested": 3,
  "total_successful": 3,
  "total_failed": 0
}
```

### Get Stock Groups
```bash
GET /groups
```

### Health Check
```bash
GET /health
```

## 🛠️ Technology Stack

### Backend
- **Node.js**: High-performance JavaScript runtime
- **Express**: Fast web framework
- **Axios**: HTTP client for external API calls
- **CORS**: Cross-origin resource sharing

### Frontend
- **React 18**: Modern UI library (via CDN)
- **Babel**: JSX transformation (via CDN)
- **Axios**: HTTP client for API calls
- **CSS3**: Modern responsive styling

### Architecture
- **Unified Server**: Single Express server serves both API and frontend
- **Static Files**: React app served as static HTML with inline JavaScript
- **No Build Process**: Direct HTML/JS execution - no compilation needed
- **Cross-platform**: Windows, Mac, and Linux support

## 🎯 Supported Input Formats

The application accepts symbols in any of these formats:
- **Space-separated**: `AAPL TSLA MSFT`
- **Comma-separated**: `AAPL,TSLA,MSFT`
- **Mixed format**: `AAPL, TSLA MSFT GOOGL`
- **Messy input**: `  AAPL  ,  TSLA  ,  MSFT  ` (automatically cleaned)

## 🏷️ Quick Groups

Pre-defined stock categories for instant loading:
- **Tech Giants**: AAPL, MSFT, GOOGL, META, NVDA, NFLX, AMZN, TSLA
- **Financial Sector**: JPM, BAC, WFC, GS, MS, C, AXP, V
- **Healthcare**: JNJ, PFE, UNH, ABBV, MRK, TMO, ABT, LLY
- **Energy Sector**: XOM, CVX, COP, EOG, SLB, KMI, PSX, VLO
- **Retail & Consumer**: WMT, TGT, COST, HD, LOW, NKE, SBUX, MCD
- **Crypto-Related**: COIN, MSTR, RIOT, MARA, HUT, BITF, CAN, HIVE

## 📈 Performance

- **Response Time**: < 100ms for price fetches
- **Concurrent Requests**: Handles multiple simultaneous requests
- **Memory Usage**: < 50MB for the entire application
- **CPU Usage**: Minimal overhead with async processing
- **No Dependencies**: Runs without Docker or complex setup

## 🚀 Deployment

### Vercel Deployment

1. **Connect your GitHub repository** to Vercel
2. **Framework Preset**: Select "Other" or "Node.js"
3. **Build Command**: `cd app && npm install`
4. **Output Directory**: `app/public`
5. **Install Command**: `cd app && npm install`

### Alternative Vercel Configuration

Create `vercel.json` in the root directory:
```json
{
  "buildCommand": "cd app && npm install",
  "outputDirectory": "app/public",
  "installCommand": "cd app && npm install",
  "devCommand": "cd app && npm start"
}
```

### Traditional Deployment

1. **Clone the repository**
2. **Install dependencies**: `cd app && npm install`
3. **Start the server**: `npm start`
4. **Configure reverse proxy** (nginx, Apache, etc.)
5. **Set up SSL certificate** for HTTPS

## 🔧 Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

### Customization

- **Add new stock groups**: Edit the `/groups` endpoint in `server.js`
- **Modify UI styling**: Edit the CSS in `public/index.html`
- **Add new features**: Extend the React components in `public/index.html`