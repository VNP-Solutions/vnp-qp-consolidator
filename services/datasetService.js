const UploadedFile = require('../models/UploadedFile');
const QpFileData = require('../models/QpFileData');

const SEARCHABLE_FIELDS = ['order_id', 'mid', 'dba'];

// Fields that can be filtered/sorted. Maps each field → its filter kind.
// `text` and `enum` are functionally the same on the backend (string match with
// regex or $in); the distinction is purely for the frontend UI.
const FILTERABLE_FIELDS = {
    // identifiers / text
    order_id: 'text',
    transaction_id: 'text',
    mid: 'text',
    dba: 'text',
    first_name: 'text',
    last_name: 'text',
    company_name: 'text',
    email: 'text',
    phone_number: 'text',
    fax: 'text',
    address_one: 'text',
    address_two: 'text',
    city: 'text',
    state: 'text',
    zip_code: 'text',
    country: 'text',
    shipping_first_name: 'text',
    shipping_last_name: 'text',
    shipping_to_company_name: 'text',
    shipping_to_address_one: 'text',
    shipping_to_address_two: 'text',
    shipping_to_city: 'text',
    shipping_to_state: 'text',
    shipping_to_postal_code: 'text',
    shipping_to_country: 'text',
    shipping_email: 'text',
    auth_code: 'text',
    batch_id: 'text',
    processor_id: 'text',
    authentication_result: 'text',
    descriptor_dba: 'text',
    descriptor_phone_number: 'text',
    user_name: 'text',
    file_name: 'text',
    order_description: 'text',
    response_text: 'text',
    account: 'text',
    account_expiration: 'text',
    transaction_date_time_local: 'text',
    transaction_date_local: 'text',
    time: 'text',

    // numbers
    amount: 'number',

    // small-set enums (frontend renders as checkbox list)
    status: 'enum',
    response: 'enum',
    type: 'enum',
    payment_type: 'enum',
    avs_results: 'enum',
    csc_results: 'enum',
    entry_method: 'enum',
    service_type: 'enum',
    ota: 'enum',

    // real Date columns
    reported_date: 'date',
};

const SORTABLE_FIELDS = new Set(Object.keys(FILTERABLE_FIELDS).concat(['created_at']));

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCondition(kind, filter) {
    if (!filter || typeof filter !== 'object') return null;
    const { op } = filter;

    if (kind === 'text' || kind === 'enum') {
        const value = filter.value;
        if (op === 'in' && Array.isArray(value)) {
            const cleaned = value.filter((v) => v != null && v !== '');
            return cleaned.length ? { $in: cleaned } : null;
        }
        if (op === 'contains' && value) {
            return { $regex: escapeRegex(value), $options: 'i' };
        }
        if (op === 'startswith' && value) {
            return { $regex: '^' + escapeRegex(value), $options: 'i' };
        }
        if (op === 'endswith' && value) {
            return { $regex: escapeRegex(value) + '$', $options: 'i' };
        }
        if (op === 'eq' && value !== undefined && value !== '') {
            return value;
        }
        return null;
    }

    if (kind === 'number') {
        if (op === 'between') {
            const cond = {};
            const min = filter.min != null ? Number(filter.min) : NaN;
            const max = filter.max != null ? Number(filter.max) : NaN;
            if (!Number.isNaN(min)) cond.$gte = min;
            if (!Number.isNaN(max)) cond.$lte = max;
            return Object.keys(cond).length ? cond : null;
        }
        if (op === 'in' && Array.isArray(filter.value)) {
            const nums = filter.value.map(Number).filter((n) => !Number.isNaN(n));
            return nums.length ? { $in: nums } : null;
        }
        const num = Number(filter.value);
        if (Number.isNaN(num)) return null;
        switch (op) {
            case 'eq': return num;
            case 'ne': return { $ne: num };
            case 'gt': return { $gt: num };
            case 'gte': return { $gte: num };
            case 'lt': return { $lt: num };
            case 'lte': return { $lte: num };
            default: return null;
        }
    }

    if (kind === 'date') {
        const cond = {};
        if (filter.after) {
            const d = new Date(filter.after);
            if (!Number.isNaN(d.getTime())) cond.$gte = d;
        }
        if (filter.before) {
            const d = new Date(filter.before);
            if (!Number.isNaN(d.getTime())) {
                // Inclusive end-of-day: bump by 1 day, use $lt.
                const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
                cond.$lt = next;
            }
        }
        return Object.keys(cond).length ? cond : null;
    }

    return null;
}

