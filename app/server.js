const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Wall Street Beater Price Fetcher',
    timestamp: new Date().toISOString()
  });
});

// Get popular stock groups
app.get('/groups', (req, res) => {
  const groups = {
    tech: {
      name: 'Tech Giants',
      symbols: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'NFLX', 'AMZN', 'TSLA'],
      description: 'Major technology companies'
    },
    finance: {
      name: 'Financial Sector',
      symbols: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'V'],
      description: 'Banking and financial services'
    },
    healthcare: {
      name: 'Healthcare',
      symbols: ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'LLY'],
      description: 'Pharmaceutical and healthcare companies'
    },
    energy: {
      name: 'Energy Sector',
      symbols: ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'KMI', 'PSX', 'VLO'],
      description: 'Oil, gas, and energy companies'
    },
    retail: {
      name: 'Retail & Consumer',
      symbols: ['WMT', 'TGT', 'COST', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD'],
      description: 'Retail and consumer goods'
    },
    crypto: {
      name: 'Crypto-Related',
      symbols: ['COIN', 'MSTR', 'RIOT', 'MARA', 'HUT', 'BITF', 'CAN', 'HIVE'],
      description: 'Cryptocurrency and blockchain companies'
    }
  };
  
  res.json(groups);
});

// Get single stock price
app.get('/price/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const source = req.query.source || 'yahoo';
  
  console.log(`📈 Fetching price for ${symbol} from ${source}`);
  
  try {
    const priceData = await fetchPrice(symbol, source);
    console.log(`✅ Successfully fetched ${symbol}: $${priceData.price}`);
    res.json(priceData);
  } catch (error) {
    console.error(`❌ Failed to fetch ${symbol}:`, error.message);
    res.status(400).json({
      error: 'PRICE_FETCH_FAILED',
      message: `Failed to fetch price for ${symbol}: ${error.message}`
    });
  }
});

// Get multiple stock prices
app.get('/prices', async (req, res) => {
  const symbols = req.query.symbols;
  const source = req.query.source || 'yahoo';

  if (!symbols) {
    return res.status(400).json({
      error: 'MISSING_SYMBOLS',
      message: "Missing 'symbols' parameter. Use comma or space-separated values like: ?symbols=AAPL,TSLA,MSFT or ?symbols=AAPL TSLA MSFT"
    });
  }

  // Handle both comma and space separated symbols
  const symbolList = symbols.split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
  console.log(`📊 Fetching prices for ${symbolList.length} symbols from ${source}`);
  
  // Use Promise.allSettled for better performance and error handling
  const promises = symbolList.map(symbol => 
    fetchPrice(symbol, source).catch(error => ({
      symbol,
      error: error.message
    }))
  );
  
  const results = await Promise.allSettled(promises);
  
  const prices = [];
  const errors = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.error) {
        errors.push(`${symbolList[index]}: ${result.value.error}`);
      } else {
        prices.push(result.value);
      }
    } else {
      errors.push(`${symbolList[index]}: ${result.reason.message}`);
    }
  });
  
  res.json({
    success: prices.length > 0,
    prices,
    errors: errors.length > 0 ? errors : undefined,
    total_requested: symbolList.length,
    total_successful: prices.length,
    total_failed: errors.length
  });
});

// Price fetching function
async function fetchPrice(symbol, source) {
  switch (source.toLowerCase()) {
    case 'yahoo':
      return await fetchYahooPrice(symbol);
    case 'mock':
      return await fetchMockPrice(symbol);
    default:
      console.warn(`Unknown source: ${source}, falling back to mock`);
      return await fetchMockPrice(symbol);
  }
}

// Yahoo Finance API (free alternative)
async function fetchYahooPrice(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'WSB-Price-Fetcher/1.0'
      },
      timeout: 5000
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = response.data;
    const result = data.chart?.result?.[0];
    
    if (!result) {
      throw new Error('Invalid response format');
    }
    
    const meta = result.meta;
    if (!meta) {
      throw new Error('Missing meta data');
    }
    
    const price = meta.regularMarketPrice;
    if (price === undefined || price === null) {
      throw new Error('Missing price data');
    }
    
    return {
      symbol: symbol,
      price: parseFloat(price.toFixed(2)),
      currency: meta.currency || 'USD',
      timestamp: Math.floor(Date.now() / 1000),
      source: 'yahoo',
      change_24h: meta.regularMarketChange ? parseFloat(meta.regularMarketChange.toFixed(2)) : null,
      change_percent_24h: meta.regularMarketChangePercent ? parseFloat(meta.regularMarketChangePercent.toFixed(2)) : null
    };
  } catch (error) {
    throw new Error(`Yahoo API error: ${error.message}`);
  }
}

// Mock price generator for testing
async function fetchMockPrice(symbol) {
  // Generate realistic mock prices based on symbol
  const basePrices = {
    'AAPL': 150.0,
    'TSLA': 200.0,
    'MSFT': 300.0,
    'GOOGL': 2500.0,
    'AMZN': 3000.0,
    'NVDA': 400.0,
    'META': 250.0,
    'NFLX': 400.0,
    'JPM': 150.0,
    'BAC': 30.0,
    'WFC': 40.0,
    'GS': 350.0
  };
  
  const basePrice = basePrices[symbol] || (100.0 + (symbol.length * 10));
  
  // Add some random variation
  const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
  const price = basePrice * (1 + variation);
  
  const change24h = (Math.random() - 0.5) * 10; // ±$5 change
  const changePercent24h = (change24h / price) * 100;
  
  return {
    symbol: symbol,
    price: parseFloat(price.toFixed(2)),
    currency: 'USD',
    timestamp: Math.floor(Date.now() / 1000),
    source: 'mock',
    change_24h: parseFloat(change24h.toFixed(2)),
    change_percent_24h: parseFloat(changePercent24h.toFixed(2))
  };
}

// Serve static files only for specific routes (not catch-all)
const publicPath = path.join(__dirname, 'public');
app.use('/static', express.static(publicPath));

// Serve React app for all non-API routes (must be absolutely last)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Export app for serverless functions (Vercel)
module.exports = app;

// Start server only if not in serverless environment
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Wall Street Beater Price Fetcher running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Get price: http://localhost:${PORT}/price/AAPL`);
    console.log(`📊 Get multiple: http://localhost:${PORT}/prices?symbols=AAPL,TSLA,MSFT`);
    console.log(`🎨 Frontend: http://localhost:${PORT}`);
  });
}
