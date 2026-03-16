# 📊 Stock Market Dashboard — Live

> **Version 3.1.0** | Last updated: 2026-03-16

A **100% client-side** stock analysis dashboard that runs on **Cloudflare Pages**, **GitHub Pages**, or any static hosting — no backend required. All calculations happen in your browser using live data from the Financial Modeling Prep (FMP) Stable API.

> **Zero server costs. Zero dependencies. Just deploy and analyze.**

![HTML](https://img.shields.io/badge/HTML-CSS-JS-blue)
![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare_Pages-F38020?logo=cloudflare&logoColor=white)
![FMP API](https://img.shields.io/badge/API-FMP_Stable-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### Live Data & Analysis
- **Real-time data** from Financial Modeling Prep (FMP) **Stable API** — fetched on each refresh
- **20+ technical indicators** calculated in-browser: RSI, ATR, EMA50/200, AVWAP, POC, ADX, Bollinger Bandwidth, Fibonacci, Market Structure, Sweeps, FVG
- **Composite Score (0–100)** with 9 weighted criteria across technicals, fundamentals, and sentiment
- **Confluence Setup Detection** — automated LONG / SHORT / WAIT signals with position sizing (60% or 100%)
- **Relative Strength vs SPY** benchmark comparison

### Interactive Dashboard
- Dark-themed responsive UI (Tailwind CSS)
- Expandable candlestick charts (Lightweight Charts) with EMA, AVWAP, POC, Fibonacci overlays
- Volume + RSI sub-chart with synced time scale
- Hover tooltips with full score breakdowns
- Per-ticker summary cards with actionable trade descriptions
- Chart screenshot export (PNG)

### User-Friendly
- **Editable watchlist** — add/remove tickers directly from the UI
- **API key stored locally** in your browser (localStorage) — never sent to any server except FMP
- **API key validation** — checks key before loading data, with clear error messages
- **Settings panel** for quick configuration changes
- **Loading states** with progress indicators
- **Error recovery** — "Change API Key" and "Retry" buttons on error screens
- **One-click refresh** to reload all data

---

## 🚀 Quick Start

### Option 1: Deploy to Cloudflare Pages (Recommended)

1. **Fork or clone** this repository
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Connect your GitHub repo → select this repository
4. Set **Build output directory** to `/` (root) — no build step needed
5. Deploy!
6. Open your site → enter your FMP API key → done

### Option 2: Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/stock-dashboard-live.git
   cd stock-dashboard-live
   ```

2. Serve the files with any static server:
   ```bash
   # Python
   python -m http.server 8080

   # Node.js
   npx serve .

   # Or just open index.html in your browser
   ```

3. Open `http://localhost:8080` → enter your FMP API key → done

### Option 3: GitHub Pages

1. Fork this repository
2. Go to Settings → Pages → Source: `main` branch, `/ (root)` folder
3. Your dashboard will be live at `https://YOUR_USERNAME.github.io/stock-dashboard-live/`

---

## 🔑 API Key Setup

This dashboard uses the **Financial Modeling Prep (FMP) Stable API**:

1. Sign up at [site.financialmodelingprep.com](https://site.financialmodelingprep.com/)
2. Get your API key (free tier available)
3. Enter the key on first visit — it's saved in your browser's localStorage
4. You can update it anytime via the ⚙ Settings button

> **Privacy**: Your API key is stored only in your browser's localStorage. It is never sent to any server other than the FMP API directly.

> **Important**: This dashboard uses the `/stable/` API endpoints exclusively. Make sure your FMP plan supports stable endpoints.

---

## 📁 Project Structure

```
stock-dashboard-live/
├── index.html              # Main dashboard (single page app)
├── README.md               # This file
├── ARCHITECTURE.md          # Detailed architecture & data flow documentation
├── js/
│   ├── config.js           # v3.1.0 — Parameters, localStorage helpers
│   ├── api.js              # v3.1.0 — FMP Stable API fetching
│   ├── technicals.js       # v3.1.0 — RSI, ATR, EMA, AVWAP, POC, ADX, BB, Fibonacci, RS
│   ├── structure.js        # v3.1.0 — Market structure, sweeps, FVG detection
│   ├── scoring.js          # v3.1.0 — Composite score + confluence setup logic
│   ├── charts.js           # v3.1.0 — Lightweight Charts rendering
│   ├── ui.js               # v3.1.0 — DOM rendering (tables, tooltips, summaries, settings)
│   └── app.js              # v3.1.0 — Main orchestrator
```

**No build step. No bundler. No node_modules.** Just plain HTML + JS.

---

## 📊 What Gets Calculated

### Technical Indicators (all computed in-browser)
| Indicator | Description |
|---|---|
| RSI (14) | Relative Strength Index — oversold/overbought detection |
| ATR & ATR% | Average True Range — volatility measurement |
| EMA 50 / 200 | Exponential Moving Averages — trend direction |
| AVWAP (5d/14d/30d/6m) | Anchored VWAP — institutional support levels |
| POC (5d/14d) | Point of Control — highest volume price level |
| ADX (14) | Average Directional Index — trend strength |
| BB Bandwidth | Bollinger Band width — squeeze detection |
| Fibonacci | 6-month retracement levels with position classification |
| Market Structure | HH/HL (Bullish) vs LH/LL (Bearish) detection |
| Liquidity Sweeps | Buy-side/sell-side trap detection |
| Fair Value Gaps | Imbalance detection with fill percentage |
| RS vs SPY | 30-day relative strength vs benchmark |
| Volume Ratio | Current vs 20-day average volume |

### Fundamental Data (from FMP Stable API)
| Data | Endpoint |
|---|---|
| P/E (Trailing & Forward) | `/stable/profile`, `/stable/key-metrics-ttm` |
| Beta | `/stable/profile` |
| 52-week range | `/stable/profile` |
| Earnings date & countdown | `/stable/earnings-calendar` |
| EPS Growth YoY | `/stable/income-statement` |
| Short Float % | `/stable/shares-float` |
| Analyst Rating | `/stable/grades-consensus` |

### Scoring System (0–100)
- **Technical** (max 50): RSI zone, Structure, EMA200, AVWAP30d, Fibonacci position
- **Fundamental** (max 30): Earnings safety, EPS growth, P/E improvement
- **Sentiment** (max 10): Relative strength vs SPY
- **Penalties**: Earnings risk (−20), Extreme volatility (−15), Full bearish (−15)

### Setup Detection
- **LONG**: 6 criteria → 4+ met = 60% sizing, 5+ = 100%
- **SHORT**: 6 criteria → same sizing logic
- **WAIT**: Auto-blocked when conditions are unfavorable (earnings, volatility, squeeze, etc.)

---

## ⚙️ Configuration

Default tickers: `TSLA, HOOD, SOFI, AMZN, SKM, GOOGL`

All technical parameters can be modified in `js/config.js`:

| Parameter | Default | Description |
|---|---|---|
| `OHLCV_DAYS` | `504` | ~2 years of historical data |
| `RSI_PERIOD` | `14` | RSI lookback |
| `EMA_SHORT/LONG` | `50/200` | EMA periods |
| `AVWAP_WINDOWS` | `5d, 14d, 30d, 6m` | AVWAP anchor windows |
| `FIB_WINDOW` | `126` | ~6 months for Fibonacci |
| `CHART_DAYS` | `90` | Days shown on charts |

Watchlist is editable from the UI ⚙ Settings panel — no code changes needed.

---

## 📋 API Usage

All API calls use the FMP **Stable API** (`https://financialmodelingprep.com/stable/`).

With **6 tickers**, each refresh uses approximately:

| Endpoint | Requests | Purpose |
|---|---|---|
| `/stable/profile` | 1 (validation) + 6 | Company profiles |
| `/stable/historical-price-eod` | 7 (6 + SPY) | OHLCV price data |
| `/stable/key-metrics-ttm` | 6 | Forward P/E |
| `/stable/earnings-calendar` | 6 | Earnings dates |
| `/stable/income-statement` | 6 | EPS growth |
| `/stable/shares-float` | 6 | Short float % |
| `/stable/grades-consensus` | 6 | Analyst ratings |

**Total: ~44 requests per refresh**

All requests include a 15-second timeout. Failed non-critical requests (earnings, analyst ratings, etc.) are handled gracefully — the dashboard still loads with available data.

---

## 🌐 Deployment Notes

### Cloudflare Pages
- No build command needed
- Build output directory: `/` (root)
- Works with automatic Git deploys

### GitHub Pages
- Enable Pages in repo Settings
- Source: `main` branch, root folder
- No Jekyll needed (add empty `.nojekyll` file if issues)

### Any Static Host
- Just upload all files — no server-side processing required
- All external dependencies loaded from CDN (Tailwind, Lightweight Charts)

---

## 📝 Changelog

### v3.1.0 (2026-03-16)
- **BREAKING**: Migrated all API calls from `/api/v3/` (legacy) to `/stable/` endpoints
- **BREAKING**: OHLCV endpoint changed from `historical-price-full` to `historical-price-eod` with `from`/`to` date parameters
- **Added**: API key validation before loading dashboard data
- **Added**: Detailed error messages showing actual API errors per ticker
- **Added**: "Change API Key" and "Retry" buttons on error screens
- **Added**: Request timeout (15s) with AbortController
- **Added**: Detection of error messages in HTTP 200 responses (FMP sometimes returns errors at status 200)
- **Added**: Rate limit (HTTP 429) detection and user-friendly message
- **Fixed**: Earnings calendar endpoint — tries multiple endpoint names with fallback
- **Fixed**: CSS state reset on loading/error transitions
- **Fixed**: Setup overlay visibility conflicts
- **Added**: ARCHITECTURE.md documentation
- **Added**: Version headers in all JS files

### v3.0.0 (Initial)
- Initial release with v3 API endpoints
- Full technical analysis dashboard with 20+ indicators
- Composite scoring system
- Interactive charts with Lightweight Charts

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## ⚠️ Disclaimer

**This tool is for educational and research purposes only.** It does not constitute financial advice, investment recommendations, or solicitation to buy or sell any securities. Trading involves substantial risk. Always do your own research and consult a qualified financial advisor before making investment decisions. The authors are not responsible for any financial losses incurred from using this tool.