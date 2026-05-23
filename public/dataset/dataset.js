(() => {
    // ============== Column config ==============
    // `type` controls cell formatting + extra cell classes.
    // `filter.kind` controls the popover UI ('text' | 'number' | 'enum' | 'date').
    // `filter.field` lets a display column (e.g. Hotel) filter on a real DB
    // field (`dba`) when it doesn't directly correspond to one.
    const COLUMNS = [
        { key: 'order_id', label: 'Reservation ID', type: 'id', filter: { kind: 'text' } },
        { key: 'hotel', label: 'Hotel', type: 'hotel', filter: { kind: 'text', field: 'dba' } },
        { key: 'ota', label: 'OTA', type: 'ota', filter: { kind: 'enum' } },
        { key: 'amount', label: 'Amount', type: 'amount', filter: { kind: 'number' } },
        { key: 'reported_date', label: 'Reported Date', type: 'date', filter: { kind: 'date' } },
        { key: 'time', label: 'Transaction Time', type: 'time', filter: { kind: 'text' } },
        { key: 'status', label: 'Status', type: 'badge', successWhen: 'settled', filter: { kind: 'enum' } },
        { key: 'response', label: 'Response', type: 'badge', successWhen: 'success', filter: { kind: 'enum' } },
        { key: 'first_name', label: 'First Name', filter: { kind: 'text' } },
        { key: 'account', label: 'Card Last 4', filter: { kind: 'text' } },
        { key: 'account_expiration', label: 'Card Expiry', type: 'expiry', filter: { kind: 'text' } },
        { key: 'transaction_id', label: 'Trans. ID', type: 'copyable', filter: { kind: 'text' } },
        { key: 'response_text', label: 'Response Text', filter: { kind: 'text' } },
        { key: 'avs_results', label: 'AVS', type: 'badge', codes: 'AVS', codeStyle: true, filter: { kind: 'enum' } },
        { key: 'csc_results', label: 'CSC', type: 'badge', codes: 'CSC', codeStyle: true, filter: { kind: 'enum' } },
        { key: 'type', label: 'Type', filter: { kind: 'enum' } },
        { key: 'payment_type', label: 'Payment Type', filter: { kind: 'enum' } },
        { key: 'auth_code', label: 'Auth Code', filter: { kind: 'text' } },
        { key: 'batch_id', label: 'Batch ID', filter: { kind: 'text' } },
        { key: 'processor_id', label: 'Processor ID', filter: { kind: 'text' } },
        { key: 'address_one', label: 'Address 1', filter: { kind: 'text' } },
        { key: 'address_two', label: 'Address 2', filter: { kind: 'text' } },
        { key: 'city', label: 'City', filter: { kind: 'text' } },
        { key: 'state', label: 'State', filter: { kind: 'text' } },
        { key: 'zip_code', label: 'ZIP', filter: { kind: 'text' } },
        { key: 'country', label: 'Country', filter: { kind: 'text' } },
        { key: 'entry_method', label: 'Entry', type: 'badge', codes: 'ENTRY', filter: { kind: 'enum' } },
        { key: 'service_type', label: 'Service', filter: { kind: 'enum' } },
        { key: 'descriptor_dba', label: 'Desc. DBA', filter: { kind: 'text' } },
        { key: 'descriptor_phone_number', label: 'Desc. Phone', filter: { kind: 'text' } },
        { key: 'file_name', label: 'Source File', type: 'file-link', filter: { kind: 'text' } },
    ];

    // Field a column filters on (key, unless overridden by filter.field)
    function filterField(col) {
        return (col.filter && col.filter.field) || col.key;
    }

    const ICONS = {
        check: '<svg viewBox="0 0 16 16"><path d="M3 8L7 12L13 5"/></svg>',
        cross: '<svg viewBox="0 0 16 16"><path d="M4 4L12 12M12 4L4 12"/></svg>',
        emptyTable: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><line x1="3" y1="11" x2="21" y2="11"/><line x1="9" y1="6" x2="9" y2="20"/></svg>',
        copy: '<svg viewBox="0 0 16 16"><rect x="4.5" y="4.5" width="9" height="10.5" rx="1.4"/><path d="M9 1.5H3.5C2.67 1.5 2 2.17 2 3v9"/></svg>',
        copyCheck: '<svg viewBox="0 0 16 16"><path d="M3 8L7 12L13 5"/></svg>',
        funnel: '<svg viewBox="0 0 16 16" fill="none"><path d="M2 3.5h12L9.5 9v4l-3-1.5V9L2 3.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
        funnelFilled: '<svg viewBox="0 0 16 16"><path d="M2 3.5h12L9.5 9v4l-3-1.5V9L2 3.5z" fill="currentColor"/></svg>',
        sortAsc: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 4h6M3 8h4M3 12h2M11 4v9M9 11l2 2 2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        sortDesc: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 4h2M3 8h4M3 12h6M11 13V4M9 6l2-2 2 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        search: '<svg viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    };

    // OTA brand definitions:
    //   icon     — small circular favicon for the table badge
    //   wordmark — full SVG wordmark for the credit-card mockup header
    //   cardClass — class applied to the payment card to swap brand colors
    const OTA_BRANDS = {
        Expedia: {
            slug: 'expedia',
            icon:
                '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="12" cy="12" r="12" fill="#FFC72C"/>' +
                '<path d="M6 11.5l4.5-2v1.6h7v1.8h-7v1.6L6 12.5z" fill="#003263"/>' +
                '</svg>',
            wordmark: '<img src="/assets/expedia-logo.png" alt="Expedia" />',
            cardClass: 'card-expedia',
        },
        Booking: {
            slug: 'booking',
            icon:
                '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                '<rect width="24" height="24" rx="5" fill="#003580"/>' +
                '<text x="12" y="17.5" font-size="13.5" font-weight="900" text-anchor="middle" font-family="Arial, sans-serif" fill="#FEBA02">B.</text>' +
                '</svg>',
            wordmark: '<img src="/assets/booking-logo.png" alt="Booking.com" />',
            cardClass: 'card-booking',
        },
        Agoda: {
            slug: 'agoda',
            icon: '<img src="/assets/agoda-favicon.png" alt="Agoda" />',
            wordmark: '<img src="/assets/agoda-logo.png" alt="Agoda" />',
            cardClass: 'card-agoda',
        },
    };

    // ============== DOM refs ==============
    const theadRow = document.getElementById('data-thead-row');
    const tbody = document.getElementById('data-tbody');
    const countEl = document.getElementById('data-count');
    const paginationEl = document.getElementById('data-pagination');
    const searchEl = document.getElementById('search');
    const searchInput = document.getElementById('search-input');
    const toastEl = document.getElementById('toast');

    // ============== State ==============
    const PAGE_SIZE = 50;
    let currentRows = [];
    let totalRows = 0;
    let currentPage = 1;
    let searchQuery = '';
    let loadSeq = 0;

    // Per-column filters keyed by Mongo field (not column key — see filterField).
    // Shape per kind:
    //   text/enum: { op: 'in', value: [...] } | { op: 'contains', value }
    //   number:    { op: 'eq'|'ne'|'gt'|'gte'|'lt'|'lte', value } | { op: 'between', min, max }
    //   date:      { after: 'YYYY-MM-DD', before: 'YYYY-MM-DD' }
    let filterState = {};
    let sortState = null; // { key, dir }

    // Selected row ids — persists across pagination so users can build a
    // selection by paging through.
    const selectedIds = new Set();

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

    function formatDate(value) {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return escapeHtml(String(value));
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}/${mm}/${dd}`;
    }

    function formatTimeOnly(value) {
        const str = String(value).trim();
        // Pull out the HH:MM[:SS][ AM/PM] block — discard any date prefix.
        const match = str.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/);
        return match ? match[1].trim() : str;
    }

    function renderOtaBadge(value) {
        const v = String(value || '').trim();
        const brand = OTA_BRANDS[v];
        if (!brand) return escapeHtml(v);
        return `
            <span class="cell-badge ota ota-${brand.slug}">
                <span class="ota-icon">${brand.icon}</span>
                ${escapeHtml(v)}
            </span>
        `;
    }

    function formatExpiry(value) {
        const raw = String(value).trim();
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 3) return `0${digits[0]}/${digits.slice(1)}`;
        if (digits.length === 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        return raw;
    }

    function formatAmount(value) {
        if (value == null || value === '') return '—';
        const n = Number(value);
        if (!Number.isFinite(n)) return escapeHtml(String(value));
        return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function formatCell(row, col) {
        if (col.type === 'hotel') return buildHotelCell(row);

        const value = row[col.key];
        const empty = value == null || value === '';
        if (empty) {
            return { html: '<span class="cell-muted">—</span>', cls: 'cell-muted' };
        }
        switch (col.type) {
            case 'amount':
                return { html: formatAmount(value), cls: 'cell-amount' };
            case 'date':
                return { html: formatDate(value), cls: '' };
            case 'expiry':
                return { html: escapeHtml(formatExpiry(value)), cls: '' };
            case 'time':
                return { html: escapeHtml(formatTimeOnly(value)), cls: '' };
            case 'badge': {
                const valueStr = String(value);
                // Code-driven badge (e.g. AVS, CSC, Entry) with a tooltip
                if (col.codes) {
                    const map = (window.QP_CODES && window.QP_CODES[col.codes]) || {};
                    const meta = map[valueStr.trim().toUpperCase()] || {};
                    const variant = meta.variant || 'neutral';
                    const tooltip = meta.reason || '';
                    const tooltipAttr = tooltip
                        ? ` data-tooltip="${escapeHtml(tooltip)}"`
                        : '';
                    const codeCls = col.codeStyle ? ' code' : '';
                    return {
                        html: `<span class="cell-badge${codeCls} ${variant}"${tooltipAttr}>${escapeHtml(valueStr)}</span>`,
                        cls: tooltip ? 'cell-tooltip' : '',
                    };
                }
                // Simple match-based badge (Status, Response)
                const isSuccess =
                    valueStr.trim().toLowerCase() ===
                    String(col.successWhen || '').toLowerCase();
                const variant = isSuccess ? 'success' : 'danger';
                return {
                    html: `<span class="cell-badge ${variant}">${escapeHtml(valueStr)}</span>`,
                    cls: '',
                };
            }
            case 'file-link': {
                const safe = escapeHtml(String(value));
                const href = `/file-upload?q=${encodeURIComponent(String(value))}`;
                return {
                    html: `<a class="cell-link" href="${href}" title="Open in Files">${safe}</a>`,
                    cls: '',
                };
            }
            case 'ota': {
                return { html: renderOtaBadge(value), cls: '' };
            }
            case 'id':
            case 'copyable': {
                const safe = escapeHtml(String(value));
                const cls = col.type === 'id' ? 'cell-id' : 'cell-copy';
                return {
                    html: `
                        <span class="id-cell">
                            <span class="id-value">${safe}</span>
                            <button type="button" class="copy-btn" data-copy="${safe}" aria-label="Copy ${escapeHtml(col.label)}" title="Copy ${escapeHtml(col.label)}">
                                ${ICONS.copy.replace('<svg', '<svg class="copy-icon"')}
                                ${ICONS.copyCheck.replace('<svg', '<svg class="copy-check"')}
                            </button>
                        </span>`,
                    cls,
                };
            }
            case 'muted':
                return { html: escapeHtml(String(value)), cls: 'cell-muted' };
            default:
                return { html: escapeHtml(String(value)), cls: '' };
        }
    }

    function buildHotelCell(row) {
        const hasDba = row.dba != null && row.dba !== '';
        const hasMid = row.mid != null && row.mid !== '';
        if (!hasDba && !hasMid) {
            return { html: '<span class="cell-muted">—</span>', cls: 'cell-muted' };
        }
        const parts = [];
        if (hasDba) {
            parts.push(`<div class="hotel-dba">${escapeHtml(String(row.dba))}</div>`);
        }
        if (hasMid) {
            const safeMid = escapeHtml(String(row.mid));
            parts.push(`
                <div class="hotel-mid">
                    <span class="hotel-mid-value">${safeMid}</span>
                    <button type="button" class="copy-btn" data-copy="${safeMid}" aria-label="Copy MID" title="Copy MID">
                        ${ICONS.copy.replace('<svg', '<svg class="copy-icon"')}
                        ${ICONS.copyCheck.replace('<svg', '<svg class="copy-check"')}
                    </button>
                </div>`);
        }
        return { html: parts.join(''), cls: 'cell-hotel' };
    }

    // ============== Rendering ==============
    function renderHead() {
        const checkCell = `
            <th class="col-check">
                <label class="head-check-label" id="head-check-label">
                    <input type="checkbox" id="select-all-check" aria-label="Select all visible rows">
                    <span class="head-check-box"></span>
                </label>
            </th>
        `;
        const cols = COLUMNS.map((col) => {
            if (!col.filter) {
                return `<th><span class="th-label">${escapeHtml(col.label)}</span></th>`;
            }
            const field = filterField(col);
            const filterActive = !!filterState[field];
            const sortActive = sortState && sortState.key === field;
            const activeCls = filterActive || sortActive ? ' active' : '';
            return `
                <th>
                    <span class="th-label">${escapeHtml(col.label)}</span>
                    <button class="filter-btn${activeCls}" data-filter-col="${col.key}" aria-label="Filter ${escapeHtml(col.label)}">${
                        filterActive ? ICONS.funnelFilled : ICONS.funnel
                    }</button>
                </th>`;
        }).join('');
        theadRow.innerHTML = checkCell + cols;
        updateSelectAllUi();
    }

    function renderRows(rows) {
        const colspan = COLUMNS.length + 1;
        if (!rows.length) {
            const message = searchQuery
                ? `No rows match &ldquo;<strong>${escapeHtml(searchQuery)}</strong>&rdquo;. Try a different search.`
                : 'No QP data yet. Upload a report from the Files page to populate the dataset.';
            tbody.innerHTML = `
                <tr><td colspan="${colspan}">
                    <div class="data-empty">
                        <div class="empty-icon">${ICONS.emptyTable}</div>
                        <div>${message}</div>
                    </div>
                </td></tr>`;
            countEl.textContent = searchQuery ? '0 matches' : '0 total';
            updateSelectAllUi();
            return;
        }
        tbody.innerHTML = '';
        const frag = document.createDocumentFragment();
        rows.forEach((row, i) => {
            const id = String(row._id);
            const isSelected = selectedIds.has(id);
            const tr = document.createElement('tr');
            tr.style.animationDelay = `${Math.min(i * 18, 360)}ms`;
            tr.dataset.rowId = id;
            if (isSelected) tr.classList.add('row-selected');
            const cells = COLUMNS.map((col) => {
                const cell = formatCell(row, col);
                const titleAttr = row[col.key] != null && row[col.key] !== ''
                    ? ` title="${escapeHtml(String(row[col.key]))}"`
                    : '';
                return `<td class="${cell.cls}"${titleAttr}>${cell.html}</td>`;
            }).join('');
            tr.innerHTML = `
                <td class="col-check">
                    <label class="row-check-label">
                        <input type="checkbox" class="row-check" data-row-id="${id}" ${isSelected ? 'checked' : ''}>
                        <span class="row-check-box"></span>
                    </label>
                </td>
                ${cells}
            `;
            frag.appendChild(tr);
        });
        tbody.appendChild(frag);
        countEl.textContent = searchQuery
            ? `${totalRows} match${totalRows === 1 ? '' : 'es'}`
            : `${totalRows} total`;
        updateSelectAllUi();
    }

    function buildPageList(current, total) {
        const set = new Set([1, total, current - 1, current, current + 1]);
        const valid = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
        const out = [];
        for (let i = 0; i < valid.length; i++) {
            if (i > 0 && valid[i] - valid[i - 1] > 1) out.push('...');
            out.push(valid[i]);
        }
        return out;
    }

    function renderPagination() {
        const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        if (totalRows === 0) {
            paginationEl.hidden = true;
            paginationEl.innerHTML = '';
            return;
        }
        paginationEl.hidden = false;

        const startNum = (currentPage - 1) * PAGE_SIZE + 1;
        const endNum = Math.min(currentPage * PAGE_SIZE, totalRows);
        const pages = buildPageList(currentPage, totalPages);
        const pageBtns = pages
            .map((p) => {
                if (p === '...') return '<span class="page-dots">…</span>';
                const cls = p === currentPage ? ' active' : '';
                return `<button class="page-btn${cls}" data-page="${p}">${p}</button>`;
            })
            .join('');

        paginationEl.innerHTML = `
            <div class="pagination-info">Showing ${startNum}–${endNum} of ${totalRows}</div>
            <div class="pagination-controls">
                <button class="page-btn" data-action="prev" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Previous page">‹</button>
                ${pageBtns}
                <button class="page-btn" data-action="next" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Next page">›</button>
            </div>
        `;
    }

    // ============== Copy-to-clipboard on Hotel cell ==============
    tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('.copy-btn');
        if (!btn) return;
        // Don't let row click open the details modal when the copy button is hit
        e.stopPropagation();
        const value = btn.dataset.copy;
        if (!value) return;
        try {
            await copyToClipboard(value);
            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 1200);
        } catch (err) {
            console.error(err);
            showToast('error', 'Could not copy to clipboard.');
        }
    });

    // ============== Row click → Details modal ==============
    tbody.addEventListener('click', (e) => {
        // Ignore clicks on interactive elements inside the row
        if (e.target.closest('.copy-btn, .cell-link, .row-check-label, .row-check, .row-check-box')) return;
        const tr = e.target.closest('tr[data-row-id]');
        if (!tr) return;
        const row = currentRows.find((r) => String(r._id) === tr.dataset.rowId);
        if (!row) return;
        openDetailsModal(row);
    });

    // ============== Multiselect ==============
    const exportBtn = document.getElementById('export-btn');
    const exportMenu = document.getElementById('export-menu');
    const exportSelectedBtn = document.getElementById('export-selected-btn');
    const exportCountEl = document.getElementById('export-count');

    // Per-row checkbox change
    tbody.addEventListener('change', (e) => {
        const checkbox = e.target.closest('.row-check');
        if (!checkbox) return;
        const id = checkbox.dataset.rowId;
        if (!id) return;
        if (checkbox.checked) selectedIds.add(id);
        else selectedIds.delete(id);
        // Toggle selected-row styling without re-rendering
        const tr = checkbox.closest('tr');
        if (tr) tr.classList.toggle('row-selected', checkbox.checked);
        updateSelectAllUi();
    });

    // Select-all (visible) checkbox
    theadRow.addEventListener('change', (e) => {
        if (e.target.id !== 'select-all-check') return;
        const checked = e.target.checked;
        currentRows.forEach((row) => {
            const id = String(row._id);
            if (checked) selectedIds.add(id);
            else selectedIds.delete(id);
        });
        // Reflect in the rendered rows
        document.querySelectorAll('.row-check').forEach((cb) => {
            const id = cb.dataset.rowId;
            cb.checked = selectedIds.has(id);
            const tr = cb.closest('tr');
            if (tr) tr.classList.toggle('row-selected', cb.checked);
        });
        updateSelectAllUi();
    });

    function updateSelectAllUi() {
        const headCheck = document.getElementById('select-all-check');
        const headLabel = document.getElementById('head-check-label');
        if (!headCheck || !headLabel) return;
        const visibleIds = currentRows.map((r) => String(r._id));
        const visibleSelected = visibleIds.filter((id) => selectedIds.has(id));
        if (visibleIds.length === 0) {
            headCheck.checked = false;
            headLabel.classList.remove('indeterminate');
        } else if (visibleSelected.length === visibleIds.length) {
            headCheck.checked = true;
            headLabel.classList.remove('indeterminate');
        } else if (visibleSelected.length === 0) {
            headCheck.checked = false;
            headLabel.classList.remove('indeterminate');
        } else {
            headCheck.checked = false;
            headLabel.classList.add('indeterminate');
        }
        updateExportSelectedState();
    }

    function updateExportSelectedState() {
        const n = selectedIds.size;
        exportSelectedBtn.disabled = n === 0;
        if (n > 0) {
            exportCountEl.hidden = false;
            exportCountEl.textContent = `(${n})`;
        } else {
            exportCountEl.hidden = true;
        }
    }

    // ============== Export dropdown ==============
    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = exportMenu.hidden;
        exportMenu.hidden = !open;
        exportBtn.classList.toggle('open', open);
    });

    document.addEventListener('click', (e) => {
        if (exportMenu.hidden) return;
        if (exportBtn.contains(e.target) || exportMenu.contains(e.target)) return;
        exportMenu.hidden = true;
        exportBtn.classList.remove('open');
    });

    exportMenu.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn || btn.disabled) return;
        exportMenu.hidden = true;
        exportBtn.classList.remove('open');
        const action = btn.dataset.action;
        if (action === 'export-all') {
            await downloadExport({
                filters: filterState,
                sort: sortState ? [sortState] : [],
                search: searchQuery || undefined,
            }, 'Exporting all rows…');
        } else if (action === 'export-selected') {
            const ids = Array.from(selectedIds);
            if (ids.length === 0) return;
            await downloadExport({ ids }, `Exporting ${ids.length} row${ids.length === 1 ? '' : 's'}…`);
        }
    });

    async function downloadExport(body, loadingLabel) {
        const originalHtml = exportBtn.innerHTML;
        exportBtn.disabled = true;
        exportBtn.innerHTML = `<span class="btn-mini-spinner"></span>${escapeHtml(loadingLabel || 'Exporting…')}`;
        try {
            const res = await fetch('/api/dataset/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Export failed');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const filename = `qp-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('success', `Exported ${filename}`);
        } catch (err) {
            console.error(err);
            showToast('error', err.message || 'Could not export the dataset.');
        } finally {
            exportBtn.disabled = false;
            exportBtn.innerHTML = originalHtml;
        }
    }

    async function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        // Fallback for non-HTTPS contexts (e.g. http://localhost in some browsers)
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
    }

    paginationEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (!btn || btn.disabled) return;
        const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
        if (btn.dataset.action === 'prev') {
            if (currentPage <= 1) return;
            currentPage--;
        } else if (btn.dataset.action === 'next') {
            if (currentPage >= totalPages) return;
            currentPage++;
        } else if (btn.dataset.page) {
            const next = Number(btn.dataset.page);
            if (next === currentPage) return;
            currentPage = next;
        } else {
            return;
        }
        loadData();
        // Scroll table back to the left when paging so the user sees from col 1.
        const wrap = document.getElementById('data-table-wrap');
        if (wrap) wrap.scrollLeft = 0;
    });

    // ============== Data loading ==============
    async function loadData() {
        const seq = ++loadSeq;
        tbody.classList.add('loading');
        try {
            const res = await fetch('/api/dataset/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    limit: PAGE_SIZE,
                    skip: (currentPage - 1) * PAGE_SIZE,
                    search: searchQuery || undefined,
                    filters: filterState,
                    sort: sortState ? [sortState] : [],
                }),
            });
            if (res.status === 401) {
                window.location.replace('/login');
                return;
            }
            const data = await res.json();
            if (seq !== loadSeq) return;

            if (
                data.total > 0 &&
                (data.items || []).length === 0 &&
                currentPage > 1
            ) {
                currentPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
                return loadData();
            }

            currentRows = data.items || [];
            totalRows = data.total || 0;
            renderRows(currentRows);
            renderPagination();
            renderHead();
        } catch (e) {
            console.error('Failed to load dataset', e);
            showToast('error', 'Could not load the dataset.');
        } finally {
            if (seq === loadSeq) tbody.classList.remove('loading');
        }
    }

    // ============== Search ==============
    let searchDebounce;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchEl.classList.add('loading');
        searchDebounce = setTimeout(async () => {
            const nextQuery = searchInput.value.trim();
            if (nextQuery === searchQuery) {
                searchEl.classList.remove('loading');
                return;
            }
            searchQuery = nextQuery;
            currentPage = 1;
            try {
                await loadData();
            } finally {
                searchEl.classList.remove('loading');
            }
        }, 250);
    });

    // ============== Toast ==============
    let toastTimer;
    function showToast(kind, message) {
        clearTimeout(toastTimer);
        toastEl.className = `toast ${kind}`;
        toastEl.querySelector('.toast-icon').innerHTML =
            kind === 'success' ? ICONS.check : ICONS.cross;
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

    // ============== Details modal ==============
    const detailsBackdrop = document.getElementById('details-modal');
    const detailsModal = document.getElementById('details-modal-inner');
    const detailsResId = document.getElementById('details-res-id');
    const detailsDba = document.getElementById('details-dba');
    const detailsAmount = document.getElementById('details-amount');
    const detailsBody = document.getElementById('details-body');
    const detailsCloseBtn = document.getElementById('details-close');
    const detailsPrevBtn = document.getElementById('details-prev');
    const detailsNextBtn = document.getElementById('details-next');
    let currentDetailIndex = -1;

    // Field groups shown in the details view. Card fields (first_name, account,
    // account_expiration) and the header fields (order_id, amount) are
    // intentionally excluded from these groups since they're rendered above.
    const DETAIL_GROUPS = [
        {
            title: 'Transaction',
            fields: [
                { key: 'ota', label: 'OTA', render: 'ota' },
                { key: 'transaction_id', label: 'Trans. ID' },
                { key: 'transaction_date_time_local', label: 'Trans. Date/Time' },
                { key: 'transaction_date_local', label: 'Trans. Date' },
                { key: 'time', label: 'Transaction Time', formatter: formatTimeOnly },
                { key: 'type', label: 'Type' },
                { key: 'payment_type', label: 'Payment Type' },
                { key: 'order_description', label: 'Description' },
            ],
        },
        {
            title: 'Status & Response',
            fields: [
                { key: 'status', label: 'Status', render: 'badge-status' },
                { key: 'response', label: 'Response', render: 'badge-response' },
                { key: 'response_text', label: 'Response Text' },
                { key: 'avs_results', label: 'AVS', render: 'badge-avs' },
                { key: 'csc_results', label: 'CSC', render: 'badge-csc' },
                { key: 'auth_code', label: 'Auth Code' },
                { key: 'batch_id', label: 'Batch ID' },
                { key: 'processor_id', label: 'Processor ID' },
                { key: 'authentication_result', label: 'Auth Result' },
                { key: 'entry_method', label: 'Entry Method', render: 'badge-entry' },
                { key: 'service_type', label: 'Service Type' },
            ],
        },
        {
            title: 'Merchant',
            fields: [
                { key: 'mid', label: 'MID' },
                { key: 'dba', label: 'DBA' },
                { key: 'descriptor_dba', label: 'Descriptor DBA' },
                { key: 'descriptor_phone_number', label: 'Descriptor Phone' },
            ],
        },
        {
            title: 'Customer',
            fields: [
                { key: 'last_name', label: 'Last Name' },
                { key: 'company_name', label: 'Company' },
                { key: 'email', label: 'Email' },
                { key: 'phone_number', label: 'Phone' },
                { key: 'fax', label: 'Fax' },
            ],
        },
        {
            title: 'Billing Address',
            fields: [
                { key: 'address_one', label: 'Address Line 1' },
                { key: 'address_two', label: 'Address Line 2' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'zip_code', label: 'ZIP Code' },
                { key: 'country', label: 'Country' },
            ],
        },
        {
            title: 'Shipping',
            fields: [
                { key: 'shipping_first_name', label: 'First Name' },
                { key: 'shipping_last_name', label: 'Last Name' },
                { key: 'shipping_to_company_name', label: 'Company' },
                { key: 'shipping_to_address_one', label: 'Address Line 1' },
                { key: 'shipping_to_address_two', label: 'Address Line 2' },
                { key: 'shipping_to_city', label: 'City' },
                { key: 'shipping_to_state', label: 'State' },
                { key: 'shipping_to_postal_code', label: 'ZIP Code' },
                { key: 'shipping_to_country', label: 'Country' },
                { key: 'shipping_email', label: 'Email' },
            ],
        },
        {
            title: 'Source',
            fields: [
                { key: 'user_name', label: 'User' },
                { key: 'file_name', label: 'Source File', render: 'file-link' },
                { key: 'reported_date', label: 'Reported Date', formatter: formatDate },
            ],
        },
    ];

    function openDetailsModal(row) {
        currentDetailIndex = currentRows.findIndex(
            (r) => String(r._id) === String(row._id)
        );
        renderDetails();
        if (detailsBackdrop.hidden) {
            document.body.style.overflow = 'hidden';
            detailsBackdrop.hidden = false;
            // eslint-disable-next-line no-unused-expressions
            detailsBackdrop.offsetHeight;
            detailsBackdrop.classList.add('visible');
        }
    }

    function navigateDetails(delta) {
        const next = currentDetailIndex + delta;
        if (next < 0 || next >= currentRows.length) return;
        currentDetailIndex = next;
        renderDetails();
        // Scroll modal body back to the top so the user always starts at the
        // header when stepping between transactions.
        detailsBackdrop.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderDetails() {
        const row = currentRows[currentDetailIndex];
        if (!row) return;
        detailsResId.textContent = row.order_id || '—';
        detailsDba.textContent = row.dba || '';
        detailsAmount.textContent = formatAmount(row.amount);
        detailsBody.innerHTML = buildDetailsBody(row);
        detailsPrevBtn.disabled = currentDetailIndex <= 0;
        detailsNextBtn.disabled = currentDetailIndex >= currentRows.length - 1;
    }

    function closeDetailsModal() {
        detailsBackdrop.classList.remove('visible');
        document.body.style.overflow = '';
        setTimeout(() => {
            detailsBackdrop.hidden = true;
            detailsBody.innerHTML = '';
            currentDetailIndex = -1;
        }, 300);
    }

    function buildDetailsBody(row) {
        return `
            <div class="card-section">${buildPaymentCard(row)}</div>
            <div class="details-groups">${
                DETAIL_GROUPS
                    .map((group, i) => buildGroup(group, row, i))
                    .join('')
            }</div>
        `;
    }

    function buildPaymentCard(row) {
        const rawName = String(row.first_name || '').trim();
        const name = rawName ? rawName.toUpperCase() : 'CARDHOLDER';
        // QP exports sometimes prefix the last 4 with mask characters (e.g.
        // "************4242" or "****1234"). Strip everything non-numeric and
        // take just the last 4 digits.
        const cleanLast4 = String(row.account || '')
            .replace(/[^0-9]/g, '')
            .slice(-4);
        const last4 = cleanLast4 || '••••';
        const expiry = row.account_expiration
            ? formatExpiry(row.account_expiration)
            : '••/••';

        // OTA-specific theming for the card
        const brand = row.ota && OTA_BRANDS[row.ota];
        const cardClass = brand ? ` ${brand.cardClass}` : '';
        const brandMark = brand && brand.wordmark
            ? `<span class="payment-card-brand">${brand.wordmark}</span>`
            : '<div class="payment-card-brand vnp">VNP</div>';

        return `
            <div class="payment-card${cardClass}">
                <div class="payment-card-top">
                    <div class="payment-card-chip" aria-hidden="true"></div>
                    ${brandMark}
                </div>
                <div class="payment-card-number" aria-label="Card number">
                    <span class="group">••••</span>
                    <span class="group">••••</span>
                    <span class="group">••••</span>
                    <span class="group live">${escapeHtml(last4)}</span>
                </div>
                <div class="payment-card-bottom">
                    <div class="pc-block pc-name">
                        <div class="pc-label">Cardholder</div>
                        <div class="pc-value">${escapeHtml(name)}</div>
                    </div>
                    <div class="pc-block pc-expiry">
                        <div class="pc-label">Valid Thru</div>
                        <div class="pc-value">${escapeHtml(expiry)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    function buildGroup(group, row, index) {
        const items = group.fields
            .map((field) => buildDetailItem(field, row))
            .join('');
        return `
            <section class="details-group" style="animation-delay: ${0.14 + index * 0.05}s">
                <div class="details-group-title">${escapeHtml(group.title)}</div>
                <div class="details-grid">${items}</div>
            </section>
        `;
    }

    function buildDetailItem(field, row) {
        const value = row[field.key];
        const empty = value == null || value === '';
        let html;
        let valueClass = 'detail-value';

        if (empty) {
            html = '—';
            valueClass += ' empty';
        } else if (field.render === 'badge-status') {
            html = renderSimpleBadge(value, 'settled');
        } else if (field.render === 'badge-response') {
            html = renderSimpleBadge(value, 'success');
        } else if (field.render === 'badge-avs') {
            html = renderCodeBadge(value, 'AVS', true);
        } else if (field.render === 'badge-csc') {
            html = renderCodeBadge(value, 'CSC', true);
        } else if (field.render === 'badge-entry') {
            html = renderCodeBadge(value, 'ENTRY', false);
        } else if (field.render === 'file-link') {
            const safe = escapeHtml(String(value));
            html = `<a class="cell-link" href="/file-upload?q=${encodeURIComponent(String(value))}" title="Open in Files">${safe}</a>`;
        } else if (field.render === 'ota') {
            html = renderOtaBadge(value);
        } else if (field.formatter) {
            html = escapeHtml(field.formatter(value));
        } else {
            html = escapeHtml(String(value));
        }

        return `
            <div class="detail-item">
                <div class="detail-label">${escapeHtml(field.label)}</div>
                <div class="${valueClass}">${html}</div>
            </div>
        `;
    }

    function renderSimpleBadge(value, successWhen) {
        const isSuccess =
            String(value).trim().toLowerCase() === String(successWhen).toLowerCase();
        const variant = isSuccess ? 'success' : 'danger';
        return `<span class="cell-badge ${variant}">${escapeHtml(String(value))}</span>`;
    }

    function renderCodeBadge(value, codesKey, codeStyle) {
        const map = (window.QP_CODES && window.QP_CODES[codesKey]) || {};
        const meta = map[String(value).trim().toUpperCase()] || {};
        const variant = meta.variant || 'neutral';
        const tooltip = meta.reason || '';
        const tooltipAttr = tooltip ? ` data-tooltip="${escapeHtml(tooltip)}"` : '';
        const codeCls = codeStyle ? ' code' : '';
        return `<span class="cell-badge${codeCls} ${variant}"${tooltipAttr}>${escapeHtml(String(value))}</span>`;
    }

    detailsCloseBtn.addEventListener('click', closeDetailsModal);
    detailsPrevBtn.addEventListener('click', () => navigateDetails(-1));
    detailsNextBtn.addEventListener('click', () => navigateDetails(1));
    detailsBackdrop.addEventListener('click', (e) => {
        if (e.target === detailsBackdrop) closeDetailsModal();
    });
    document.addEventListener('keydown', (e) => {
        if (detailsBackdrop.hidden) return;
        if (e.key === 'Escape') closeDetailsModal();
        else if (e.key === 'ArrowLeft') navigateDetails(-1);
        else if (e.key === 'ArrowRight') navigateDetails(1);
    });

    // ============================================================
    //                    Filter Popover
    // ============================================================
    const popoverEl = document.getElementById('filter-popover');
    // Local state held inside the open popover; commits to filterState/sortState on Apply.
    let popoverCtx = null; // { col, field, draftFilter, draftSort, distinctCache, searchTerm }
    let distinctReqSeq = 0;

    // Header clicks → open the popover for that column.
    theadRow.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        e.stopPropagation();
        const colKey = btn.dataset.filterCol;
        const col = COLUMNS.find((c) => c.key === colKey);
        if (!col || !col.filter) return;

        if (popoverCtx && popoverCtx.col === col) {
            closePopover();
            return;
        }
        openPopover(col, btn);
    });

    function openPopover(col, anchorEl) {
        const field = filterField(col);
        const existingFilter = filterState[field] ? { ...filterState[field] } : null;
        const existingSort =
            sortState && sortState.key === field ? { ...sortState } : null;

        popoverCtx = {
            col,
            field,
            anchorEl,
            draftFilter: existingFilter,
            draftSort: existingSort,
            searchTerm: '',
            distinctValues: [],
            distinctTotal: 0,
            distinctShown: 0,
            distinctLoading: true,
        };

        popoverEl.hidden = false;
        renderPopover();
        positionPopover(anchorEl);
        // Trigger fade-in
        // eslint-disable-next-line no-unused-expressions
        popoverEl.offsetHeight;
        popoverEl.classList.add('visible');

        if (col.filter.kind === 'text' || col.filter.kind === 'enum') {
            loadDistinct();
        }
        if (col.filter.kind === 'number' || col.filter.kind === 'text') {
            // Number-list mode + auto-focus value input
            setTimeout(() => {
                const focusEl = popoverEl.querySelector('[data-autofocus]');
                if (focusEl) focusEl.focus();
            }, 30);
        }
    }

    function closePopover() {
        popoverEl.classList.remove('visible');
        setTimeout(() => {
            if (!popoverEl.classList.contains('visible')) {
                popoverEl.hidden = true;
                popoverEl.innerHTML = '';
                popoverCtx = null;
            }
        }, 180);
    }

    function positionPopover(anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        const popoverWidth = 320;
        const margin = 12;

        // Horizontal: align with the header button, but keep inside viewport.
        let left = rect.left - 8;
        if (left + popoverWidth > window.innerWidth - margin) {
            left = window.innerWidth - popoverWidth - margin;
        }
        if (left < margin) left = margin;

        // Compute the maximum space available below vs above the button.
        const spaceBelow = window.innerHeight - rect.bottom - margin - 6;
        const spaceAbove = rect.top - margin - 6;

        // Place on whichever side has more room. Then explicitly cap the
        // body's height so the popover always fits within that space —
        // belt-and-suspenders on top of the CSS max-height.
        let top;
        let availableHeight;
        if (spaceBelow >= spaceAbove || spaceBelow >= 280) {
            // Below — preferred when there's reasonable room
            top = rect.bottom + 6;
            availableHeight = spaceBelow;
        } else {
            // Above
            availableHeight = spaceAbove;
            top = rect.top - 6; // will offset by popover height after sizing
        }

        // Apply explicit max-height to the body so content scrolls within
        // the available space (header + footer always visible).
        const header = popoverEl.querySelector('.filter-popover-header');
        const body = popoverEl.querySelector('.filter-popover-body');
        const footer = popoverEl.querySelector('.filter-popover-footer');
        const headerH = header ? header.offsetHeight : 0;
        const footerH = footer ? footer.offsetHeight : 0;
        const maxBodyH = Math.max(120, availableHeight - headerH - footerH);
        if (body) body.style.maxHeight = `${maxBodyH}px`;

        // If placing above, finalise the top now that we know body's height.
        if (top !== rect.bottom + 6) {
            const finalHeight = popoverEl.offsetHeight;
            top = rect.top - finalHeight - 6;
            if (top < margin) top = margin;
        }

        popoverEl.style.left = `${left}px`;
        popoverEl.style.top = `${top}px`;
    }

    function renderPopover() {
        if (!popoverCtx) return;
        const { col } = popoverCtx;
        const kind = col.filter.kind;

        popoverEl.innerHTML = `
            <div class="filter-popover-header">${escapeHtml(col.label)}</div>
            <div class="filter-popover-body">
                ${kind !== 'enum' ? renderSortSection(kind) : ''}
                ${renderFilterSection(kind)}
            </div>
            <div class="filter-popover-footer">
                ${
                    isFilterDirty()
                        ? '<button class="filter-link" data-action="clear-filter">Clear filter</button>'
                        : ''
                }
                <button class="filter-apply-btn" data-action="apply">Apply Filter</button>
            </div>
        `;
        attachPopoverHandlers();
        // innerHTML wipes the inline max-height we set on the body, and the
        // newly-rendered content may also change the popover's total height
        // (e.g. when the distinct-values list arrives async). Re-running the
        // positioning logic re-fits and re-anchors so the Apply button stays
        // reachable.
        if (popoverCtx.anchorEl) {
            positionPopover(popoverCtx.anchorEl);
        }
    }

    function renderSortSection(kind) {
        const labels = kind === 'number'
            ? { asc: 'Sort Smallest to Largest', desc: 'Sort Largest to Smallest' }
            : kind === 'date'
            ? { asc: 'Sort Oldest to Newest', desc: 'Sort Newest to Oldest' }
            : { asc: 'Sort A to Z', desc: 'Sort Z to A' };

        const dir = popoverCtx.draftSort ? popoverCtx.draftSort.dir : null;

        return `
            <div class="filter-sort-section">
                <button class="filter-sort-btn${dir === 'asc' ? ' active' : ''}" data-action="sort" data-dir="asc">
                    ${ICONS.sortAsc}<span>${escapeHtml(labels.asc)}</span>
                </button>
                <button class="filter-sort-btn${dir === 'desc' ? ' active' : ''}" data-action="sort" data-dir="desc">
                    ${ICONS.sortDesc}<span>${escapeHtml(labels.desc)}</span>
                </button>
            </div>
        `;
    }

    function renderFilterSection(kind) {
        switch (kind) {
            case 'text':
            case 'enum':
                return renderListFilter();
            case 'number':
                return renderNumberFilter();
            case 'date':
                return renderDateFilter();
            default:
                return '';
        }
    }

    function renderListFilter() {
        const draft = popoverCtx.draftFilter;
        // When no filter is applied, treat every visible value as implicitly
        // selected — mirrors the real state of the table (everything shown).
        const isUnfilteredDefault = !draft;
        const selected = Array.isArray(draft && draft.value) ? draft.value : [];
        const selectedSet = new Set(selected.map(String));

        let optionsHtml;
        if (popoverCtx.distinctLoading) {
            optionsHtml = `<div class="filter-loading">Loading values…</div>`;
        } else if (!popoverCtx.distinctValues.length) {
            optionsHtml = `<div class="filter-empty">No values found</div>`;
        } else {
            optionsHtml = popoverCtx.distinctValues
                .map((v) => {
                    const safe = escapeHtml(String(v));
                    const isChecked =
                        isUnfilteredDefault || selectedSet.has(String(v));
                    return `
                        <label class="filter-check">
                            <input type="checkbox" data-action="toggle-value" data-value="${safe}" ${isChecked ? 'checked' : ''}>
                            <span class="filter-check-box"></span>
                            <span class="filter-check-label">${safe}</span>
                        </label>
                    `;
                })
                .join('');
        }

        const selectedCount = isUnfilteredDefault
            ? popoverCtx.distinctTotal
            : selectedSet.size;
        const totalLabel = popoverCtx.distinctTotal
            ? `${selectedCount} / ${popoverCtx.distinctTotal}`
            : '—';

        return `
            <div class="filter-section">
                <div class="filter-section-label">Filter by Value</div>
                <div class="filter-search-wrap">
                    <span class="filter-search-icon">${ICONS.search}</span>
                    <input type="text" class="filter-search-input" placeholder="Search..." data-action="search" data-autofocus value="${escapeHtml(popoverCtx.searchTerm)}">
                </div>
                <div class="filter-actions-row">
                    <div class="filter-actions-left">
                        <button class="filter-link primary" data-action="select-all">Select All</button>
                        <button class="filter-link" data-action="clear-values">Clear</button>
                    </div>
                    <span class="filter-count">${totalLabel}</span>
                </div>
                <div class="filter-checkboxes">${optionsHtml}</div>
            </div>
        `;
    }

    function renderNumberFilter() {
        const draft = popoverCtx.draftFilter || {};
        const op = draft.op || 'eq';
        const value = draft.value != null ? String(draft.value) : '';
        const min = draft.min != null ? String(draft.min) : '';
        const max = draft.max != null ? String(draft.max) : '';

        const valueInput = op === 'between'
            ? `
                <div class="filter-row-2">
                    <input type="number" step="any" class="filter-text-input" placeholder="Min" data-action="set-min" data-autofocus value="${escapeHtml(min)}">
                    <input type="number" step="any" class="filter-text-input" placeholder="Max" data-action="set-max" value="${escapeHtml(max)}">
                </div>`
            : `<input type="number" step="any" class="filter-text-input" placeholder="Enter value" data-action="set-value" data-autofocus value="${escapeHtml(value)}">`;

        return `
            <div class="filter-section">
                <div class="filter-section-label">Condition</div>
                <select class="filter-select" data-action="set-op">
                    <option value="eq" ${op === 'eq' ? 'selected' : ''}>Equals (=)</option>
                    <option value="ne" ${op === 'ne' ? 'selected' : ''}>Not equals (≠)</option>
                    <option value="gt" ${op === 'gt' ? 'selected' : ''}>Greater than (&gt;)</option>
                    <option value="gte" ${op === 'gte' ? 'selected' : ''}>Greater or equal (≥)</option>
                    <option value="lt" ${op === 'lt' ? 'selected' : ''}>Less than (&lt;)</option>
                    <option value="lte" ${op === 'lte' ? 'selected' : ''}>Less or equal (≤)</option>
                    <option value="between" ${op === 'between' ? 'selected' : ''}>Between</option>
                </select>
                <div class="filter-section-label" style="margin-top: 14px">Value</div>
                ${valueInput}
            </div>
        `;
    }

    function renderDateFilter() {
        const draft = popoverCtx.draftFilter || {};
        const after = draft.after || '';
        const before = draft.before || '';
        return `
            <div class="filter-section">
                <div class="filter-section-label">After</div>
                <input type="date" class="filter-date-input" data-action="set-after" data-autofocus value="${escapeHtml(after)}">
                <div class="filter-section-label" style="margin-top: 14px">Before</div>
                <input type="date" class="filter-date-input" data-action="set-before" value="${escapeHtml(before)}">
            </div>
        `;
    }

    function attachPopoverHandlers() {
        popoverEl.querySelectorAll('[data-action]').forEach((el) => {
            const action = el.dataset.action;
            switch (action) {
                case 'sort':
                    el.addEventListener('click', () => {
                        const dir = el.dataset.dir;
                        if (popoverCtx.draftSort && popoverCtx.draftSort.dir === dir) {
                            popoverCtx.draftSort = null;
                        } else {
                            popoverCtx.draftSort = { key: popoverCtx.field, dir };
                        }
                        renderPopover();
                    });
                    break;
                case 'search':
                    el.addEventListener('input', debounce(() => {
                        popoverCtx.searchTerm = el.value;
                        loadDistinct();
                    }, 200));
                    break;
                case 'toggle-value':
                    el.addEventListener('change', () => {
                        const v = el.dataset.value;
                        // If draft is null, the user was looking at the
                        // default "all checked" state — materialise it into
                        // an explicit list before mutating.
                        let arr;
                        if (!popoverCtx.draftFilter) {
                            arr = popoverCtx.distinctValues.map(String);
                        } else if (Array.isArray(popoverCtx.draftFilter.value)) {
                            arr = popoverCtx.draftFilter.value.slice();
                        } else {
                            arr = [];
                        }
                        const idx = arr.findIndex((x) => String(x) === String(v));
                        if (el.checked && idx === -1) arr.push(v);
                        else if (!el.checked && idx !== -1) arr.splice(idx, 1);

                        // Re-collapse to "no filter" when everything is
                        // selected again — preserves the parity with the
                        // unfiltered default.
                        if (arr.length === popoverCtx.distinctValues.length) {
                            popoverCtx.draftFilter = null;
                        } else {
                            popoverCtx.draftFilter = { op: 'in', value: arr };
                        }
                        renderPopover();
                    });
                    break;
                case 'select-all':
                    el.addEventListener('click', () => {
                        // "Select All" === no filter (all values implicitly
                        // selected). Same visual outcome as the default state.
                        popoverCtx.draftFilter = null;
                        renderPopover();
                    });
                    break;
                case 'clear-values':
                    el.addEventListener('click', () => {
                        // "Clear" deselects every checkbox so the user can
                        // build a selection from scratch. Applying with an
                        // empty selection is treated as "no filter" by
                        // hasFilterValue() — same as Excel's behaviour.
                        popoverCtx.draftFilter = { op: 'in', value: [] };
                        renderPopover();
                    });
                    break;
                case 'set-op':
                    el.addEventListener('change', () => {
                        const op = el.value;
                        const prev = popoverCtx.draftFilter || {};
                        popoverCtx.draftFilter = { op, value: prev.value, min: prev.min, max: prev.max };
                        renderPopover();
                    });
                    break;
                case 'set-value':
                    el.addEventListener('input', () => {
                        const v = el.value;
                        const prev = popoverCtx.draftFilter || { op: 'eq' };
                        popoverCtx.draftFilter = v === '' ? null : { ...prev, value: v };
                    });
                    break;
                case 'set-min':
                    el.addEventListener('input', () => {
                        const prev = popoverCtx.draftFilter || { op: 'between' };
                        popoverCtx.draftFilter = { ...prev, op: 'between', min: el.value };
                    });
                    break;
                case 'set-max':
                    el.addEventListener('input', () => {
                        const prev = popoverCtx.draftFilter || { op: 'between' };
                        popoverCtx.draftFilter = { ...prev, op: 'between', max: el.value };
                    });
                    break;
                case 'set-after':
                    el.addEventListener('input', () => {
                        const prev = popoverCtx.draftFilter || {};
                        popoverCtx.draftFilter = { ...prev, after: el.value || undefined };
                        if (!popoverCtx.draftFilter.after && !popoverCtx.draftFilter.before) popoverCtx.draftFilter = null;
                    });
                    break;
                case 'set-before':
                    el.addEventListener('input', () => {
                        const prev = popoverCtx.draftFilter || {};
                        popoverCtx.draftFilter = { ...prev, before: el.value || undefined };
                        if (!popoverCtx.draftFilter.after && !popoverCtx.draftFilter.before) popoverCtx.draftFilter = null;
                    });
                    break;
                case 'clear-filter':
                    el.addEventListener('click', () => {
                        popoverCtx.draftFilter = null;
                        applyAndClose();
                    });
                    break;
                case 'apply':
                    el.addEventListener('click', applyAndClose);
                    break;
                default:
                    break;
            }
        });

        // Stop clicks inside the popover from bubbling to the global close
        popoverEl.addEventListener('click', stopProp, { once: true });
    }

    function stopProp(e) {
        // Re-attach (once was a one-shot above). Keep clicks contained.
        e.stopPropagation();
        popoverEl.addEventListener('click', stopProp, { once: true });
    }

    function applyAndClose() {
        if (!popoverCtx) return;
        const { field, draftFilter, draftSort } = popoverCtx;
        if (draftFilter && hasFilterValue(draftFilter, popoverCtx.col.filter.kind)) {
            filterState[field] = draftFilter;
        } else {
            delete filterState[field];
        }
        sortState = draftSort || (sortState && sortState.key === field ? null : sortState);
        currentPage = 1;
        closePopover();
        loadData();
    }

    function hasFilterValue(f, kind) {
        if (!f) return false;
        if (kind === 'text' || kind === 'enum') {
            if (f.op === 'in') return Array.isArray(f.value) && f.value.length > 0;
            return f.value != null && f.value !== '';
        }
        if (kind === 'number') {
            if (f.op === 'between') return f.min !== undefined || f.max !== undefined;
            return f.value !== undefined && f.value !== '';
        }
        if (kind === 'date') return !!(f.after || f.before);
        return false;
    }

    function isFilterDirty() {
        if (!popoverCtx) return false;
        const { field } = popoverCtx;
        return !!filterState[field] || (sortState && sortState.key === field);
    }

    async function loadDistinct() {
        if (!popoverCtx) return;
        const seq = ++distinctReqSeq;
        popoverCtx.distinctLoading = true;
        renderPopover();
        try {
            const params = new URLSearchParams({ limit: '200' });
            if (popoverCtx.searchTerm) params.set('search', popoverCtx.searchTerm);
            const res = await fetch(
                `/api/dataset/distinct/${popoverCtx.field}?${params}`,
                { headers: authHeaders() }
            );
            if (!res.ok) throw new Error('distinct fetch failed');
            const data = await res.json();
            if (seq !== distinctReqSeq || !popoverCtx) return;
            popoverCtx.distinctValues = data.values || [];
            popoverCtx.distinctTotal = data.total || 0;
            popoverCtx.distinctShown = data.shown || (data.values || []).length;
            popoverCtx.distinctLoading = false;
            renderPopover();
        } catch (e) {
            console.error(e);
            if (seq !== distinctReqSeq || !popoverCtx) return;
            popoverCtx.distinctLoading = false;
            popoverCtx.distinctValues = [];
            renderPopover();
        }
    }

    function debounce(fn, ms) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        };
    }

    // Global close listeners
    document.addEventListener('click', (e) => {
        if (popoverEl.hidden) return;
        if (popoverEl.contains(e.target)) return;
        if (e.target.closest('.filter-btn')) return; // header button handles itself
        closePopover();
    });
    document.addEventListener('keydown', (e) => {
        if (!popoverEl.hidden && e.key === 'Escape') {
            e.stopPropagation();
            closePopover();
        }
    });
    window.addEventListener('resize', () => {
        if (!popoverEl.hidden && popoverCtx) positionPopover(popoverCtx.anchorEl);
    });
    // When the table scrolls horizontally, re-anchor the popover so it follows
    // its header button.
    document.getElementById('data-table-wrap').addEventListener('scroll', () => {
        if (!popoverEl.hidden && popoverCtx) positionPopover(popoverCtx.anchorEl);
    });

    // ============================================================
    //                    Stats section
    // ============================================================
    const statsGrid = document.getElementById('stats-grid');
    const periodTabs = document.getElementById('period-tabs');

    let currentPeriod = 'all';
    let statsSeq = 0;

    async function loadStats() {
        const seq = ++statsSeq;
        statsGrid.classList.add('fade');
        try {
            const res = await fetch(`/api/dataset/stats?period=${currentPeriod}`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error('stats fetch failed');
            const stats = await res.json();
            if (seq !== statsSeq) return;
            renderStats(stats);
        } catch (e) {
            console.error('Failed to load stats', e);
        } finally {
            if (seq === statsSeq) statsGrid.classList.remove('fade');
        }
    }

    function renderStats(stats) {
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Total Transactions</div>
                <div class="stat-value">${formatInt(stats.total_transactions)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Amount</div>
                <div class="stat-value amount">${formatAmount(stats.total_amount)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Reported Range</div>
                ${renderRange(stats.reported_range)}
            </div>
            <div class="stat-card stat-card-ota">
                <div class="stat-label">Totals by OTA</div>
                <div class="ota-list">${renderStatsOtaList(stats)}</div>
            </div>
        `;
    }

    function renderRange(range) {
        if (!range || !range.earliest) {
            return '<div class="range-empty">No data yet</div>';
        }
        const earliest = formatDate(range.earliest);
        const latest = formatDate(range.latest);
        return `
            <div class="stat-range">
                <div class="range-row">
                    <span class="range-tag">From</span>
                    <span class="range-date">${escapeHtml(earliest)}</span>
                </div>
                <div class="range-row">
                    <span class="range-tag">To</span>
                    <span class="range-date">${escapeHtml(latest)}</span>
                </div>
            </div>
        `;
    }

    function renderStatsOtaList(stats) {
        const brands = ['Expedia', 'Booking', 'Agoda'];
        // Share is computed against the sum of OTA amounts only (not total
        // amount), so unattributed transactions don't skew the percentages.
        const otaTotal = brands.reduce((sum, b) => {
            const v = stats.by_ota && stats.by_ota[b];
            return sum + (v && v.amount ? v.amount : 0);
        }, 0);

        return brands
            .map((brand) => {
                const data = (stats.by_ota && stats.by_ota[brand]) || { count: 0, amount: 0 };
                const icon = (OTA_BRANDS[brand] && OTA_BRANDS[brand].icon) || '';
                const share = otaTotal > 0 ? (data.amount / otaTotal) * 100 : 0;
                const shareLabel = otaTotal > 0 ? `${share.toFixed(1)}%` : '—';
                return `
                    <div class="ota-row">
                        <span class="ota-favicon">${icon}</span>
                        <span class="ota-name">${brand}</span>
                        <span class="ota-amount">${formatAmount(data.amount)}</span>
                        <span class="ota-share">${shareLabel}</span>
                    </div>
                `;
            })
            .join('');
    }

    function formatInt(n) {
        if (n == null) return '0';
        return Number(n).toLocaleString();
    }

    periodTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.period-tab');
        if (!btn || btn.classList.contains('active')) return;
        periodTabs.querySelectorAll('.period-tab').forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        currentPeriod = btn.dataset.period;
        loadStats();
    });

    // ============== Skeleton ==============
    function renderSkeleton(rows = 8) {
        // One random-but-consistent width per column so each row looks plausible.
        const widths = COLUMNS.map(() => 40 + Math.floor(Math.random() * 50));
        const rowHtml = widths
            .map((w) => `<td><div class="skel-pill" style="width: ${w}%"></div></td>`)
            .join('');
        const trs = [];
        for (let i = 0; i < rows; i++) {
            trs.push(`<tr class="skeleton-row" style="animation-delay: ${i * 40}ms">${rowHtml}</tr>`);
        }
        tbody.innerHTML = trs.join('');
    }

    // ============== Init ==============
    renderHead();
    renderSkeleton(8);
    loadData();
    loadStats();
})();