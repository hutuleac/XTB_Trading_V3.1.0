// ============================================================
// APP — Main orchestrator
// @version 3.1.0
// @updated 2026-03-16
// ============================================================

const App = {
    async loadDashboard() {
        const apiKey = getApiKey();
        if (!apiKey) {
            UI.showSetupScreen();
            return;
        }

        const tickers = getTickers();
        UI.showLoading(`Validating API key...`);

        try {
            // 0. Validate API key first
            const validation = await API.validateApiKey();
            if (!validation.valid) {
                console.error("API key validation failed:", validation.error);
                UI.showError(
                    `API key validation failed: ${validation.error}`,
                    true // show change key button
                );
                return;
            }

            UI.showLoading(`Fetching data for ${tickers.length} tickers...`);

            // 1. Fetch SPY benchmark
            UI.updateLoadingProgress("Fetching SPY benchmark...");
            let spyCloses = [];
            try {
                const spyOHLCV = await API.fetchBenchmark();
                spyCloses = spyOHLCV.map(d => d.close);
            } catch (e) {
                console.warn("Could not fetch SPY benchmark:", e.message);
            }

            // 2. Fetch all tickers in parallel
            const marketData = {};
            const chartData = {};
            let completed = 0;
            const tickerErrors = [];

            const results = await Promise.allSettled(
                tickers.map(async (ticker) => {
                    UI.updateLoadingProgress(`Fetching ${ticker}... (${completed}/${tickers.length})`);
                    const raw = await API.fetchTickerData(ticker);
                    completed++;
                    UI.updateLoadingProgress(`Processing ${ticker}... (${completed}/${tickers.length})`);
                    return { ticker, raw };
                })
            );

            // 3. Process each ticker
            UI.updateLoadingProgress("Calculating indicators...");

            for (const result of results) {
                if (result.status !== "fulfilled") {
                    // Extract ticker name from error if possible
                    const errMsg = result.reason ? result.reason.message : "Unknown error";
                    console.error(`Ticker fetch failed:`, errMsg);
                    tickerErrors.push(errMsg);
                    continue;
                }
                const { ticker, raw } = result.value;

                try {
                    const processed = this.processTicker(ticker, raw, spyCloses);
                    marketData[ticker] = processed.data;
                    chartData[ticker] = processed.chart;
                } catch (e) {
                    console.error(`Error processing ${ticker}:`, e);
                    tickerErrors.push(`${ticker}: ${e.message}`);
                }
            }

            if (Object.keys(marketData).length === 0) {
                // Build detailed error message
                let errorMsg = "No data could be loaded for any ticker.";
                if (tickerErrors.length > 0) {
                    const uniqueErrors = [...new Set(tickerErrors)];
                    errorMsg += "\n\nErrors:\n• " + uniqueErrors.slice(0, 5).join("\n• ");
                    if (uniqueErrors.length > 5) {
                        errorMsg += `\n• ... and ${uniqueErrors.length - 5} more`;
                    }
                }
                console.error("All tickers failed. Errors:", tickerErrors);
                UI.showError(errorMsg, true);
                return;
            }

            // Log partial failures
            if (tickerErrors.length > 0) {
                console.warn(`${tickerErrors.length} ticker(s) failed:`, tickerErrors);
            }

            // 4. Render
            const timestamp = new Date().toLocaleString();
            UI.renderDashboard(marketData, chartData, timestamp);

        } catch (e) {
            console.error("Dashboard load error:", e);
            UI.showError(e.message || "Unknown error occurred", true);
        }
    },

    /**
     * Process a single ticker: calculate all indicators from raw API data.
     */
    processTicker(ticker, raw, spyCloses) {
        const ohlcv = raw.ohlcv;
        const profile = raw.profile;

        // Extract arrays
        const dates = ohlcv.map(d => d.date);
        const opens = ohlcv.map(d => d.open);
        const highs = ohlcv.map(d => d.high);
        const lows = ohlcv.map(d => d.low);
        const closes = ohlcv.map(d => d.close);
        const volumes = ohlcv.map(d => d.volume);

        const price = closes[closes.length - 1];
        const prevClose = profile.prev_close || (closes.length > 1 ? closes[closes.length - 2] : price);
        const delta1d = prevClose ? Math.round(((price - prevClose) / prevClose) * 10000) / 100 : 0;

        // Technical indicators
        const rsi = Technicals.calcRSI(closes);
        const atrData = Technicals.calcATR(highs, lows, closes);
        const ema50Series = Technicals.calcEMASeries(closes, CONFIG.EMA_SHORT);
        const ema200Series = Technicals.calcEMASeries(closes, CONFIG.EMA_LONG);
        const ema50 = ema50Series[ema50Series.length - 1] != null ? Math.round(ema50Series[ema50Series.length - 1] * 100) / 100 : null;
        const ema200 = ema200Series[ema200Series.length - 1] != null ? Math.round(ema200Series[ema200Series.length - 1] * 100) / 100 : null;
        const trend = Technicals.calcTrend(closes, ema50Series, ema200Series);

        // AVWAPs
        const avwaps = {};
        for (const [name, days] of Object.entries(CONFIG.AVWAP_WINDOWS)) {
            avwaps[`avwap_${name}`] = Technicals.calcAVWAP(closes, volumes, days);
        }

        // POCs
        const pocs = {};
        for (const [name, days] of Object.entries(CONFIG.POC_WINDOWS)) {
            pocs[`poc_${name}`] = Technicals.calcPOC(closes, volumes, days);
        }

        const adx = Technicals.calcADX(highs, lows, closes);
        const bbBW = Technicals.calcBBBandwidth(closes);
        const fib = Technicals.calcFibonacci(highs, lows, closes);
        const structure = Structure.calcStructure(highs, lows);
        const sweep = Structure.calcSweep(highs, lows, closes);
        const fvg = Structure.calcFVG(highs, lows, closes);
        const rsSpy = Technicals.calcRSvsSPY(closes, spyCloses);
        const volRatio = Technicals.calcVolumeRatio(volumes);

        // From profile
        const high52w = profile.high_52w;
        const low52w = profile.low_52w;
        const pos52w = Technicals.calc52WPosition(price, high52w, low52w);
        const pctBelow = Technicals.calcPctBelowATH(price, high52w);

        // Assemble data
        const data = {
            price: Math.round(price * 100) / 100,
            delta_1d_pct: delta1d,
            rsi_daily: rsi,
            atr: atrData.atr,
            atr_pct: atrData.atr_pct,
            ema50,
            ema200,
            trend,
            ...avwaps,
            ...pocs,
            adx,
            bb_bandwidth: bbBW,
            structure,
            sweep,
            fvg_type: fvg ? fvg.type : null,
            fvg_fill_pct: fvg ? fvg.fill_pct : null,
            fvg_distance_pct: fvg ? fvg.distance_pct : null,
            fvg_level: fvg ? fvg.level : null,
            fib_position: fib.price_position,
            fib_swing_high: fib.swing_high,
            fib_swing_low: fib.swing_low,
            fib_levels: fib.levels,
            vol_avg_ratio: volRatio,
            high_52w: high52w,
            low_52w: low52w,
            position_52w_pct: pos52w,
            pct_below_ath: pctBelow,
            rs_spy_30d: rsSpy,
            pe_trailing: profile.pe_trailing,
            pe_forward: profile.pe_forward,
            dividend_yield: profile.dividend_yield,
            market_cap: profile.market_cap,
            beta: profile.beta,
            earnings_date: raw.earnings.earnings_date,
            days_to_earnings: raw.earnings.days_to_earnings,
            eps_growth_yoy: raw.eps_growth_yoy,
            short_float_pct: raw.short_float_pct,
            analyst_rating: raw.analyst_rating,
        };

        // Scoring
        data.composite_score = Scoring.calcCompositeScore(data);
        data.score_breakdown = Scoring.calcScoreBreakdown(data);
        const setup = Scoring.getConfluenceSetup(data);
        data.setup_type = setup.setup_type;
        data.setup_criteria_met = setup.criteria_met;
        data.setup_total_criteria = setup.total_criteria;
        data.setup_sizing_pct = setup.sizing_pct;
        data.setup_reasons = setup.reasons;

        // Chart data (last CHART_DAYS)
        const chartDays = CONFIG.CHART_DAYS;
        const startIdx = Math.max(0, dates.length - chartDays);
        const rsiSeries = Technicals.calcRSISeries(closes);

        const chart = {
            dates: dates.slice(startIdx),
            open: opens.slice(startIdx).map(v => Math.round(v * 100) / 100),
            high: highs.slice(startIdx).map(v => Math.round(v * 100) / 100),
            low: lows.slice(startIdx).map(v => Math.round(v * 100) / 100),
            close: closes.slice(startIdx).map(v => Math.round(v * 100) / 100),
            volume: volumes.slice(startIdx),
            ema50: ema50Series.slice(startIdx).map(v => v != null ? Math.round(v * 100) / 100 : null),
            ema200: ema200Series.slice(startIdx).map(v => v != null ? Math.round(v * 100) / 100 : null),
            rsi: rsiSeries.slice(startIdx),
            avwap_30d: avwaps.avwap_30d,
            poc_14d: pocs.poc_14d,
        };

        return { data, chart };
    },
};

// --- Init on DOM ready ---
document.addEventListener("DOMContentLoaded", () => {
    // Check if API key exists
    if (getApiKey()) {
        App.loadDashboard();
    } else {
        UI.showSetupScreen();
    }
});