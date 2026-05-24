(() => {
    // ============== OTA brand colors (kept in sync with dataset page) ==============
    const OTA_BRANDS = {
        Expedia: {
            color: '#FFC72C',
            icon:
                '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="12" cy="12" r="12" fill="#FFC72C"/>' +
                '<path d="M6 11.5l4.5-2v1.6h7v1.8h-7v1.6L6 12.5z" fill="#003263"/>' +
                '</svg>',
        },
        Booking: {
            // Real booking blue is too dark on our dark canvas; use a lighter
            // blue for chart visibility while keeping the brand identity.
            color: '#3D8BFF',
            icon:
                '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                '<rect width="24" height="24" rx="5" fill="#003580"/>' +
                '<text x="12" y="17.5" font-size="13.5" font-weight="900" text-anchor="middle" font-family="Arial, sans-serif" fill="#FEBA02">B.</text>' +
                '</svg>',
        },
        Agoda: {
            color: '#FF6B8E',
            icon: '<img src="/assets/agoda-favicon.png" alt="Agoda" />',
        },
    };

    const STATUS_PALETTE = [
        '#4CD295', // success-ish (Settled)
        '#FFB94B', // warning amber
        '#FF6B6B', // danger red
        '#6FA8FF', // info blue
        '#B084EF', // accent purple
        '#7FE3B5', // mint
        '#FFD200', // yellow
        '#FF8A65', // coral
    ];

    // ============== DOM ==============
    const periodTabs = document.getElementById('period-tabs');
    const statsGrid = document.getElementById('stats-grid');
    const toastEl = document.getElementById('toast');

    // ============== State ==============
    let currentPeriod = 'all';
    let statsSeq = 0;
    let analyticsSeq = 0;
    let chartDaily = null;
    let chartEntry = null;
    let chartStatus = null;

    // ============== Auth helper ==============
    function getToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    function authHeaders() {
        return { Authorization: `Bearer ${getToken()}` };
    }

    // ============== Formatting ==============
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[ch]));
    }

    function formatNumber(n) {
        if (n == null || Number.isNaN(Number(n))) return '0';
        return Number(n).toLocaleString();
    }

    function formatAmount(value) {
        if (value == null || value === '') return '$0.00';
        const n = Number(value);
        if (!Number.isFinite(n)) return '$0.00';
        return `$${n.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function formatCompactAmount(value) {
        if (value == null) return '$0';
        const n = Number(value);
        if (!Number.isFinite(n)) return '$0';
        if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
        if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
        return `$${n.toFixed(0)}`;
    }

    function formatDate(value) {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return String(value);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yyyy}/${mm}/${dd}`;
    }

    // ============== Toast ==============
    let toastTimer;
    function showToast(kind, message) {
        if (!toastEl) return;
        clearTimeout(toastTimer);
        toastEl.className = `toast ${kind}`;
        toastEl.querySelector('.toast-text').textContent = message;
        toastEl.hidden = false;
        // eslint-disable-next-line no-unused-expressions
        toastEl.offsetHeight;
        toastEl.classList.add('visible');
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('visible');
            setTimeout(() => { toastEl.hidden = true; }, 300);
        }, 4500);
    }

    // ============== Period tabs ==============
    periodTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-period]');
        if (!btn) return;
        const next = btn.dataset.period;
        if (next === currentPeriod) return;
        currentPeriod = next;
        periodTabs.querySelectorAll('.period-tab').forEach((t) => {
            t.classList.toggle('active', t === btn);
        });
        refreshAll();
    });

    // ============== Stats card rendering ==============
    function renderStats(stats) {
        const totalTx = stats.total_transactions || 0;
        const totalAmt = stats.total_amount || 0;
        const range = stats.reported_range;
        const byOta = stats.by_ota || {};

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Total Transactions</div>
                <div class="stat-value">${formatNumber(totalTx)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Amount</div>
                <div class="stat-value amount">${formatAmount(totalAmt)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Reported Range</div>
                ${range
                    ? `<div class="stat-value range">
                          <div class="range-row"><span class="range-tag">From</span><span class="range-date">${escapeHtml(formatDate(range.earliest))}</span></div>
                          <div class="range-row"><span class="range-tag">To</span><span class="range-date">${escapeHtml(formatDate(range.latest))}</span></div>
                      </div>`
                    : `<div class="stat-value range" style="color: rgba(255,255,255,0.4); font-size: 14px;">No data yet</div>`}
            </div>
            <div class="stat-card stat-card-ota">
                <div class="stat-label">Totals by OTA</div>
                <div class="ota-list">${renderOtaList(byOta)}</div>
            </div>
        `;
    }

    function renderOtaList(byOta) {
        const otas = ['Expedia', 'Booking', 'Agoda'];
        const sumAmount = otas.reduce((a, k) => a + ((byOta[k] && byOta[k].amount) || 0), 0);
        return otas
            .map((brand) => {
                const data = byOta[brand] || { count: 0, amount: 0 };
                const share = sumAmount > 0 ? (data.amount / sumAmount) * 100 : 0;
                const icon = (OTA_BRANDS[brand] && OTA_BRANDS[brand].icon) || '';
                return `
                    <div class="ota-row">
                        <span class="ota-favicon">${icon}</span>
                        <span class="ota-name">${brand}</span>
                        <span class="ota-amount">${formatAmount(data.amount)}</span>
                        <span class="ota-share">${share.toFixed(1)}%</span>
                    </div>
                `;
            })
            .join('');
    }

    function renderStatsSkeleton() {
        statsGrid.innerHTML = `
            <div class="stat-card stat-skeleton"></div>
            <div class="stat-card stat-skeleton"></div>
            <div class="stat-card stat-skeleton"></div>
            <div class="stat-card stat-skeleton"></div>
        `;
    }

    // ============== Stats loader ==============
    async function loadStats() {
        const seq = ++statsSeq;
        try {
            const res = await fetch(`/api/dataset/stats?period=${currentPeriod}`, {
                headers: authHeaders(),
            });
            if (res.status === 401) {
                window.location.replace('/login');
                return;
            }
            if (!res.ok) throw new Error('stats request failed');
            const data = await res.json();
            if (seq !== statsSeq) return;
            renderStats(data);
        } catch (e) {
            console.error(e);
            if (seq === statsSeq) showToast('error', 'Could not load stats.');
        }
    }

    // ============== Analytics loader + chart rendering ==============
    async function loadAnalytics() {
        const seq = ++analyticsSeq;
        try {
            const res = await fetch(`/api/dataset/analytics?period=${currentPeriod}`, {
                headers: authHeaders(),
            });
            if (res.status === 401) {
                window.location.replace('/login');
                return;
            }
            if (!res.ok) throw new Error('analytics request failed');
            const data = await res.json();
            if (seq !== analyticsSeq) return;
            renderDailyChart(data.daily_amounts || []);
            renderEntryChart(data.by_entry_method || {});
            renderStatusChart(data.by_status || {});
        } catch (e) {
            console.error(e);
            if (seq === analyticsSeq) showToast('error', 'Could not load chart data.');
        }
    }

    // ============== Common ApexCharts defaults ==============
    const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const OTAS_FOR_CHART = ['Expedia', 'Booking', 'Agoda'];

    // ============== Daily area chart (3 OTAs) ==============
    function renderDailyChart(daily) {
        const empty = document.getElementById('chart-empty-daily');
        const legendEl = document.getElementById('legend-daily');
        const el = document.getElementById('chart-daily');
        if (!el) return;

        if (!daily.length) {
            if (chartDaily) { chartDaily.destroy(); chartDaily = null; }
            el.innerHTML = '';
            el.style.opacity = '0';
            empty.hidden = false;
            legendEl.innerHTML = '';
            return;
        }
        empty.hidden = true;
        el.style.opacity = '1';

        const categories = daily.map((d) => d.date);
        const series = OTAS_FOR_CHART.map((brand) => ({
            name: brand,
            color: OTA_BRANDS[brand].color,
            data: daily.map((d) => Number(d[brand] || 0)),
        }));

        const options = {
            chart: {
                type: 'area',
                height: 320,
                background: 'transparent',
                fontFamily: FONT,
                foreColor: 'rgba(255, 255, 255, 0.55)',
                toolbar: { show: false },
                zoom: { enabled: false },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                    animateGradually: { enabled: true, delay: 130 },
                    dynamicAnimation: { enabled: true, speed: 400 },
                },
            },
            theme: { mode: 'dark' },
            colors: series.map((s) => s.color),
            series,
            stroke: { curve: 'smooth', width: 2.5, lineCap: 'round' },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    type: 'vertical',
                    opacityFrom: 0.32,
                    opacityTo: 0,
                    stops: [0, 100],
                },
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.045)',
                strokeDashArray: 0,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { left: 8, right: 16, top: 4, bottom: 0 },
            },
            xaxis: {
                categories,
                labels: {
                    style: { colors: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: FONT },
                    rotate: 0,
                    hideOverlappingLabels: true,
                },
                axisBorder: { show: false },
                axisTicks: { show: false },
                crosshairs: {
                    show: true,
                    stroke: {
                        color: 'rgba(255, 210, 0, 0.4)',
                        width: 1,
                        dashArray: 0,
                    },
                },
                tooltip: { enabled: false },
            },
            yaxis: {
                labels: {
                    style: { colors: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: FONT },
                    formatter: (v) => formatCompactAmount(v),
                },
            },
            dataLabels: { enabled: false },
            markers: {
                size: 0,
                strokeWidth: 2,
                strokeColors: '#0F1B33',
                hover: { size: 6, sizeOffset: 0 },
            },
            legend: { show: false },
            tooltip: {
                theme: 'dark',
                shared: true,
                intersect: false,
                followCursor: false,
                x: { show: true },
                y: { formatter: (v) => formatAmount(v) },
                marker: { show: true },
                style: { fontFamily: FONT, fontSize: '12px' },
            },
            states: {
                hover: { filter: { type: 'none' } },
                active: { filter: { type: 'none' } },
            },
        };

        if (chartDaily) {
            chartDaily.updateOptions({ xaxis: { categories }, colors: series.map((s) => s.color) }, false, true);
            chartDaily.updateSeries(series);
        } else {
            chartDaily = new ApexCharts(el, options);
            chartDaily.render();
        }

        // Custom legend (clickable toggle)
        legendEl.innerHTML = OTAS_FOR_CHART
            .map((brand) => `
                <span class="chart-legend-item" data-series="${brand}">
                    <span class="chart-legend-swatch" style="background:${OTA_BRANDS[brand].color}"></span>
                    ${brand}
                </span>
            `)
            .join('');
        legendEl.querySelectorAll('.chart-legend-item').forEach((item) => {
            item.addEventListener('click', () => {
                const brand = item.dataset.series;
                chartDaily.toggleSeries(brand);
                item.classList.toggle('muted');
            });
        });
    }

    // ============== Donut charts (Entry + Status) ==============
    function renderEntryChart(byEntry) {
        renderDonut({
            elId: 'chart-entry',
            centerId: 'center-entry',
            legendId: 'legend-entry',
            emptyId: 'chart-empty-entry',
            entries: byEntry,
            order: ['API', 'Keyed'],
            colors: { API: '#6FA8FF', Keyed: '#B084EF' },
            getExisting: () => chartEntry,
            setExisting: (c) => { chartEntry = c; },
        });
    }

    function renderStatusChart(byStatus) {
        // Settled always green; remaining cycle through the palette by count desc.
        const keys = Object.keys(byStatus).sort((a, b) => byStatus[b] - byStatus[a]);
        const colors = {};
        let paletteIdx = 0;
        for (const key of keys) {
            if (/settled/i.test(key)) {
                colors[key] = '#4CD295';
            } else {
                colors[key] = STATUS_PALETTE[(paletteIdx++ % STATUS_PALETTE.length) + 1] || '#9CA3B0';
            }
        }
        renderDonut({
            elId: 'chart-status',
            centerId: 'center-status',
            legendId: 'legend-status',
            emptyId: 'chart-empty-status',
            entries: byStatus,
            order: keys,
            colors,
            getExisting: () => chartStatus,
            setExisting: (c) => { chartStatus = c; },
        });
    }

    function renderDonut({ elId, centerId, legendId, emptyId, entries, order, colors, getExisting, setExisting }) {
        const el = document.getElementById(elId);
        const centerEl = document.getElementById(centerId);
        const legendEl = document.getElementById(legendId);
        const emptyEl = document.getElementById(emptyId);
        if (!el) return;

        const presentKeys = order.filter((k) => (entries[k] || 0) > 0);
        const total = presentKeys.reduce((a, k) => a + entries[k], 0);
        const existing = getExisting();

        if (total === 0) {
            if (existing) { existing.destroy(); setExisting(null); }
            el.innerHTML = '';
            el.style.opacity = '0';
            emptyEl.hidden = false;
            centerEl.querySelector('.donut-center-value').textContent = '—';
            legendEl.innerHTML = '';
            return;
        }
        emptyEl.hidden = true;
        el.style.opacity = '1';

        const data = presentKeys.map((k) => entries[k]);
        const bg = presentKeys.map((k) => colors[k] || '#888');

        const options = {
            chart: {
                type: 'donut',
                height: 200,
                background: 'transparent',
                fontFamily: FONT,
                foreColor: 'rgba(255, 255, 255, 0.55)',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 700,
                    animateGradually: { enabled: true, delay: 80 },
                    dynamicAnimation: { enabled: true, speed: 400 },
                },
            },
            theme: { mode: 'dark' },
            series: data,
            labels: presentKeys,
            colors: bg,
            stroke: {
                width: 3,
                colors: ['#0F1B33'],
                lineCap: 'round',
            },
            plotOptions: {
                pie: {
                    expandOnClick: false,
                    donut: {
                        size: '70%',
                        background: 'transparent',
                        labels: { show: false },
                    },
                },
            },
            dataLabels: { enabled: false },
            legend: { show: false },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: function (value, { w }) {
                        const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                        const pct = sum > 0 ? ((value / sum) * 100).toFixed(1) : 0;
                        return `${formatNumber(value)} <span style="opacity:0.65; font-weight:400">(${pct}%)</span>`;
                    },
                    title: { formatter: (seriesName) => seriesName },
                },
                style: { fontFamily: FONT, fontSize: '12px' },
            },
            states: {
                hover: { filter: { type: 'lighten', value: 0.05 } },
                active: { filter: { type: 'none' } },
            },
        };

        if (existing) {
            existing.updateOptions({ labels: presentKeys, colors: bg }, false, true);
            existing.updateSeries(data);
        } else {
            const chart = new ApexCharts(el, options);
            chart.render();
            setExisting(chart);
        }

        centerEl.querySelector('.donut-center-value').textContent = formatNumber(total);

        legendEl.innerHTML = presentKeys
            .map((key) => {
                const count = entries[key];
                const pct = ((count / total) * 100).toFixed(1);
                return `
                    <div class="donut-legend-item">
                        <span class="donut-legend-swatch" style="background:${colors[key]}"></span>
                        <span class="donut-legend-label">${escapeHtml(key)}</span>
                        <span class="donut-legend-value">${formatNumber(count)} · ${pct}%</span>
                    </div>
                `;
            })
            .join('');
    }

    async function refreshAll() {
        statsGrid.style.opacity = '0.5';
        await Promise.all([loadStats(), loadAnalytics()]);
        statsGrid.style.opacity = '1';
    }

    // ============== Init ==============
    renderStatsSkeleton();
    refreshAll();
})();