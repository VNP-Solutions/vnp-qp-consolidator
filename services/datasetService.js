const UploadedFile = require('../models/UploadedFile');
const QpFileData = require('../models/QpFileData');

const SEARCHABLE_FIELDS = ['order_id', 'mid', 'dba'];

async function listData({ userId, limit = 50, skip = 0, q }) {
    // Scope to data rows belonging to files this user owns.
    // For per-user file counts in the dozens-to-hundreds this $in is fine.
    // If we ever scale to thousands of files per user, we should either
    // denormalise `uploaded_by` onto QpFileData or use a $lookup pipeline.
    const userFiles = await UploadedFile.find({ uploaded_by: userId })
        .select('_id')
        .lean();
    const fileIds = userFiles.map((f) => f._id);

    if (fileIds.length === 0) {
        return { items: [], total: 0, limit, skip };
    }

    const query = { file_id: { $in: fileIds } };

    if (q && String(q).trim()) {
        const escaped = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = { $regex: escaped, $options: 'i' };
        query.$or = SEARCHABLE_FIELDS.map((field) => ({ [field]: regex }));
    }

    const [items, total] = await Promise.all([
        QpFileData.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        QpFileData.countDocuments(query),
    ]);

    return { items, total, limit, skip };
}

module.exports = { listData, SEARCHABLE_FIELDS };