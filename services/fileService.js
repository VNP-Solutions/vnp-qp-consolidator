const path = require('path');
const crypto = require('crypto');

const UploadedFile = require('../models/UploadedFile');
const QpFileData = require('../models/QpFileData');
const { uploadBufferToS3, downloadBufferFromS3, deleteFromS3 } = require('./s3Service');
const {
    validateBuffer,
    parseRows,
    mapRowToDocument,
    extractReportedDate,
} = require('./qpExcelService');

const BATCH_SIZE = 250;
const PROGRESS_UPDATE_EVERY = 50;
const MAX_PARSE_ERRORS = 200;

function buildS3Key(userId, originalName) {
    const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const stamp = Date.now();
    const rand = crypto.randomBytes(4).toString('hex');
    return `qp-files/${userId}/${stamp}-${rand}-${safe}`;
}

async function uploadFile({ userId, file }) {
    // Server-side header validation as a safety net even though the frontend pre-checks.
    const headerCheck = validateBuffer(file.buffer);
    if (!headerCheck.valid) {
        const err = new Error(
            `Invalid QP report headers. Missing: ${headerCheck.missing.join(', ') || 'none'}`
        );
        err.statusCode = 400;
        err.details = headerCheck;
        throw err;
    }

    const key = buildS3Key(userId, file.originalname);
    const { url } = await uploadBufferToS3({
        buffer: file.buffer,
        key,
        contentType: file.mimetype,
    });

    const reported_date = extractReportedDate(file.originalname);

    const doc = await UploadedFile.create({
        original_name: file.originalname,
        size: file.size,
        mime_type: file.mimetype,
        s3_key: key,
        s3_url: url,
        uploaded_by: userId,
        reported_date,
        status: 'uploaded',
    });

    return doc;
}

// Workspace-wide visibility: any authenticated user can see and act on any
// file. `uploaded_by` is still recorded for attribution and shown in the UI.
async function listFiles({ limit = 50, skip = 0, q }) {
    const query = {};
    if (q && String(q).trim()) {
        const escaped = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.original_name = { $regex: escaped, $options: 'i' };
    }
    const [items, total] = await Promise.all([
        UploadedFile.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .populate('uploaded_by', 'first_name last_name email'),
        UploadedFile.countDocuments(query),
    ]);
    return { items, total, limit, skip };
}

async function getFile({ fileId }) {
    const file = await UploadedFile.findById(fileId).populate(
        'uploaded_by',
        'first_name last_name email'
    );
    if (!file) {
        const err = new Error('File not found');
        err.statusCode = 404;
        throw err;
    }
    return file;
}

async function startParse({ fileId }) {
    const file = await UploadedFile.findById(fileId);
    if (!file) {
        const err = new Error('File not found');
        err.statusCode = 404;
        throw err;
    }
    if (file.status === 'processing') {
        return file;
    }

    file.status = 'processing';
    file.rows_processed = 0;
    file.rows_failed = 0;
    file.rows_total = 0;
    file.parse_errors = [];
    await file.save();

    // Wipe any prior data rows associated with this file (safe re-parse).
    await QpFileData.deleteMany({ file_id: file._id });

    // Fire-and-forget — the request returns immediately while parsing continues in
    // the background. The client polls GET /api/files/:id for progress.
    setImmediate(() => {
        runParse(file._id).catch(async (e) => {
            console.error('Parse failed:', e);
            await UploadedFile.findByIdAndUpdate(file._id, {
                status: 'failed',
                $push: { parse_errors: { row: 0, message: e.message } },
            });
        });
    });

    return file;
}

async function runParse(fileId) {
    const file = await UploadedFile.findById(fileId);
    if (!file) return;

    const buffer = await downloadBufferFromS3(file.s3_key);
    const rows = parseRows(buffer);

    file.rows_total = rows.length;
    await file.save();

    let processed = 0;
    let failed = 0;
    const errors = [];
    let batch = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +1 for 1-indexed, +1 for header row
        try {
            const doc = mapRowToDocument(row);
            doc.file_id = file._id;
            doc.file_name = file.original_name;
            doc.file_url = file.s3_url;
            doc.row_number = rowNum;
            doc.reported_date = file.reported_date;
            batch.push(doc);

            if (batch.length >= BATCH_SIZE) {
                await QpFileData.insertMany(batch, { ordered: false });
                batch = [];
            }
        } catch (e) {
            failed++;
            if (errors.length < MAX_PARSE_ERRORS) {
                errors.push({ row: rowNum, message: e.message });
            }
        }

        processed++;

        if (processed % PROGRESS_UPDATE_EVERY === 0) {
            await UploadedFile.findByIdAndUpdate(file._id, {
                rows_processed: processed,
                rows_failed: failed,
            });
        }
    }

    if (batch.length > 0) {
        await QpFileData.insertMany(batch, { ordered: false });
    }

    await UploadedFile.findByIdAndUpdate(file._id, {
        rows_processed: processed,
        rows_failed: failed,
        parse_errors: errors,
        status: 'processed',
    });
}

async function startDelete({ fileId }) {
    const file = await UploadedFile.findById(fileId);
    if (!file) {
        const err = new Error('File not found');
        err.statusCode = 404;
        throw err;
    }
    if (file.status === 'deleting') {
        return file;
    }

    file.status = 'deleting';
    file.delete_step = 'deleting_s3';
    await file.save();

    setImmediate(() => {
        runDelete(file._id).catch(async (e) => {
            console.error('Delete failed:', e);
            await UploadedFile.findByIdAndUpdate(file._id, {
                status: 'failed',
                delete_step: 'none',
                $push: { parse_errors: { row: 0, message: `Delete failed: ${e.message}` } },
            });
        });
    });

    return file;
}

async function runDelete(fileId) {
    const file = await UploadedFile.findById(fileId);
    if (!file) return;

    // Step 1: remove the object from S3
    await UploadedFile.findByIdAndUpdate(fileId, { delete_step: 'deleting_s3' });
    try {
        await deleteFromS3(file.s3_key);
    } catch (e) {
        // If the S3 object is already gone, continue — DB cleanup still needs to run.
        if (e.name !== 'NoSuchKey' && e.$metadata?.httpStatusCode !== 404) {
            throw e;
        }
    }

    // Step 2: remove all associated QpFileData rows
    await UploadedFile.findByIdAndUpdate(fileId, { delete_step: 'deleting_data' });
    await QpFileData.deleteMany({ file_id: fileId });

    // Step 3: remove the UploadedFile record itself
    await UploadedFile.findByIdAndUpdate(fileId, { delete_step: 'deleting_file' });
    await UploadedFile.findByIdAndDelete(fileId);
}

module.exports = { uploadFile, listFiles, getFile, startParse, startDelete };