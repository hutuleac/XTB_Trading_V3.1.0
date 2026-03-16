// ============================================================
// CONFIG — All configurable parameters
// @version 3.1.0
// @updated 2026-03-16
// ============================================================

const CONFIG = {
    // --- Default Watchlist ---
    DEFAULT_TICKERS: ["TSLA", "HOOD", "SOFI", "AMZN", "SKM", "GOOGL"],
    BENCHMARK: "SPY",

    // --- FMP API (stable endpoints only) ---
    FMP_STABLE_URL: "https://financialmodelingprep.com/stable",

    // --- Data Fetch ---
    OHLCV_DAYS: 504,          // ~2 years of trading days

    // --- Technical Parameters ---
    RSI_PERIOD: 14,
    ATR_PERIOD: 14,
    EMA_SHORT: 50,
    EMA_LONG: 200,
    BB_PERIOD: 20,
    BB_STD: 2,
    ADX_PERIOD: 14,

    // --- AVWAP Windows (trading days) ---
    AVWAP_WINDOWS: { "5d": 5, "14d": 14, "30d": 30, "6m": 126 },

    // --- POC (Point of Control) ---
    POC_WINDOWS: { "5d": 5, "14d": 14 },
    POC_BINS: 20,

    // --- Structure & Sweep ---
    STRUCTURE_WINDOW: 14,

    // --- Fibonacci ---
    FIB_WINDOW: 126,
    FIB_LEVELS: [0.236, 0.382, 0.500, 0.618, 0.786],

    // --- Relative Strength ---
    RS_WINDOW: 30,

    // --- Chart ---
    CHART_DAYS: 90,

    // --- LocalStorage Keys ---
    LS_API_KEY: "fmp_api_key",
    LS_TICKERS: "watchlist_tickers",
};

// --- Helpers for localStorage ---
function getApiKey() {
    return localStorage.getItem(CONFIG.LS_API_KEY) || "";
}

function setApiKey(key) {
    localStorage.setItem(CONFIG.LS_API_KEY, key.trim());
}

function getTickers() {
    const stored = localStorage.getItem(CONFIG.LS_TICKERS);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) { /* ignore */ }
    }
    return CONFIG.DEFAULT_TICKERS;
}

function setTickers(arr) {
    localStorage.setItem(CONFIG.LS_TICKERS, JSON.stringify(arr.map(t => t.toUpperCase().trim()).filter(Boolean)));
}