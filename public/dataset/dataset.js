(() => {
    // ============== Column config ==============
    // `type` controls cell formatting + extra cell classes.
    const COLUMNS = [
        { key: 'order_id', label: 'Reservation ID', type: 'id' },
        { key: 'mid', label: 'MID' },
        { key: 'dba', label: 'DBA' },
        { key: 'transaction_date_time_local', label: 'Trans. Date/Time' },
        { key: 'amount', label: 'Amount', type: 'amount' },
        { key: 'status', label: 'Status' },
        { key: 'transaction_id', label: 'Trans. ID' },
        { key: 'type', label: 'Type' },
        { key: 'payment_type', label: 'Payment Type' },
        { key: 'account', label: 'Account' },
        { key: 'account_expiration', label: 'Acct. Exp.' },
        { key: 'order_description', label: 'Description' },
        { key: 'time', label: 'Time' },
        { key: 'transaction_date_local', label: 'Trans. Date' },
        { key: 'response', label: 'Response' },
        { key: 'response_text', label: 'Response Text' },
        { key: 'avs_results', label: 'AVS' },
        { key: 'csc_results', label: 'CSC' },
        { key: 'auth_code', label: 'Auth Code' },
        { key: 'batch_id', label: 'Batch ID' },
        { key: 'processor_id', label: 'Processor ID' },
        { key: 'authentication_result', label: 'Auth Result' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'company_name', label: 'Company' },
        { key: 'address_one', label: 'Address 1' },
        { key: 'address_two', label: 'Address 2' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'zip_code', label: 'ZIP' },
        { key: 'country', label: 'Country' },
        { key: 'email', label: 'Email' },
        { key: 'phone_number', label: 'Phone' },
        { key: 'fax', label: 'Fax' },
        { key: 'shipping_first_name', label: 'Ship First Name' },
        { key: 'shipping_last_name', label: 'Ship Last Name' },
        { key: 'shipping_to_company_name', label: 'Ship Company' },
        { key: 'shipping_to_address_one', label: 'Ship Address 1' },
        { key: 'shipping_to_address_two', label: 'Ship Address 2' },
        { key: 'shipping_to_city', label: 'Ship City' },
        { key: 'shipping_to_state', label: 'Ship State' },
        { key: 'shipping_to_postal_code', label: 'Ship ZIP' },
        { key: 'shipping_to_country', label: 'Ship Country' },
        { key: 'shipping_email', label: 'Ship Email' },
        { key: 'user_name', label: 'User' },
        { key: 'entry_method', label: 'Entry' },
        { key: 'service_type', label: 'Service' },
        { key: 'descriptor_dba', label: 'Desc. DBA' },
        { key: 'descriptor_phone_number', label: 'Desc. Phone' },
        { key: 'reported_date', label: 'Reported', type: 'date' },
        { key: 'file_name', label: 'Source File', type: 'muted' },
        { key: 'row_number', label: 'Row #', type: 'muted' },
    ];

    const ICONS = {
        check: '<svg viewBox="0 0 16 16"><path d="M3 8L7 12L13 5"/></svg>',
        cross: '<svg viewBox="0 0 16 16"><path d="M4 4L12 12M12 4L4 12"/></svg>',
        emptyTable: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><line x1="3" y1="11" x2="21" y2="11"/><line x1="9" y1="6" x2="9" y2="20"/></svg>',
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

    function formatAmount(value) {
        if (value == null || value === '') return '—';
        const n = Number(value);
        if (!Number.isFinite(n)) return escapeHtml(String(value));
        return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function formatCell(row, col) {
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
            case 'id':
                return { html: escapeHtml(String(value)), cls: 'cell-id' };
            case 'muted':
                return { html: escapeHtml(String(value)), cls: 'cell-muted' };
            default:
                return { html: escapeHtml(String(value)), cls: '' };
        }
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

    // ============== Init ==============
    renderHead();
    loadData();
})();