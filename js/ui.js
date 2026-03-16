// ============================================================
// UI — DOM rendering (tables, tooltips, summaries, settings)
// @version 3.1.0
// @updated 2026-03-16
// ============================================================

const UI = {
    // Store references for chart toggling
    _marketData: {},
    _chartData: {},

    // --- Formatting helpers ---
    fmt(v, dec = 2) {
        if (v === null || v === undefined || v === "N/A") return "-";
        const n = Number(v);
        return isNaN(n) ? v : n.toFixed(dec);
    },

    fmtPct(v) { return v != null ? this.fmt(v, 2) + "%" : "-"; },

    fmtVol(v) {
        if (!v) return "-";
        if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
        if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
        if (v >= 1e3) return (v / 1e3).toFixed(0) + "K";
        return v.toString();
    },

    // --- Color helpers ---
    rsiColor(v) {
        if (v == null) return "";
        if (v < 30) return "text-accent-green";
        if (v > 70) return "text-accent-red";
        if (v > 60) return "text-accent-orange";
        return "text-gray-300";
    },
    trendColor(v) {
        if (v === "Bullish") return "text-accent-green";
        if (v === "Bearish") return "text-accent-red";
        return "text-accent-yellow";
    },
    deltaColor(v) {
        if (v > 0) return "text-accent-green";
        if (v < 0) return "text-accent-red";
        return "text-gray-400";
    },
    earningsColor(v) {
        if (v == null) return "text-gray-500";
        if (v < 7) return "text-accent-red font-bold";
        if (v <= 21) return "text-accent-yellow";
        return "text-gray-400";
    },
    shortColor(v) {
        if (v == null) return "";
        if (v > 30) return "text-accent-red font-bold";
        if (v > 20) return "text-accent-orange";
        return "text-gray-300";
    },
    rsSpyColor(v) {
        if (v == null) return "";
        if (v > 1.05) return "text-accent-green";
        if (v < 0.95) return "text-accent-red";
        return "text-gray-300";
    },
    fibPosColor(v) {
        if (v === "ABOVE_786") return "text-accent-red";
        if (v === "BELOW_236") return "text-accent-green";
        if (v === "BETWEEN_382_618") return "text-accent-blue";
        return "text-gray-400";
    },
    scoreBg(s) {
        if (s >= 70) return "bg-green-600/20 text-green-400 border border-green-600/30";
        if (s >= 40) return "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30";
        return "bg-red-600/20 text-red-400 border border-red-600/30";
    },
    setupBg(t) {
        if (t === "LONG") return "bg-green-600/20 text-green-400 border border-green-600/30";
        if (t === "SHORT") return "bg-red-600/20 text-red-400 border border-red-600/30";
        return "bg-gray-600/20 text-gray-400 border border-gray-600/30";
    },
    sweepColor(v) {
        if (v === "BUY_SWP") return "text-accent-red";
        if (v === "SELL_SWP") return "text-accent-green";
        return "text-gray-500";
    },

    fvgDisplay(d) {
        if (!d.fvg_type) return "-";
        const col = d.fvg_type === "BULL" ? "text-accent-green" : "text-accent-red";
        return `<span class="${col}">${d.fvg_type} ${d.fvg_fill_pct}%</span>`;
    },

    fibPosShort(v) {
        if (!v) return "-";
        return v.replace("BETWEEN_", "").replace("ABOVE_", ">").replace("BELOW_", "<").replace("_", "-");
    },

    rsiTooltip(v) {
        if (v == null) return "";
        if (v < 30) return `RSI ${this.fmt(v, 1)} - Oversold, potential entry zone`;
        if (v < 45) return `RSI ${this.fmt(v, 1)} - Entry zone (30-45)`;
        if (v <= 55) return `RSI ${this.fmt(v, 1)} - Neutral zone`;
        if (v <= 70) return `RSI ${this.fmt(v, 1)} - Getting warm, watch for reversal`;
        return `RSI ${this.fmt(v, 1)} - Overbought, exit/avoid`;
    },

    buildScoreTooltip(d) {
        const bd = d.score_breakdown;
        if (!bd) return `Score: ${d.composite_score}/100`;
        let html = `<div style="text-align:left;">`;
        html += `<div style="font-weight:700; margin-bottom:4px; color:#e2e8f0;">Score: ${d.composite_score}/100</div>`;
        bd.criteria.forEach(c => {
            const cls = c.met ? "met" : "not-met";
            const icon = c.met ? "+" : "-";
            const pts = c.met ? `(+${c.pts})` : "";
            html += `<div class="tip-row ${cls}">${icon} ${c.name}: ${c.value} ${pts}</div>`;
        });
        if (bd.penalties && bd.penalties.length > 0) {
            html += `<div style="margin-top:4px; border-top:1px solid #3b4260; padding-top:4px;">`;
            bd.penalties.forEach(p => {
                html += `<div class="tip-row penalty">! ${p.name} (${p.pts})</div>`;
            });
            html += `</div>`;
        }
        html += `</div>`;
        return html;
    },

    buildSetupTooltip(d) {
        if (!d.setup_reasons || d.setup_reasons.length === 0) return `Setup: ${d.setup_type}`;
        let html = `<div style="text-align:left;">`;
        html += `<div style="font-weight:700; margin-bottom:4px; color:#e2e8f0;">${d.setup_type} ${d.setup_criteria_met}/${d.setup_total_criteria}</div>`;
        if (d.setup_sizing_pct > 0) html += `<div style="color:#22c55e; margin-bottom:4px;">Sizing: ${d.setup_sizing_pct}%</div>`;
        d.setup_reasons.forEach(r => {
            html += `<div class="tip-row" style="color:#94a3b8;">- ${r}</div>`;
        });
        html += `</div>`;
        return html;
    },

    // --- Main render ---
    renderDashboard(marketData, chartData, timestamp) {
        this._marketData = marketData;
        this._chartData = chartData;

        const tickers = Object.keys(marketData);

        // Header
        document.getElementById("header-timestamp").textContent = `Live snapshot: ${timestamp}`;
        document.getElementById("ticker-count").textContent = `${tickers.length} tickers`;

        // Tables
        const tbody = document.getElementById("table-body");
        const detailBody = document.getElementById("detail-table-body");
        tbody.innerHTML = "";
        detailBody.innerHTML = "";

        tickers.forEach((ticker, idx) => {
            const d = marketData[ticker];
            const bgClass = idx % 2 === 0 ? "bg-surface-800" : "bg-surface-900/50";

            const setupLabel = d.setup_type === "WAIT" ? "WAIT" : `${d.setup_type} ${d.setup_criteria_met}/${d.setup_total_criteria}`;
            const sizingNote = d.setup_sizing_pct > 0 ? ` ${d.setup_sizing_pct}%` : "";

            // Primary row
            const row = document.createElement("tr");
            row.className = `ticker-row ${bgClass} border-b border-gray-800/50`;
            row.onclick = () => Charts.toggleChart(ticker, d, chartData[ticker]);
            row.innerHTML = `
                <td class="px-3 py-3 font-bold text-white">${ticker}</td>
                <td class="px-3 py-3 text-right cell-val text-white font-medium">${this.fmt(d.price)}</td>
                <td class="px-3 py-3 text-right cell-val ${this.deltaColor(d.delta_1d_pct)}">${d.delta_1d_pct > 0 ? "+" : ""}${this.fmtPct(d.delta_1d_pct)}</td>
                <td class="px-3 py-3 text-center">
                    <span class="tip"><span class="score-badge ${this.scoreBg(d.composite_score)}">${d.composite_score}</span><span class="tiptext">${this.buildScoreTooltip(d)}</span></span>
                </td>
                <td class="px-3 py-3 text-center">
                    <span class="tip"><span class="setup-badge ${this.setupBg(d.setup_type)}">${setupLabel}${sizingNote}</span><span class="tiptext">${this.buildSetupTooltip(d)}</span></span>
                </td>
                <td class="px-3 py-3 text-right cell-val tip ${this.rsiColor(d.rsi_daily)}">${this.fmt(d.rsi_daily, 1)}<span class="tiptext">${this.rsiTooltip(d.rsi_daily)}</span></td>
                <td class="px-3 py-3 text-center ${this.trendColor(d.trend)}">${d.trend}</td>
                <td class="px-3 py-3 text-center ${this.trendColor(d.structure)}">${d.structure}</td>
                <td class="px-3 py-3 text-center ${this.earningsColor(d.days_to_earnings)}">${d.days_to_earnings != null ? d.days_to_earnings + "d" : "-"}</td>
                <td class="px-3 py-3 text-center">${d.analyst_rating || "-"}</td>
            `;
            tbody.appendChild(row);

            if (idx < 2) row.querySelectorAll(".tip").forEach(el => el.classList.add("tip-down"));

            // Chart panel row
            const chartRow = document.createElement("tr");
            chartRow.className = bgClass;
            chartRow.innerHTML = `<td colspan="10" class="p-0"><div id="chart-panel-${ticker}" class="chart-panel"></div></td>`;
            tbody.appendChild(chartRow);

            // Detail row
            const detRow = document.createElement("tr");
            detRow.className = `${bgClass} border-b border-gray-800/50`;
            detRow.innerHTML = `
                <td class="px-2 py-2.5 font-bold text-white">${ticker}</td>
                <td class="px-2 py-2.5 text-right cell-val tip">${this.fmtPct(d.atr_pct)}<span class="tiptext">ATR% ${this.fmt(d.atr_pct, 2)}% - ${d.atr_pct > 5 ? "Extreme volatility!" : d.atr_pct > 3 ? "High vol" : "Normal"}</span></td>
                <td class="px-2 py-2.5 text-right cell-val text-gray-300">${this.fmt(d.ema50)}</td>
                <td class="px-2 py-2.5 text-right cell-val text-gray-300">${this.fmt(d.ema200)}</td>
                <td class="px-2 py-2.5 text-right cell-val text-gray-300">${this.fmt(d.avwap_30d)}</td>
                <td class="px-2 py-2.5 text-right cell-val text-gray-300">${this.fmt(d.poc_14d)}</td>
                <td class="px-2 py-2.5 text-right cell-val tip">${this.fmt(d.adx, 1)}<span class="tiptext">ADX ${this.fmt(d.adx, 1)} - ${d.adx > 30 ? "Strong trend" : d.adx > 20 ? "Developing trend" : "Ranging / No direction"}</span></td>
                <td class="px-2 py-2.5 text-right cell-val tip">${this.fmtPct(d.bb_bandwidth)}<span class="tiptext">BB Bandwidth ${this.fmt(d.bb_bandwidth, 2)}% - ${d.bb_bandwidth < 1.5 ? "Squeeze!" : d.bb_bandwidth > 5 ? "Expanded" : "Normal"}</span></td>
                <td class="px-2 py-2.5 text-center ${this.sweepColor(d.sweep)}">${d.sweep === "Neutral" ? "-" : d.sweep}</td>
                <td class="px-2 py-2.5 text-center">${this.fvgDisplay(d)}</td>
                <td class="px-2 py-2.5 text-center ${this.fibPosColor(d.fib_position)}">${this.fibPosShort(d.fib_position)}</td>
                <td class="px-2 py-2.5 text-right cell-val">${this.fmt(d.vol_avg_ratio, 1)}x</td>
                <td class="px-2 py-2.5 text-right cell-val">${this.fmtPct(d.position_52w_pct)}</td>
                <td class="px-2 py-2.5 text-right cell-val ${this.rsSpyColor(d.rs_spy_30d)}">${this.fmt(d.rs_spy_30d, 3)}</td>
                <td class="px-2 py-2.5 text-right cell-val">${this.fmt(d.pe_trailing, 1)}</td>
                <td class="px-2 py-2.5 text-right cell-val">${this.fmt(d.pe_forward, 1)}</td>
                <td class="px-2 py-2.5 text-right cell-val">${d.eps_growth_yoy != null ? this.fmtPct(d.eps_growth_yoy) : "-"}</td>
                <td class="px-2 py-2.5 text-right cell-val ${this.shortColor(d.short_float_pct)}">${d.short_float_pct != null ? this.fmtPct(d.short_float_pct) : "-"}</td>
                <td class="px-2 py-2.5 text-right cell-val">${this.fmt(d.beta, 2)}</td>
            `;
            detailBody.appendChild(detRow);
        });

        // Summaries
        this.buildSummaries(tickers, marketData);

        // Show dashboard, hide loading
        document.getElementById("loading-section").classList.add("hidden");
        document.getElementById("dashboard-content").classList.remove("hidden");
    },

    buildSummaries(tickers, marketData) {
        const container = document.getElementById("summary-container");
        container.innerHTML = "";

        tickers.forEach(ticker => {
            const d = marketData[ticker];
            const card = document.createElement("div");
            card.className = "ticker-card";

            const priceDelta = d.delta_1d_pct > 0 ? `+${this.fmtPct(d.delta_1d_pct)}` : this.fmtPct(d.delta_1d_pct);
            const deltaC = d.delta_1d_pct > 0 ? "#22c55e" : d.delta_1d_pct < 0 ? "#ef4444" : "#94a3b8";

            let setupLine = d.setup_type === "WAIT"
                ? `<span style="color:#eab308;">WAIT</span> - Insufficient confluence`
                : `<span style="color:${d.setup_type === "LONG" ? "#22c55e" : "#ef4444"};">${d.setup_type}</span> ${d.setup_criteria_met}/${d.setup_total_criteria} (${d.setup_sizing_pct}% sizing)`;

            const trendParts = [];
            if (d.price && d.ema200) trendParts.push(d.price > d.ema200 ? "above EMA200" : "below EMA200");
            if (d.structure) trendParts.push(`Structure ${d.structure}`);
            const trendDesc = `${d.trend} (${trendParts.join(", ")})`;

            const rsiDesc = d.rsi_daily == null ? "N/A" :
                d.rsi_daily < 30 ? `${this.fmt(d.rsi_daily, 1)} - Oversold, entry opportunity` :
                d.rsi_daily < 45 ? `${this.fmt(d.rsi_daily, 1)} - Entry zone` :
                d.rsi_daily <= 55 ? `${this.fmt(d.rsi_daily, 1)} - Neutral zone` :
                d.rsi_daily <= 70 ? `${this.fmt(d.rsi_daily, 1)} - Getting warm` :
                `${this.fmt(d.rsi_daily, 1)} - Overbought, avoid new entries`;

            const atrDesc = d.atr_pct != null ? `${this.fmt(d.atr_pct, 2)}% - ${d.atr_pct > 5 ? "Extreme volatility" : d.atr_pct > 3 ? "High volatility" : "Normal volatility"}` : "N/A";
            const earnDesc = d.days_to_earnings != null ? `${d.days_to_earnings} days - ${d.days_to_earnings < 7 ? "DANGER ZONE" : d.days_to_earnings <= 21 ? "Caution" : "Safe window"}` : "N/A";

            let criteriaHtml = "";
            if (d.setup_reasons && d.setup_reasons.length > 0 && d.setup_type !== "WAIT") {
                criteriaHtml = `<div style="margin-top:10px; padding-top:10px; border-top:1px solid #282d3e;">
                    <div style="font-size:14px; font-weight:600; color:#94a3b8; margin-bottom:4px;">${d.setup_type} criteria met:</div>
                    ${d.setup_reasons.map(r => `<div class="criteria-item" style="color:#22c55e;">- ${r}</div>`).join("")}
                </div>`;
            } else if (d.setup_reasons && d.setup_reasons.length > 0) {
                criteriaHtml = `<div style="margin-top:10px; padding-top:10px; border-top:1px solid #282d3e;">
                    <div style="font-size:14px; font-weight:600; color:#94a3b8; margin-bottom:4px;">Wait reasons:</div>
                    ${d.setup_reasons.map(r => `<div class="criteria-item" style="color:#eab308;">- ${r}</div>`).join("")}
                </div>`;
            }

            let actionLine;
            if (d.setup_type === "LONG" || d.setup_type === "SHORT") {
                const slSugg = d.atr != null ? `SL: 1.5x ATR = $${this.fmt(d.price + (d.setup_type === "SHORT" ? 1 : -1) * 1.5 * d.atr)}` : "";
                actionLine = `<div style="margin-top:10px; font-size:15px; font-weight:700; color:${d.setup_type === "LONG" ? "#22c55e" : "#ef4444"};">Action: ${d.setup_type} valid with ${d.setup_sizing_pct}% sizing. ${slSugg}</div>`;
            } else {
                actionLine = `<div style="margin-top:10px; font-size:15px; font-weight:700; color:#eab308;">Action: WAIT - Do not enter position.</div>`;
            }

            card.innerHTML = `
                <h3><span style="color:#e2e8f0;">[${ticker}]</span> <span style="color:#94a3b8; font-weight:400;">- $${this.fmt(d.price)} </span><span style="color:${deltaC}; font-size:15px;">(${priceDelta})</span></h3>
                <div class="detail-line">Score: <span style="color:${d.composite_score >= 70 ? "#22c55e" : d.composite_score >= 40 ? "#eab308" : "#ef4444"}; font-weight:700;">${d.composite_score}</span> | Setup: ${setupLine}</div>
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid #282d3e;">
                    <div class="detail-line">Trend: ${trendDesc}</div>
                    <div class="detail-line">RSI: ${rsiDesc}</div>
                    <div class="detail-line">ATR%: ${atrDesc}</div>
                    <div class="detail-line">Earnings: ${earnDesc}</div>
                    <div class="detail-line">Rating: ${d.analyst_rating || "N/A"} (analyst consensus)</div>
                </div>
                ${criteriaHtml}
                ${actionLine}
            `;
            container.appendChild(card);
        });
    },

    // --- Settings UI ---
    showSettings() {
        document.getElementById("settings-overlay").classList.remove("hidden");
        document.getElementById("api-key-input").value = getApiKey();
        document.getElementById("tickers-input").value = getTickers().join(", ");
    },

    hideSettings() {
        document.getElementById("settings-overlay").classList.add("hidden");
    },

    saveSettings() {
        const key = document.getElementById("api-key-input").value.trim();
        const tickersRaw = document.getElementById("tickers-input").value;
        const tickers = tickersRaw.split(",").map(t => t.trim().toUpperCase()).filter(Boolean);

        if (!key) {
            alert("Please enter your FMP API key");
            return;
        }
        if (tickers.length === 0) {
            alert("Please enter at least one ticker");
            return;
        }

        setApiKey(key);
        setTickers(tickers);
        this.hideSettings();
        // Trigger refresh
        App.loadDashboard();
    },

    showLoading(message) {
        document.getElementById("setup-overlay").classList.add("hidden");
        document.getElementById("settings-overlay").classList.add("hidden");
        document.getElementById("dashboard-content").classList.add("hidden");
        document.getElementById("loading-section").classList.remove("hidden");
        document.getElementById("loading-message").textContent = message || "Loading data...";
        const progressEl = document.getElementById("loading-progress");
        progressEl.textContent = "";
        progressEl.classList.remove("text-red-400");
        // Remove any previous error buttons
        const oldBtn = document.getElementById("error-actions");
        if (oldBtn) oldBtn.remove();
    },

    updateLoadingProgress(text) {
        document.getElementById("loading-progress").textContent = text;
    },

    showError(message, showChangeKey = false) {
        document.getElementById("setup-overlay").classList.add("hidden");
        document.getElementById("settings-overlay").classList.add("hidden");
        document.getElementById("dashboard-content").classList.add("hidden");
        document.getElementById("loading-section").classList.remove("hidden");
        document.getElementById("loading-message").textContent = "⚠ Error";
        const progressEl = document.getElementById("loading-progress");
        progressEl.style.whiteSpace = "pre-line";
        progressEl.textContent = message;
        progressEl.classList.add("text-red-400");

        // Remove previous error actions if any
        const oldBtn = document.getElementById("error-actions");
        if (oldBtn) oldBtn.remove();

        // Add action buttons
        if (showChangeKey) {
            const actionsDiv = document.createElement("div");
            actionsDiv.id = "error-actions";
            actionsDiv.className = "mt-4 flex gap-3 justify-center";
            actionsDiv.innerHTML = `
                <button class="btn-primary" onclick="UI.showSettings()" style="padding:8px 20px; font-size:14px;">🔑 Change API Key</button>
                <button class="btn-secondary" onclick="App.loadDashboard()" style="padding:8px 20px; font-size:14px;">↻ Retry</button>
            `;
            document.getElementById("loading-section").appendChild(actionsDiv);
        }
    },

    // --- Initial setup screen ---
    showSetupScreen() {
        document.getElementById("setup-overlay").classList.remove("hidden");
    },

    hideSetupScreen() {
        document.getElementById("setup-overlay").classList.add("hidden");
    },

    saveInitialSetup() {
        const key = document.getElementById("setup-api-key").value.trim();
        if (!key) {
            alert("Please enter your FMP API key to continue");
            return;
        }
        setApiKey(key);
        const tickersRaw = document.getElementById("setup-tickers").value;
        if (tickersRaw.trim()) {
            const tickers = tickersRaw.split(",").map(t => t.trim().toUpperCase()).filter(Boolean);
            if (tickers.length > 0) setTickers(tickers);
        }
        this.hideSetupScreen();
        App.loadDashboard();
    },
};