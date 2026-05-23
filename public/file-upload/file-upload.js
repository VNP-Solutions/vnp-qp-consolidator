(() => {
    // ============== Expected QP report headers ==============
    // Keep this in sync with services/qpExcelService.js on the backend.
    const EXPECTED_HEADERS = [
        'MID', 'DBA', 'TransactionDateTimeLocal', 'TransactionDateLocal',
        'TransactionID', 'PaymentType', 'ProcessorID', 'Type', 'Account',
        'AccountExpiration', 'OrderID', 'OrderDescription', 'Time', 'Amount',
        'Status', 'Response', 'ResponseText', 'AvsResults', 'CscResults',
        'AuthCode', 'BatchID', 'FirstName', 'LastName', 'CompanyName',
        'AddressOne', 'AddressTwo', 'City', 'State', 'ZipCode', 'Country',
        'Email', 'ShippingFirstName', 'ShippingLastName', 'ShippingToCompanyName',
        'ShippingToAddressOne', 'ShippingToAddressTwo', 'ShippingToCity',
        'ShippingToState', 'ShippingToPostalCode', 'ShippingToCountry',
        'ShippingEmail', 'PhoneNumber', 'Fax', 'UserName', 'EntryMethod',
        'ServiceType', 'DescriptorDBA', 'DescriptorPhoneNumber',
        'AuthenticationResult',
    ];

    const FILE_ICONS = {
        xlsx: '<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13l6 6M15 13l-6 6"/></svg>',
        xls:  '<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13l6 6M15 13l-6 6"/></svg>',
        csv:  '<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 14h8M8 17h5"/></svg>',
        default: '<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',
    };

    const AVATAR_PALETTE = [
        ['#FFD200', '#E0B500'],
        ['#6FA8FF', '#3D7BD9'],
        ['#4CD295', '#1F8C5A'],
        ['#FF8A65', '#D2553A'],
        ['#B084EF', '#7C50C4'],
        ['#F5A623', '#C97F11'],
    ];

    const ICONS = {
        check: '<svg viewBox="0 0 16 16"><path d="M3 8L7 12L13 5"/></svg>',
        cross: '<svg viewBox="0 0 16 16"><path d="M4 4L12 12M12 4L4 12"/></svg>',
    };

    // ============== DOM refs ==============
    const tbody = document.getElementById('files-tbody');
    const filesCount = document.getElementById('files-count');
    const searchInput = document.getElementById('search-input');
    const selectAll = document.getElementById('select-all');

    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');

    const toastEl = document.getElementById('toast');

    const modalBackdrop = document.getElementById('upload-modal');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const modalProgressBar = document.getElementById('modal-progress-bar');
    const modalProgressText = document.getElementById('modal-progress-text');
    const modalErrors = document.getElementById('modal-errors');
    const modalErrorsTitle = document.getElementById('modal-errors-title');
    const modalErrorsList = document.getElementById('modal-errors-list');
    const modalActions = document.getElementById('modal-actions');
    const modalClose = document.getElementById('modal-close');

    // ============== Auth helper ==============
    function getToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    function authHeaders() {
        return { Authorization: `Bearer ${getToken()}` };
    }

    // ============== File list rendering ==============
    const PAGE_SIZE = 20;
    let currentFiles = [];
    let totalFiles = 0;
    let currentPage = 1;
    let searchQuery = '';
    let loadSeq = 0; // guards against stale responses outpacing fresh ones
    const paginationEl = document.getElementById('files-pagination');
    const searchEl = document.getElementById('search');

    function avatarFromName(name) {
        const initials = String(name || '?')
            .split(/\s+/)
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || '?';
        const hash = Array.from(name || '?').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const palette = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
        return { initials, gradient: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)` };
    }

    function formatBytes(bytes) {
        if (!bytes && bytes !== 0) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    function formatDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}/${mm}/${dd}`;
    }

    function fileExt(name) {
        return (name.split('.').pop() || '').toLowerCase();
    }

    function uploaderDisplay(file) {
        const u = file.uploaded_by;
        if (!u) return { name: 'Unknown', avatar: avatarFromName('?') };
        if (typeof u === 'string') return { name: 'You', avatar: avatarFromName('You') };
        const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email || 'User';
        return { name, avatar: avatarFromName(name) };
    }

    function renderRows(rows) {
        if (!rows.length) {
            const message = searchQuery
                ? `No files match &ldquo;<strong>${escapeHtml(searchQuery)}</strong>&rdquo;. Try a different search.`
                : 'No files uploaded yet. Drop a QP report above to get started.';
            tbody.innerHTML = `<tr><td colspan="8"><div class="files-empty">${message}</div></td></tr>`;
            filesCount.textContent = searchQuery ? '0 matches' : '0 total';
            return;
        }
        tbody.innerHTML = '';
        rows.forEach((file, i) => {
            const ext = fileExt(file.original_name);
            const iconClass = ['xlsx', 'xls', 'csv', 'pdf'].includes(ext) ? ext : 'default';
            const icon = FILE_ICONS[iconClass] || FILE_ICONS.default;
            const uploader = uploaderDisplay(file);
            const tr = document.createElement('tr');
            tr.style.animationDelay = `${i * 35}ms`;
            tr.dataset.fileId = file._id;
            tr.innerHTML = `
                <td class="col-check">
                    <label class="ck"><input type="checkbox" class="row-check"><span></span></label>
                </td>
                <td>
                    <div class="file-cell">
                        <div class="file-icon ${iconClass}">${icon}</div>
                        <div class="file-name" title="${file.original_name}">${file.original_name}</div>
                    </div>
                </td>
                <td>${formatBytes(file.size)}</td>
                <td>${formatDate(file.reported_date)}</td>
                <td><span class="file-status ${file.status}">${statusLabel(file)}</span></td>
                <td>${formatDate(file.created_at)}</td>
                <td>
                    <div class="uploader">
                        <div class="uploader-avatar" style="background:${uploader.avatar.gradient}">${uploader.avatar.initials}</div>
                        <span class="uploader-name">${uploader.name}</span>
                    </div>
                </td>
                <td class="col-actions">
                    <div class="actions">
                        <span class="action-link delete" data-action="delete">Delete</span>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        filesCount.textContent = searchQuery
            ? `${totalFiles} match${totalFiles === 1 ? '' : 'es'}`
            : `${totalFiles} total`;
    }

    function statusLabel(file) {
        switch (file.status) {
            case 'processed':
                return file.rows_failed
                    ? `Processed (${file.rows_failed} errors)`
                    : 'Processed';
            case 'processing':
                return file.rows_total
                    ? `Processing ${file.rows_processed}/${file.rows_total}`
                    : 'Processing';
            case 'failed':
                return 'Failed';
            default:
                return 'Uploaded';
        }
    }

    async function loadFiles() {
        const seq = ++loadSeq;
        // Subtle fade while results swap.
        tbody.classList.add('loading');
        try {
            const params = new URLSearchParams();
            params.set('limit', String(PAGE_SIZE));
            params.set('skip', String((currentPage - 1) * PAGE_SIZE));
            if (searchQuery) params.set('q', searchQuery);

            const res = await fetch(`/api/files?${params.toString()}`, {
                headers: authHeaders(),
            });
            if (res.status === 401) {
                window.location.replace('/login');
                return;
            }
            const data = await res.json();

            // A newer request landed while this one was in flight — abandon it.
            if (seq !== loadSeq) return;

            // If we're past the last page (e.g. just deleted the last item on
            // the current page), drop back and re-fetch.
            if (
                data.total > 0 &&
                (data.items || []).length === 0 &&
                currentPage > 1
            ) {
                currentPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
                return loadFiles();
            }

            currentFiles = data.items || [];
            totalFiles = data.total || 0;

            // Sidebar badge: prefer pushing the unfiltered total, not the
            // search-filtered total. We only know the unfiltered total when
            // not searching; otherwise just leave the badge as-is.
            if (!searchQuery && typeof window.updateSidebarBadge === 'function') {
                window.updateSidebarBadge('files', totalFiles);
            }

            renderRows(currentFiles);
            renderPagination();
        } catch (e) {
            console.error('Failed to load files', e);
            showToast('error', 'Could not load file list.');
        } finally {
            if (seq === loadSeq) tbody.classList.remove('loading');
        }
    }

    function buildPageList(current, total) {
        // Show first, last, current ± 1, with '...' for gaps.
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
        const totalPages = Math.max(1, Math.ceil(totalFiles / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        if (totalFiles === 0) {
            paginationEl.hidden = true;
            paginationEl.innerHTML = '';
            return;
        }
        paginationEl.hidden = false;

        const startNum = (currentPage - 1) * PAGE_SIZE + 1;
        const endNum = Math.min(currentPage * PAGE_SIZE, totalFiles);

        const pages = buildPageList(currentPage, totalPages);
        const pageBtns = pages
            .map((p) => {
                if (p === '...') return '<span class="page-dots">…</span>';
                const cls = p === currentPage ? ' active' : '';
                return `<button class="page-btn${cls}" data-page="${p}">${p}</button>`;
            })
            .join('');

        paginationEl.innerHTML = `
            <div class="pagination-info">Showing ${startNum}–${endNum} of ${totalFiles}</div>
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
        const totalPages = Math.max(1, Math.ceil(totalFiles / PAGE_SIZE));
        const action = btn.dataset.action;
        if (action === 'prev') {
            if (currentPage <= 1) return;
            currentPage--;
        } else if (action === 'next') {
            if (currentPage >= totalPages) return;
            currentPage++;
        } else if (btn.dataset.page) {
            const next = Number(btn.dataset.page);
            if (next === currentPage) return;
            currentPage = next;
        } else {
            return;
        }
        loadFiles();
    });

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
                await loadFiles();
            } finally {
                searchEl.classList.remove('loading');
            }
        }, 250);
    });

    selectAll.addEventListener('change', (e) => {
        document.querySelectorAll('.row-check').forEach((cb) => { cb.checked = e.target.checked; });
    });

    // Delegate delete clicks since rows are re-rendered
    tbody.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action="delete"]');
        if (!target) return;
        const tr = target.closest('tr');
        if (!tr) return;
        const fileId = tr.dataset.fileId;
        const file = currentFiles.find((f) => f._id === fileId);
        if (!file) return;
        openDeleteModal(file);
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
        // force reflow so the transition runs
        // eslint-disable-next-line no-unused-expressions
        toastEl.offsetHeight;
        toastEl.classList.add('visible');
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('visible');
            setTimeout(() => { toastEl.hidden = true; }, 300);
        }, 4500);
    }

    // ============== Modal ==============
    function openModal() {
        resetModal();
        modalBackdrop.hidden = false;
        // eslint-disable-next-line no-unused-expressions
        modalBackdrop.offsetHeight;
        modalBackdrop.classList.add('visible');
    }

    function closeModal() {
        modalBackdrop.classList.remove('visible');
        setTimeout(() => { modalBackdrop.hidden = true; resetModal(); }, 300);
    }

    function resetModal() {
        modal.className = 'modal state-uploading';
        modalTitle.textContent = 'Uploading file';
        modalSubtitle.textContent = 'Preparing…';
        modalProgressBar.style.width = '0%';
        modalProgressText.textContent = '0%';
        modalErrors.hidden = true;
        modalErrorsList.innerHTML = '';
        modalActions.hidden = true;
    }

    function setModalState(state) {
        modal.className = `modal state-${state}`;
    }

    function setProgress(percent, label) {
        modalProgressBar.style.width = `${percent}%`;
        modalProgressText.textContent = label != null ? label : `${Math.round(percent)}%`;
    }

    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop && !modalActions.hidden) closeModal();
    });

    // ============== Header validation (client-side) ==============
    async function readHeaders(file) {
        const buffer = await file.arrayBuffer();
        // SheetJS is loaded via CDN. If it failed to load, fall back gracefully.
        if (typeof XLSX === 'undefined') {
            return { ok: false, error: 'Could not load Excel parser. Please refresh and retry.' };
        }
        try {
            const wb = XLSX.read(buffer, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            const headers = (aoa[0] || []).map((h) => String(h || '').trim());
            const headerSet = new Set(headers);
            const missing = EXPECTED_HEADERS.filter((h) => !headerSet.has(h));
            return { ok: missing.length === 0, missing, headers };
        } catch (e) {
            return { ok: false, error: 'Could not read this file as an Excel workbook.' };
        }
    }

    // ============== Upload + parse flow ==============
    async function startFlow(file) {
        // 1. Header validation
        const check = await readHeaders(file);
        if (!check.ok) {
            if (check.error) {
                showToast('error', check.error);
            } else if (check.missing && check.missing.length) {
                showToast(
                    'error',
                    `Invalid QP report format — missing ${check.missing.length} required column${check.missing.length === 1 ? '' : 's'}: ${check.missing.slice(0, 4).join(', ')}${check.missing.length > 4 ? '…' : ''}`
                );
            } else {
                showToast('error', 'Invalid QP report format.');
            }
            return;
        }

        openModal();
        modalTitle.textContent = 'Uploading file';
        modalSubtitle.textContent = file.name;
        setModalState('uploading');

        try {
            const uploaded = await uploadWithProgress(file, (pct) => setProgress(pct));
            await runParseFlow(uploaded);
        } catch (e) {
            console.error(e);
            setModalState('error');
            modalTitle.textContent = 'Something went wrong';
            modalSubtitle.textContent = e.message || 'Upload failed.';
            modalActions.hidden = false;
        }
    }

    function uploadWithProgress(file, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const form = new FormData();
            form.append('file', file);

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
            });
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        reject(new Error('Invalid server response'));
                    }
                } else {
                    let msg = 'Upload failed.';
                    try { msg = JSON.parse(xhr.responseText).error || msg; } catch {}
                    reject(new Error(msg));
                }
            });
            xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
            xhr.open('POST', '/api/files');
            xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
            xhr.send(form);
        });
    }

    async function runParseFlow(uploadedFile) {
        // Switch modal to processing
        setModalState('processing');
        modalTitle.textContent = 'Processing QP Data';
        modalSubtitle.textContent = 'Reading rows and saving to the database…';
        setProgress(0, '0 / —');

        const parseRes = await fetch(`/api/files/${uploadedFile._id}/parse`, {
            method: 'POST',
            headers: authHeaders(),
        });
        if (!parseRes.ok) {
            const err = await parseRes.json().catch(() => ({}));
            throw new Error(err.error || 'Could not start parsing.');
        }

        // Poll for status
        const finalFile = await pollUntilDone(uploadedFile._id);

        // Show success
        setModalState('success');
        const failed = finalFile.rows_failed || 0;
        const total = finalFile.rows_total || 0;
        const ok = total - failed;

        if (failed === 0) {
            modalTitle.textContent = 'All done!';
            modalSubtitle.textContent = `${ok} row${ok === 1 ? '' : 's'} processed successfully.`;
            modalActions.hidden = true;
            // Auto-close after a moment
            setTimeout(() => { closeModal(); }, 1800);
        } else {
            modalTitle.textContent = 'Done with errors';
            modalSubtitle.textContent = `${ok} of ${total} rows imported. ${failed} row${failed === 1 ? '' : 's'} failed.`;
            modalErrorsTitle.textContent = `Failed rows (${failed})`;
            modalErrorsList.innerHTML = (finalFile.parse_errors || [])
                .map((e) => `<li><strong>Row ${e.row}:</strong>${escapeHtml(e.message || '')}</li>`)
                .join('');
            modalErrors.hidden = false;
            modalActions.hidden = false;
        }

        // Refresh the file list so the new row appears.
        await loadFiles();
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    async function pollUntilDone(fileId) {
        const POLL_INTERVAL = 700;
        for (;;) {
            await sleep(POLL_INTERVAL);
            const res = await fetch(`/api/files/${fileId}`, { headers: authHeaders() });
            if (!res.ok) {
                throw new Error('Lost connection while processing.');
            }
            const file = await res.json();

            const total = file.rows_total || 0;
            const processed = file.rows_processed || 0;
            const pct = total > 0 ? (processed / total) * 100 : 5;
            setProgress(pct, total ? `${processed} / ${total} rows` : 'Reading file…');

            if (file.status === 'processed') return file;
            if (file.status === 'failed') {
                const firstErr = (file.parse_errors || [])[0];
                throw new Error(firstErr ? firstErr.message : 'Parsing failed.');
            }
        }
    }

    function sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    // ============== Delete Modal ==============
    const deleteBackdrop = document.getElementById('delete-modal');
    const deleteModal = document.getElementById('delete-modal-inner');
    const deleteTitle = document.getElementById('delete-modal-title');
    const deleteFileName = document.getElementById('delete-file-name');
    const deleteSubtitle = document.getElementById('delete-modal-subtitle');
    const deleteProgressBar = document.getElementById('delete-progress-bar');
    const deleteProgressText = document.getElementById('delete-progress-text');
    const deleteConfirmActions = document.getElementById('delete-confirm-actions');
    const deleteCloseActions = document.getElementById('delete-close-actions');
    const deleteCancel = document.getElementById('delete-cancel');
    const deleteConfirm = document.getElementById('delete-confirm');
    const deleteClose = document.getElementById('delete-close');

    let pendingDelete = null;

    function openDeleteModal(file) {
        pendingDelete = file;
        resetDeleteModal();
        deleteFileName.textContent = file.original_name;
        deleteBackdrop.hidden = false;
        // eslint-disable-next-line no-unused-expressions
        deleteBackdrop.offsetHeight;
        deleteBackdrop.classList.add('visible');
    }

    function closeDeleteModal() {
        deleteBackdrop.classList.remove('visible');
        setTimeout(() => {
            deleteBackdrop.hidden = true;
            resetDeleteModal();
            pendingDelete = null;
        }, 300);
    }

    function resetDeleteModal() {
        deleteModal.className = 'modal state-confirm';
        deleteTitle.textContent = 'Delete this file?';
        deleteSubtitle.innerHTML =
            `You're about to delete <strong id="delete-file-name">${pendingDelete ? escapeHtml(pendingDelete.original_name) : 'this file'}</strong>. This will also remove the file from storage and every parsed data row associated with it.<strong style="display:block;margin-top:6px;color:#FF8A8A;">This action cannot be undone.</strong>`;
        deleteProgressBar.style.width = '0%';
        deleteProgressText.textContent = '';
        deleteConfirmActions.hidden = false;
        deleteCloseActions.hidden = true;
    }

    function setDeleteState(state) {
        deleteModal.className = `modal state-${state}`;
    }

    deleteCancel.addEventListener('click', closeDeleteModal);
    deleteClose.addEventListener('click', closeDeleteModal);
    deleteBackdrop.addEventListener('click', (e) => {
        // Allow backdrop click to close only when in confirm or success/error states
        if (e.target !== deleteBackdrop) return;
        if (deleteModal.classList.contains('state-processing')) return;
        closeDeleteModal();
    });

    deleteConfirm.addEventListener('click', async () => {
        if (!pendingDelete) return;
        const file = pendingDelete;

        // Switch to processing state
        setDeleteState('processing');
        deleteConfirmActions.hidden = true;
        deleteTitle.textContent = 'Deleting file';
        deleteSubtitle.textContent = file.original_name;
        deleteProgressBar.style.width = '5%';
        deleteProgressText.textContent = 'Starting…';

        try {
            const res = await fetch(`/api/files/${file._id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            if (!res.ok && res.status !== 404) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Could not start delete.');
            }

            // Poll until the file is gone (404) or fails.
            await pollUntilDeleted(file._id);

            setDeleteState('success');
            deleteTitle.textContent = 'Deleted';
            deleteSubtitle.textContent = `${file.original_name} has been removed.`;
            setTimeout(() => closeDeleteModal(), 1500);

            await loadFiles();
        } catch (e) {
            console.error(e);
            setDeleteState('error');
            deleteTitle.textContent = 'Delete failed';
            deleteSubtitle.textContent = e.message || 'Something went wrong while deleting.';
            deleteCloseActions.hidden = false;
        }
    });

    const DELETE_STEP_META = {
        deleting_s3: { pct: 25, label: 'Removing from storage…' },
        deleting_data: { pct: 60, label: 'Removing parsed data rows…' },
        deleting_file: { pct: 90, label: 'Finalising…' },
    };

    async function pollUntilDeleted(fileId) {
        const POLL_INTERVAL = 350;
        for (;;) {
            await sleep(POLL_INTERVAL);
            const res = await fetch(`/api/files/${fileId}`, { headers: authHeaders() });
            if (res.status === 404) {
                deleteProgressBar.style.width = '100%';
                deleteProgressText.textContent = 'Done';
                return;
            }
            if (!res.ok) {
                throw new Error('Lost connection while deleting.');
            }
            const file = await res.json();
            if (file.status === 'failed') {
                const last = (file.parse_errors || []).slice(-1)[0];
                throw new Error(last ? last.message : 'Delete failed.');
            }
            const meta = DELETE_STEP_META[file.delete_step];
            if (meta) {
                deleteProgressBar.style.width = `${meta.pct}%`;
                deleteProgressText.textContent = meta.label;
            }
        }
    }

    // ============== Dropzone interactions ==============
    dropzone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (evt === 'dragleave' && dropzone.contains(e.relatedTarget)) return;
            dropzone.classList.remove('drag-over');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length) startFlow(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length) startFlow(files[0]);
        fileInput.value = '';
    });

    // ============== Init ==============
    // Honour an incoming ?q=<query> param — e.g. when navigated to from the
    // Dataset page's Source File link. Pre-fills the search box and filters
    // the list to that filename.
    const incomingQ = new URLSearchParams(window.location.search).get('q');
    if (incomingQ) {
        searchInput.value = incomingQ;
        searchQuery = incomingQ;
    }
    loadFiles();
})();