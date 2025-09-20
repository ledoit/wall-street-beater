use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tower_http::cors::CorsLayer;
use tracing::{info, warn};

#[derive(Debug, Serialize, Deserialize)]
struct PriceResponse {
    symbol: String,
    price: f64,
    currency: String,
    timestamp: i64,
    source: String,
    change_24h: Option<f64>,
    change_percent_24h: Option<f64>,
}

#[derive(Debug, Deserialize)]
struct PriceQuery {
    symbol: String,
    source: Option<String>,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/price/:symbol", get(get_price))
        .route("/prices", get(get_multiple_prices))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    info!("🚀 WSB Price Fetcher running on http://0.0.0.0:3000");
    
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "WSB Price Fetcher",
        "timestamp": chrono::Utc::now().timestamp()
    }))
}

async fn get_price(Path(symbol): Path<String>, Query(params): Query<HashMap<String, String>>) -> Result<Json<PriceResponse>, (StatusCode, Json<ErrorResponse>)> {
    let symbol = symbol.to_uppercase();
    let source = params.get("source").cloned().unwrap_or_else(|| "yahoo".to_string());
    
    info!("Fetching price for {} from {}", symbol, source);
    
    match fetch_price(&symbol, &source).await {
        Ok(price_data) => {
            info!("Successfully fetched price for {}: ${:.2}", symbol, price_data.price);
            Ok(Json(price_data))
        }
        Err(e) => {
            warn!("Failed to fetch price for {}: {}", symbol, e);
            Err((
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "PRICE_FETCH_FAILED".to_string(),
                    message: format!("Failed to fetch price for {}: {}", symbol, e),
                }),
            ))
        }
    }
}

async fn get_multiple_prices(Query(params): Query<HashMap<String, String>>) -> Result<Json<Vec<PriceResponse>>, (StatusCode, Json<ErrorResponse>)> {
    let symbols = params.get("symbols")
        .ok_or_else(|| (StatusCode::BAD_REQUEST, Json(ErrorResponse {
            error: "MISSING_SYMBOLS".to_string(),
            message: "Missing 'symbols' parameter. Use comma-separated values like: ?symbols=AAPL,TSLA,MSFT".to_string(),
        })))?;
    
    let symbol_list: Vec<String> = symbols.split(',').map(|s| s.trim().to_uppercase()).collect();
    let source = params.get("source").cloned().unwrap_or_else(|| "yahoo".to_string());
    
    info!("Fetching prices for {} symbols from {}", symbol_list.len(), source);
    
    let mut prices = Vec::new();
    let mut errors = Vec::new();
    
    for symbol in symbol_list {
        match fetch_price(&symbol, &source).await {
            Ok(price_data) => prices.push(price_data),
            Err(e) => {
                warn!("Failed to fetch price for {}: {}", symbol, e);
                errors.push(format!("{}: {}", symbol, e));
            }
        }
    }
    
    if prices.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "ALL_PRICES_FAILED".to_string(),
                message: format!("Failed to fetch any prices. Errors: {}", errors.join(", ")),
            }),
        ));
    }
    
    Ok(Json(prices))
}

async fn fetch_price(symbol: &str, source: &str) -> anyhow::Result<PriceResponse> {
    match source.to_lowercase().as_str() {
        "yahoo" => fetch_yahoo_price(symbol).await,
        "alpha_vantage" => fetch_alpha_vantage_price(symbol).await,
        "mock" => fetch_mock_price(symbol).await,
        _ => {
            warn!("Unknown source: {}, falling back to mock", source);
            fetch_mock_price(symbol).await
        }
    }
}

async fn fetch_yahoo_price(symbol: &str) -> anyhow::Result<PriceResponse> {
    // Using a free Yahoo Finance API alternative
    let url = format!("https://query1.finance.yahoo.com/v8/finance/chart/{}", symbol);
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", "WSB-Price-Fetcher/1.0")
        .send()
        .await?;
    
    if !response.status().is_success() {
        return Err(anyhow::anyhow!("HTTP error: {}", response.status()));
    }
    
    let data: serde_json::Value = response.json().await?;
    
    let result = data["chart"]["result"][0].as_object()
        .ok_or_else(|| anyhow::anyhow!("Invalid response format"))?;
    
    let meta = result["meta"].as_object()
        .ok_or_else(|| anyhow::anyhow!("Missing meta data"))?;
    
    let price = meta["regularMarketPrice"].as_f64()
        .ok_or_else(|| anyhow::anyhow!("Missing price data"))?;
    
    let currency = meta["currency"].as_str().unwrap_or("USD");
    let change_24h = meta["regularMarketChange"].as_f64();
    let change_percent_24h = meta["regularMarketChangePercent"].as_f64();
    
    Ok(PriceResponse {
        symbol: symbol.to_string(),
        price,
        currency: currency.to_string(),
        timestamp: chrono::Utc::now().timestamp(),
        source: "yahoo".to_string(),
        change_24h,
        change_percent_24h,
    })
}

async fn fetch_alpha_vantage_price(symbol: &str) -> anyhow::Result<PriceResponse> {
    // This would require an API key, so we'll use mock for now
    warn!("Alpha Vantage requires API key, using mock data");
    fetch_mock_price(symbol).await
}

async fn fetch_mock_price(symbol: &str) -> anyhow::Result<PriceResponse> {
    // Generate a realistic mock price based on symbol
    let base_price = match symbol {
        "AAPL" => 150.0,
        "TSLA" => 200.0,
        "MSFT" => 300.0,
        "GOOGL" => 2500.0,
        "AMZN" => 3000.0,
        "NVDA" => 400.0,
        "META" => 250.0,
        "NFLX" => 400.0,
        _ => 100.0 + (symbol.len() as f64 * 10.0),
    };
    
    // Add some random variation
    let variation = (chrono::Utc::now().timestamp() % 100) as f64 / 100.0 - 0.5;
    let price = base_price * (1.0 + variation * 0.1);
    
    Ok(PriceResponse {
        symbol: symbol.to_string(),
        price: (price * 100.0).round() / 100.0, // Round to 2 decimal places
        currency: "USD".to_string(),
        timestamp: chrono::Utc::now().timestamp(),
        source: "mock".to_string(),
        change_24h: Some(variation * 5.0),
        change_percent_24h: Some(variation * 2.0),
    })
}
