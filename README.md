# 📊 Stock Market Dashboard — Live

**Version 3.2.5** · A real-time stock market analysis dashboard that combines 15+ technical and fundamental indicators into an actionable scoring system with trade setup recommendations.

> Pure client-side HTML/JavaScript — no backend required. Just open `index.html` in your browser.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Using the Dashboard](#using-the-dashboard)
  - [Primary Table](#primary-table)
  - [Technical & Fundamental Details Table](#technical--fundamental-details-table)
  - [Analysis per Ticker](#analysis-per-ticker)
  - [Interactive Charts](#interactive-charts)
- [Understanding the Scoring System](#understanding-the-scoring-system)
- [Trade Setup Guide](#trade-setup-guide)
- [Color Coding](#color-coding)
- [Key Indicators Reference](#key-indicators-reference)
- [Architecture](#architecture)
- [API Rate Limits](#api-rate-limits)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Stock Market Dashboard is a browser-based trading analysis tool that fetches live market data from two API providers, calculates a comprehensive set of technical indicators client-side, and presents the results in an interactive dashboard with composite scoring and trade setup recommendations.

**Data Sources:**
| Provider | Purpose | Free Tier |
|----------|---------|-----------|
| [Finnhub](https://finnhub.io/) | Live quotes, fundamentals, analyst ratings, earnings | 60 requests/min |
| [Twelve Data](https://twelvedata.com/) | Historical OHLCV candlestick data | 8 requests/min, 800 credits/day |

**No server or build step required** — all processing happens in the browser using vanilla JavaScript.

---

## Features

### Technical Analysis
- **RSI** (14-day) — momentum oscillator for overbought/oversold detection
- **EMA 50 / EMA 200** — short and long-term trend identification, Golden/Death Cross
- **MACD** (12, 26, 9) — momentum crossover signals
- **ADX** (14-day) — trend strength measurement
- **Bollinger Bands Bandwidth** — volatility squeeze detection
- **ATR%** — average true range as percentage of price for volatility sizing

### Smart Money Concepts
- **Liquidity Sweeps** — detection of stop hunts (buy/sell sweeps)
- **Fair Value Gaps (FVG)** — price imbalance zones with fill percentage tracking
- **Market Structure** — higher highs/higher lows vs lower highs/lower lows analysis
- **Volume Profile (POC)** — Point of Control identification across multiple timeframes

### Volume & Price Analysis
- **AVWAP** (Anchored VWAP) — volume-weighted average price across 5d, 14d, 30d, 6m windows
- **OBV Trend** — On-Balance Volume for accumulation/distribution detection
- **Volume Ratio** — current volume vs 20-day average for unusual activity detection
- **Fibonacci Retracement** — position within 126-day swing range

### Fundamental Data
- **P/E Ratio** (trailing and forward)
- **EPS Growth** (year-over-year)
- **Short Ratio** (days to cover)
- **Beta** (market sensitivity)
- **Earnings Calendar** (days until next report)
- **Analyst Ratings & Price Targets**
- **52-Week Range Position**
- **Relative Strength vs SPY**

### Dashboard Features
- **Composite Score** (0–100) combining all indicators
- **Trade Setup Recommendations** (LONG / SHORT / WAIT) with position sizing
- **Interactive Charts** with EMA overlays, RSI sub-chart, and OHLCV legend
- **24-hour Local Cache** — instant loading on return visits
- **Customizable Watchlist** — up to 12 tickers
- **Quick Links** to VIX and CNN Fear & Greed Index

---

## Getting Started

### Prerequisites

You need free API keys from two providers:

1. **Finnhub API Key** — Sign up at [finnhub.io](https://finnhub.io/)
   - Free tier: 60 requests/minute
   - Used for: live quotes, company profiles, analyst ratings, earnings dates

2. **Twelve Data API Key** — Sign up at [twelvedata.com](https://twelvedata.com/)
   - Free tier: 8 requests/minute, 800 credits/day
   - Used for: historical OHLCV candlestick data (up to 2 years)

### Launch

1. Open `index.html` in any modern web browser
2. Enter your **Finnhub API Key** in the setup screen
3. Enter your **Twelve Data API Key**
4. Customize your **watchlist** (comma-separated ticker symbols, max 12)
   - Default: `TSLA, HOOD, SOFI, AMZN, SKM, GOOGL`
5. Click **Launch Dashboard**

The dashboard will validate your API keys, fetch data for all tickers, calculate indicators, and render the results. The first load takes 15–60 seconds depending on the number of tickers.

### Subsequent Visits

Data is cached locally for 24 hours. On return visits, the dashboard loads instantly from cache. Use the **↻ Refresh** button to fetch fresh data.

---

## Using the Dashboard

### Primary Table

The top-level table provides a quick overview for each ticker:

| Column | Description |
|--------|-------------|
| **Symbol** | Ticker symbol (click row to toggle chart) |
| **Price** | Current market price from Finnhub live quote |
| **1D%** | Daily price change vs previous close |
| **Score** | Composite score 0–100 (hover for full breakdown) |
| **Setup** | Trade recommendation: LONG / SHORT / WAIT (hover for criteria) |
| **RSI** | 14-day Relative Strength Index |
| **Trend** | EMA-based trend: Bullish / Bearish / Neutral |
| **Structure** | Market structure: Bullish (HH+HL) / Bearish (LH+LL) |
| **Earn** | Days until next earnings report |
| **Rating** | Analyst consensus: Buy / Hold / Sell |

### Technical & Fundamental Details Table

The second table expands with 20+ additional metrics:

| Column | Description |
|--------|-------------|
| **ATR%** | Daily volatility as % of price (use for stop-loss sizing) |
| **EMA50 / EMA200** | Moving average values |
| **AVWAP30d** | 30-day anchored volume-weighted average price |
| **POC14d** | 14-day Point of Control (highest volume price level) |
| **ADX** | Trend strength (not direction): >30 strong, <20 ranging |
| **BB-BW** | Bollinger Band width — low = squeeze pending |
| **Sweep** | Liquidity sweep: BUY_SWP (bullish) / SELL_SWP (bearish) |
| **FVG** | Fair Value Gap type + fill percentage |
| **Fib-Pos** | Fibonacci retracement position (38.2–61.8% = golden zone) |
| **Vol/Avg** | Volume ratio vs 20-day average (>2x = unusual, >3x = institutional) |
| **52W%** | Position in 52-week range (100% = yearly high) |
| **RS-SPY** | 30-day relative strength vs S&P 500 |
| **P/E / Fwd P/E** | Trailing and forward price/earnings ratios |
| **EPS-G** | Earnings per share growth (YoY) |
| **Short Ratio** | Days to cover short positions |
| **Beta** | Market sensitivity (>1 = amplified, <1 = muted) |
| **MACD** | Crossover direction + MACD line value |
| **OBV** | On-Balance Volume trend: UP / DOWN / FLAT |
| **R1 / S1** | Daily pivot point resistance and support levels |
| **Target↑%** | Analyst consensus price target upside percentage |
| **Analyst Action** | Latest analyst upgrade/downgrade |

### Analysis per Ticker

A collapsible section at the bottom provides per-ticker analysis cards with:
- Current score and setup recommendation
- Key metric values
- Full criteria breakdown (met vs missed conditions)
- Position sizing guidance

### Interactive Charts

Click any ticker row to expand a 90-day chart panel featuring:
- **Candlestick chart** (OHLCV) with EMA50 and EMA200 overlays
- **AVWAP 30d** and **POC 14d** horizontal reference levels
- **RSI sub-chart** with overbought (70) and oversold (30) lines
- **Volume bars** with color coding
- **OHLCV legend** showing values on hover/crosshair

---

## Understanding the Scoring System

The **Composite Score** (0–100) aggregates 15+ criteria from technical and fundamental analysis. Each criterion contributes points when met:

| Score Range | Label | Meaning |
|-------------|-------|---------|
| **70–100** | 🟢 Strong | Multiple criteria aligned — high-conviction setup |
| **40–69** | 🟡 Marginal | Mixed signals — proceed with caution |
| **0–39** | 🔴 Avoid | Insufficient criteria — stay on the sideline |

**Hover over the score badge** in the dashboard to see the full breakdown of which criteria are met (✓) and which are not (✗).

---

## Trade Setup Guide

The system evaluates **LONG** and **SHORT** criteria independently:

### Position Sizing
| Criteria Met | Sizing | Recommendation |
|-------------|--------|----------------|
| **5+ criteria** | 100% position | Full conviction entry |
| **4 criteria** | 60% position | Partial/scaled entry |
| **< 4 criteria** | — | WAIT (no trade) |

### Key Entry Rules
- **RSI < 30** = Oversold entry zone (LONG)
- **RSI > 70** = Overbought zone (SHORT or exit)
- **Earnings < 7 days away** = Danger zone — avoid new entries
- **Earnings > 21 days away** = Safe window to enter
- **BB-BW squeeze + ADX rising** = Explosive move incoming
- **OBV UP + Price UP** = Confirmed momentum
- **Vol/Avg > 3x** = Institutional breakout activity
- **FVG** = Unfilled imbalance acts as price magnet

---

## Color Coding

The dashboard uses a consistent color scheme across all elements:

| Color | Meaning |
|-------|---------|
| 🟢 **Green** | Bullish · Oversold (entry) · Buy · Outperforming |
| 🔴 **Red** | Bearish · Overbought · Sell · Underperforming |
| 🟡 **Yellow** | Neutral · Caution · Hold |
| 🟠 **Orange** | Warning / elevated risk |
| 🔵 **Blue** | Informational / interactive elements |

---

## Key Indicators Reference

| Indicator | Bullish Signal | Bearish Signal |
|-----------|---------------|----------------|
| RSI | < 30 (oversold) | > 70 (overbought) |
| Trend | Price > EMA50 > EMA200 | Price < EMA50 < EMA200 |
| Structure | Higher Highs + Higher Lows | Lower Highs + Lower Lows |
| ADX | > 30 (strong trend) | < 20 (ranging/choppy) |
| MACD | ↑ Bullish crossover | ↓ Bearish crossover |
| OBV | UP (accumulation) | DOWN (distribution) |
| Sweep | BUY_SWP (lows swept & reclaimed) | SELL_SWP (highs swept & rejected) |
| FVG | BULL gap (acts as support) | BEAR gap (acts as resistance) |
| RS-SPY | > 1.05 (outperforming S&P 500) | < 0.95 (underperforming) |
| Vol/Avg | > 2x (unusual interest) | — |
| Short Ratio | > 10d (squeeze potential) | — |
| Earnings | > 21d away (safe) | < 7d away (danger zone) |

---

## Architecture

The application is organized into modular JavaScript files:

```
index.html          → Main dashboard UI (HTML + Tailwind CSS)
js/
├── config.js       → Configuration constants, API URLs, localStorage helpers
├── api.js          → API communication (Finnhub + Twelve Data), data fetching
├── technicals.js   → Technical indicator calculations (RSI, EMA, MACD, ATR, etc.)
├── structure.js    → Market structure analysis (swing points, sweeps, FVGs)
├── scoring.js      → Composite scoring engine + trade setup logic
├── charts.js       → Chart rendering (Lightweight Charts library)
├── ui.js           → UI rendering, overlays, settings management
└── app.js          → Main orchestrator (data flow, initialization)
```

### Data Flow

```
1. App.loadDashboard()
   ├── Check for cached data (24h TTL) → render immediately if valid
   └── App.refreshData()
       ├── API.validateApiKey()          → validate both API keys
       ├── API.fetchAllOHLCV()           → Twelve Data batch OHLCV
       ├── API.fetchTickerData()         → Finnhub per-ticker data
       ├── App.processTicker()           → calculate all indicators
       │   ├── Technicals.*              → RSI, EMA, MACD, ATR, ADX, etc.
       │   ├── Structure.*               → market structure, sweeps, FVGs
       │   └── Scoring.*                 → composite score + setup
       ├── setCache()                    → save to localStorage
       └── UI.renderDashboard()          → render tables, charts, analysis
```

### Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| [Tailwind CSS](https://tailwindcss.com/) | CDN (latest) | Utility-first CSS framework |
| [Lightweight Charts](https://github.com/nicehash/lightweight-charts) | 4.1.3 | Financial charting library |

Both are loaded from CDN — no `npm install` or build step required.

---

## API Rate Limits

The dashboard is designed to work within free-tier API limits:

| Provider | Rate Limit | How the App Handles It |
|----------|-----------|------------------------|
| **Finnhub** | 60 req/min | Batches tickers in groups of 6 with 1.5s pauses between batches |
| **Twelve Data** | 8 req/min, 800 credits/day | Batched OHLCV requests with chunking for >8 symbols |

**Tips to stay within limits:**
- Keep your watchlist to 6–8 tickers for fastest loading
- Maximum 12 tickers supported
- Use the **↻ Refresh** button sparingly (data is cached for 24 hours)
- The SPY benchmark is automatically included in OHLCV fetches for relative strength calculation

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **"API key validation failed"** | Verify your API keys in **⚙ Settings**. Ensure they are active on the provider websites. |
| **Dashboard shows stale data** | Click **↻ Refresh** to force a fresh data pull. |
| **"Twelve Data unavailable"** | You may have hit the daily credit limit (800/day). Wait until the next UTC day or upgrade your plan. |
| **Some tickers show errors** | The ticker may not be supported by one of the APIs, or you hit a rate limit. Check the browser console for details. |
| **Charts not rendering** | Ensure you have internet access (Lightweight Charts loads from CDN). Try a hard refresh (Ctrl+Shift+R). |
| **Data loads slowly** | Reduce watchlist size. First load fetches ~2 years of OHLCV data per ticker. Subsequent loads use cache. |
| **Settings not saving** | Check if localStorage is enabled in your browser. Private/incognito mode may block storage. |

### Clearing All Data

To fully reset the application, open your browser's developer console and run:

```javascript
localStorage.clear();
location.reload();
```

This removes API keys, watchlist, and cached data. You'll see the initial setup screen again.

---

## License

This project is provided as-is for educational and personal trading analysis purposes. Always do your own research before making investment decisions.