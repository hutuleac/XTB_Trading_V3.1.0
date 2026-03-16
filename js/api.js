// ============================================================
// API — FMP Data Fetching (browser-side, using /stable/ endpoints)
// @version 3.1.0
// @updated 2026-03-16
// ============================================================

const API = {
    /**
     * Create a fetch request with timeout
     */
    async fetchWithTimeout(url, timeoutMs = 15000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const resp = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            return resp;
        } catch (e) {
            clearTimeout(timeoutId);
            if (e.name === "AbortError") {
                throw new Error(`Request timed out after ${timeoutMs / 1000}s: ${url.split("?")[0]}`);
            }
            throw e;
        }
    },

    /**
     * Check if a JSON response from FMP contains an error message (even at HTTP 200)
     */
    checkFmpError(data, endpoint) {
        if (data && typeof data === "object" && !Array.isArray(data)) {
            if (data["Error Message"]) {
                throw new Error(`FMP error (${endpoint}): ${data["Error Message"]}`);
            }
            if (data["message"]) {
                throw new Error(`FMP error (${endpoint}): ${data["message"]}`);
            }
            if (data["error"]) {
                throw new Error(`FMP error (${endpoint}): ${data["error"]}`);
            }
        }
        return data;
    },

    /**
     * Generic FMP stable endpoint GET request.
     * All calls go through /stable/ — the v3 legacy API is no longer used.
     */
    async fmpStableGet(endpoint, params = {}) {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("No FMP API key configured");
        params.apikey = apiKey;
        const qs = new URLSearchParams(params).toString();
        const url = `${CONFIG.FMP_STABLE_URL}/${endpoint}?${qs}`;
        const resp = await this.fetchWithTimeout(url);
        if (!resp.ok) {
            if (resp.status === 401 || resp.status === 403) throw new Error("Invalid FMP API key (HTTP " + resp.status + ")");
            if (resp.status === 429) throw new Error("FMP API rate limit exceeded (HTTP 429). Wait and try again.");
            throw new Error(`FMP API error: HTTP ${resp.status} for ${endpoint}`);
        }
        const data = await resp.json();
        return this.checkFmpError(data, endpoint);
    },

    /**
     * Validate API key with a simple test request using stable endpoint
     */
    async validateApiKey() {
        try {
            const data = await this.fmpStableGet("profile", { symbol: "AAPL" });
            if (!data || (Array.isArray(data) && data.length === 0)) {
                return { valid: false, error: "API key returned empty response. It may be invalid or expired." };
            }
            return { valid: true };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    },

    /**
     * Fetch historical daily OHLCV for a ticker.
     * Stable endpoint: /stable/historical-price-eod?symbol=AAPL&from=...&to=...
     * Returns array of {date, open, high, low, close, volume} sorted ascending.
     */
    async fetchOHLCV(ticker) {
        // Calculate from/to dates (OHLCV_DAYS trading days ≈ multiply by 1.5 for calendar days)
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - Math.ceil(CONFIG.OHLCV_DAYS * 1.5));

        const toStr = to.toISOString().slice(0, 10);
        const fromStr = from.toISOString().slice(0, 10);

        const data = await this.fmpStableGet("historical-price-eod", {
            symbol: ticker,
            from: fromStr,
            to: toStr,
        });

        // Stable endpoint returns a flat array of OHLCV objects
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error(`No OHLCV data for ${ticker}`);
        }

        // Sort ascending by date
        return data
            .map(d => ({
                date: d.date,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
                volume: d.volume,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    },

    /**
     * Fetch company profile (P/E, beta, market cap, 52w range, etc.)
     * Stable endpoint: /stable/profile?symbol=AAPL
     */
    async fetchProfile(ticker) {
        const data = await this.fmpStableGet("profile", { symbol: ticker });
        // Stable may return array or single object
        const p = Array.isArray(data) ? data[0] : data;
        if (!p) return {};
        return {
            pe_trailing: p.pe || null,
            pe_forward: null, // will try from key-metrics
            dividend_yield: p.lastDiv ? (p.lastDiv / (p.price || 1)) * 100 : 0,
            market_cap: p.mktCap || null,
            beta: p.beta || null,
            high_52w: p.range ? parseFloat(p.range.split("-")[1]) : null,
            low_52w: p.range ? parseFloat(p.range.split("-")[0]) : null,
            prev_close: p.previousClose || null,
            current_price: p.price || null,
            company_name: p.companyName || ticker,
            sector: p.sector || null,
        };
    },

    /**
     * Fetch key metrics for forward P/E
     * Stable endpoint: /stable/key-metrics-ttm?symbol=AAPL
     */
    async fetchKeyMetrics(ticker) {
        try {
            const data = await this.fmpStableGet("key-metrics-ttm", { symbol: ticker });
            const item = Array.isArray(data) ? data[0] : data;
            if (item) {
                return {
                    pe_forward: item.peRatioTTM || null,
                };
            }
        } catch (e) {
            console.warn(`Could not fetch key metrics for ${ticker}:`, e.message);
        }
        return { pe_forward: null };
    },

    /**
     * Fetch earnings date from earnings calendar (ticker-specific)
     * Stable endpoint: /stable/earnings-calendar?symbol=AAPL
     * Falls back to: /stable/earning-calendar?symbol=AAPL
     */
    async fetchEarningsDate(ticker) {
        try {
            // Try both possible endpoint names (FMP stable API may use either)
            let data = null;
            try {
                data = await this.fmpStableGet("earnings-calendar", { symbol: ticker });
            } catch (e1) {
                // Fallback to alternate name
                try {
                    data = await this.fmpStableGet("earning-calendar", { symbol: ticker });
                } catch (e2) {
                    // Try with from/to dates instead
                    const today = new Date().toISOString().slice(0, 10);
                    const nextYear = new Date();
                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                    const toDate = nextYear.toISOString().slice(0, 10);
                    data = await this.fmpStableGet("earnings-calendar", { from: today, to: toDate });
                }
            }

            if (!data || !Array.isArray(data) || data.length === 0) {
                return { earnings_date: null, days_to_earnings: null };
            }

            const today = new Date().toISOString().slice(0, 10);
            const todayDate = new Date(today);
            let nearest = null;
            let minDays = Infinity;

            for (const item of data) {
                // Filter by ticker if the response contains multiple symbols
                if (item.symbol && item.symbol !== ticker) continue;
                const d = new Date(item.date);
                if (d >= todayDate) {
                    const days = Math.round((d - todayDate) / (1000 * 60 * 60 * 24));
                    if (days < minDays) {
                        minDays = days;
                        nearest = item.date;
                    }
                }
            }

            return {
                earnings_date: nearest,
                days_to_earnings: nearest ? minDays : null,
            };
        } catch (e) {
            console.warn(`Could not fetch earnings for ${ticker}:`, e.message);
            return { earnings_date: null, days_to_earnings: null };
        }
    },

    /**
     * Fetch EPS growth YoY from income statements
     * Stable endpoint: /stable/income-statement?symbol=AAPL&period=annual&limit=2
     */
    async fetchEpsGrowth(ticker) {
        try {
            const data = await this.fmpStableGet("income-statement", {
                symbol: ticker,
                period: "annual",
                limit: 2,
            });
            if (!data || !Array.isArray(data) || data.length < 2) return null;
            const epsCurrent = data[0].epsdiluted || data[0].eps;
            const epsPrevious = data[1].epsdiluted || data[1].eps;
            if (epsPrevious && epsPrevious !== 0) {
                return Math.round(((epsCurrent - epsPrevious) / Math.abs(epsPrevious)) * 10000) / 100;
            }
        } catch (e) {
            console.warn(`Could not fetch EPS growth for ${ticker}:`, e.message);
        }
        return null;
    },

    /**
     * Fetch short float percentage
     * Stable endpoint: /stable/shares-float?symbol=AAPL
     */
    async fetchShortFloat(ticker) {
        try {
            const data = await this.fmpStableGet("shares-float", { symbol: ticker });
            if (data && Array.isArray(data) && data.length > 0) {
                const ff = data[0].freeFloat;
                if (ff != null) return Math.round(ff * 100) / 100;
            }
        } catch (e) {
            console.warn(`Could not fetch short float for ${ticker}:`, e.message);
        }
        return null;
    },

    /**
     * Fetch analyst consensus rating
     * Stable endpoint: /stable/grades-consensus?symbol=AAPL
     */
    async fetchAnalystRating(ticker) {
        try {
            const data = await this.fmpStableGet("grades-consensus", { symbol: ticker });
            if (data && Array.isArray(data) && data.length > 0) {
                const latest = data[0];
                if (latest.consensus) return latest.consensus;
                const buy = (latest.buy || 0) + (latest.strongBuy || 0);
                const hold = latest.hold || 0;
                const sell = (latest.sell || 0) + (latest.strongSell || 0);
                if (buy > hold && buy > sell) return "Buy";
                if (sell > hold && sell > buy) return "Sell";
                return "Hold";
            }
        } catch (e) {
            console.warn(`Could not fetch analyst rating for ${ticker}:`, e.message);
        }
        return null;
    },

    /**
     * Fetch all data for a single ticker. Returns combined data object.
     */
    async fetchTickerData(ticker) {
        const [ohlcv, profile, keyMetrics, earnings, epsGrowth, shortFloat, analystRating] =
            await Promise.allSettled([
                this.fetchOHLCV(ticker),
                this.fetchProfile(ticker),
                this.fetchKeyMetrics(ticker),
                this.fetchEarningsDate(ticker),
                this.fetchEpsGrowth(ticker),
                this.fetchShortFloat(ticker),
                this.fetchAnalystRating(ticker),
            ]);

        const ohlcvData = ohlcv.status === "fulfilled" ? ohlcv.value : [];
        const profileData = profile.status === "fulfilled" ? profile.value : {};
        const keyMetricsData = keyMetrics.status === "fulfilled" ? keyMetrics.value : {};
        const earningsData = earnings.status === "fulfilled" ? earnings.value : {};
        const epsGrowthVal = epsGrowth.status === "fulfilled" ? epsGrowth.value : null;
        const shortFloatVal = shortFloat.status === "fulfilled" ? shortFloat.value : null;
        const analystRatingVal = analystRating.status === "fulfilled" ? analystRating.value : null;

        if (ohlcvData.length === 0) {
            // Provide more detail about what failed
            const ohlcvError = ohlcv.status === "rejected" ? ohlcv.reason.message : "Empty response";
            throw new Error(`No OHLCV data for ${ticker}: ${ohlcvError}`);
        }

        return {
            ohlcv: ohlcvData,
            profile: { ...profileData, ...keyMetricsData },
            earnings: earningsData,
            eps_growth_yoy: epsGrowthVal,
            short_float_pct: shortFloatVal,
            analyst_rating: analystRatingVal,
        };
    },

    /**
     * Fetch SPY OHLCV for relative strength calculation
     */
    async fetchBenchmark() {
        return this.fetchOHLCV(CONFIG.BENCHMARK);
    },
};