async function getUserFileIds(userId) {
    const userFiles = await UploadedFile.find({ uploaded_by: userId })
        .select('_id')
        .lean();
    return userFiles.map((f) => f._id);
}

function buildSearchOr(search) {
    if (!search || !String(search).trim()) return null;
    const regex = { $regex: escapeRegex(String(search).trim()), $options: 'i' };
    return SEARCHABLE_FIELDS.map((field) => ({ [field]: regex }));
}

async function queryData({ userId, filters, sort, search, limit = 50, skip = 0 }) {
    const fileIds = await getUserFileIds(userId);
    if (fileIds.length === 0) {
        return { items: [], total: 0, limit, skip };
    }

    const query = { file_id: { $in: fileIds } };

    // Per-field filters
    if (filters && typeof filters === 'object') {
        for (const [field, filter] of Object.entries(filters)) {
            const kind = FILTERABLE_FIELDS[field];
            if (!kind) continue;
            const cond = buildCondition(kind, filter);
            if (cond != null) query[field] = cond;
        }
    }

    // Global search
    const orClauses = buildSearchOr(search);
    if (orClauses) query.$or = orClauses;

    // Sort
    let mongoSort = { created_at: -1 };
    if (Array.isArray(sort) && sort.length) {
        mongoSort = {};
        for (const s of sort) {
            if (!s || !SORTABLE_FIELDS.has(s.key)) continue;
            mongoSort[s.key] = s.dir === 'asc' ? 1 : -1;
        }
        if (Object.keys(mongoSort).length === 0) {
            mongoSort = { created_at: -1 };
        }
    }

    const [items, total] = await Promise.all([
        QpFileData.find(query).sort(mongoSort).skip(skip).limit(limit).lean(),
        QpFileData.countDocuments(query),
    ]);

    return { items, total, limit, skip };
}

// Keep the old simple list endpoint signature working too.
async function listData({ userId, limit, skip, q }) {
    return queryData({ userId, search: q, limit, skip });
}

async function distinctValues({ userId, field, search, limit = 200 }) {
    if (!FILTERABLE_FIELDS[field]) {
        const err = new Error('Field is not filterable');
        err.statusCode = 400;
        throw err;
    }

    const fileIds = await getUserFileIds(userId);
    if (fileIds.length === 0) {
        return { values: [], total: 0, shown: 0 };
    }

    const match = { file_id: { $in: fileIds }, [field]: { $nin: [null, ''] } };
    if (search && String(search).trim()) {
        match[field] = {
            ...match[field],
            $regex: escapeRegex(String(search).trim()),
            $options: 'i',
        };
    }

    const result = await QpFileData.aggregate([
        { $match: match },
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        {
            $facet: {
                values: [{ $limit: limit }],
                total: [{ $count: 'count' }],
            },
        },
    ]);

    const facet = result[0] || {};
    const values = (facet.values || [])
        .map((v) => v._id)
        .filter((v) => v != null && v !== '');
    const totalCount = (facet.total && facet.total[0] && facet.total[0].count) || 0;

    return {
        values,
        total: totalCount,
        shown: values.length,
    };
}

module.exports = {
    listData,
    queryData,
    distinctValues,
    SEARCHABLE_FIELDS,
    FILTERABLE_FIELDS,
};