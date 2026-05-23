(() => {
    // ============== Column config ==============
    // `type` controls cell formatting + extra cell classes.
    const COLUMNS = [
        { key: 'order_id', label: 'Reservation ID', type: 'id' },
        { key: 'hotel', label: 'Hotel', type: 'hotel' },
        { key: 'amount', label: 'Amount', type: 'amount' },
        { key: 'reported_date', label: 'Reported Date', type: 'date' },
        { key: 'time', label: 'Transaction Time', type: 'time' },
        { key: 'status', label: 'Status', type: 'badge', successWhen: 'settled' },
        { key: 'response', label: 'Response', type: 'badge', successWhen: 'success' },
        { key: 'first_name', label: 'First Name' },
        { key: 'account', label: 'Card Last 4' },
        { key: 'account_expiration', label: 'Card Expiry', type: 'expiry' },
        { key: 'transaction_id', label: 'Trans. ID', type: 'copyable' },
        { key: 'response_text', label: 'Response Text' },
        { key: 'avs_results', label: 'AVS', type: 'badge', codes: 'AVS', codeStyle: true },
        { key: 'csc_results', label: 'CSC', type: 'badge', codes: 'CSC', codeStyle: true },
        { key: 'type', label: 'Type' },
        { key: 'payment_type', label: 'Payment Type' },
        { key: 'auth_code', label: 'Auth Code' },
        { key: 'batch_id', label: 'Batch ID' },
        { key: 'processor_id', label: 'Processor ID' },
        { key: 'address_one', label: 'Address 1' },
        { key: 'address_two', label: 'Address 2' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'zip_code', label: 'ZIP' },
        { key: 'country', label: 'Country' },
        { key: 'entry_method', label: 'Entry', type: 'badge', codes: 'ENTRY' },
        { key: 'service_type', label: 'Service' },
        { key: 'descriptor_dba', label: 'Desc. DBA' },
        { key: 'descriptor_phone_number', label: 'Desc. Phone' },
        { key: 'file_name', label: 'Source File', type: 'file-link' },
    ];

    const ICONS = {
        check: '<svg viewBox="0 0 16 16"><path d="M3 8L7 12L13 5"/></svg>',
        cross: '<svg viewBox="0 0 16 16"><path d="M4 4L12 12M12 4L4 12"/></svg>',
        emptyTable: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><line x1="3" y1="11" x2="21" y2="11"/><line x1="9" y1="6" x2="9" y2="20"/></svg>',
        copy: '<svg viewBox="0 0 16 16"><rect x="4.5" y="4.5" width="9" height="10.5" rx="1.4"/><path d="M9 1.5H3.5C2.67 1.5 2 2.17 2 3v9"/></svg>',
        copyCheck: '<svg viewBox="0 0 16 16"><path d="M3 8L7 12L13 5"/></svg>',
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
        theadRow.innerHTML = COLUMNS.map(
            (col) => `<th>${escapeHtml(col.label)}</th>`
        ).join('');
    }

    function renderRows(rows) {
        if (!rows.length) {
            const message = searchQuery
                ? `No rows match &ldquo;<strong>${escapeHtml(searchQuery)}</strong>&rdquo;. Try a different search.`
                : 'No QP data yet. Upload a report from the Files page to populate the dataset.';
            tbody.innerHTML = `
                <tr><td colspan="${COLUMNS.length}">
                    <div class="data-empty">
                        <div class="empty-icon">${ICONS.emptyTable}</div>
                        <div>${message}</div>
                    </div>
                </td></tr>`;
            countEl.textContent = searchQuery ? '0 matches' : '0 total';
            return;
        }
        tbody.innerHTML = '';
        const frag = document.createDocumentFragment();
        rows.forEach((row, i) => {
            const tr = document.createElement('tr');
            tr.style.animationDelay = `${Math.min(i * 18, 360)}ms`;
            tr.dataset.rowId = row._id;
            tr.innerHTML = COLUMNS.map((col) => {
                const cell = formatCell(row, col);
                const titleAttr = row[col.key] != null && row[col.key] !== ''
                    ? ` title="${escapeHtml(String(row[col.key]))}"`
                    : '';
                return `<td class="${cell.cls}"${titleAttr}>${cell.html}</td>`;
            }).join('');
            frag.appendChild(tr);
        });
        tbody.appendChild(frag);
        countEl.textContent = searchQuery
            ? `${totalRows} match${totalRows === 1 ? '' : 'es'}`
            : `${totalRows} total`;
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
        if (e.target.closest('.copy-btn, .cell-link')) return;
        const tr = e.target.closest('tr[data-row-id]');
        if (!tr) return;
        const row = currentRows.find((r) => String(r._id) === tr.dataset.rowId);
        if (!row) return;
        openDetailsModal(row);
    });

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
            const params = new URLSearchParams();
            params.set('limit', String(PAGE_SIZE));
            params.set('skip', String((currentPage - 1) * PAGE_SIZE));
            if (searchQuery) params.set('q', searchQuery);

            const res = await fetch(`/api/dataset?${params.toString()}`, {
                headers: authHeaders(),
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
        return `
            <div class="payment-card">
                <div class="payment-card-top">
                    <div class="payment-card-chip" aria-hidden="true"></div>
                    <div class="payment-card-brand">VNP</div>
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

    // ============== Init ==============
    renderHead();
    loadData();
})();