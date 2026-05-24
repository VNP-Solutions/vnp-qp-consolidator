const XLSX = require('xlsx');
const datasetService = require('../services/datasetService');
const { HEADER_MAP } = require('../services/qpExcelService');

const HEADERS_IN_ORDER = Object.keys(HEADER_MAP);

function buildExportBuffer(rows) {
    // Header row first, then one row per record, in the QP report order so
    // re-importing the file works without any header re-mapping.
    const aoa = [HEADERS_IN_ORDER.slice()];
    for (const row of rows) {
        aoa.push(
            HEADERS_IN_ORDER.map((header) => {
                const field = HEADER_MAP[header];
                const value = row[field];
                if (value === undefined || value === null) return '';
                return value;
            })
        );
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QP Data');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function listData(req, res, next) {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const skip = req.query.skip ? Number(req.query.skip) : undefined;
        const q = req.query.q;

        const result = await datasetService.listData({
            userId: req.userId,
            limit,
            skip,
            q,
        });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

async function queryData(req, res, next) {
    try {
        const body = req.body || {};
        const result = await datasetService.queryData({
            userId: req.userId,
            filters: body.filters || {},
            sort: Array.isArray(body.sort) ? body.sort : [],
            search: body.search,
            limit: body.limit != null ? Number(body.limit) : undefined,
            skip: body.skip != null ? Number(body.skip) : undefined,
        });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

async function distinct(req, res, next) {
    try {
        const { field } = req.params;
        const { search, limit } = req.query;
        const result = await datasetService.distinctValues({
            userId: req.userId,
            field,
            search,
            limit: limit ? Number(limit) : undefined,
        });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

async function stats(req, res, next) {
    try {
        const period = req.query.period || 'all';
        const result = await datasetService.getStats({
            userId: req.userId,
            period,
        });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

async function analytics(req, res, next) {
    try {
        const period = req.query.period || 'all';
        const result = await datasetService.getAnalytics({
            userId: req.userId,
            period,
        });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

async function exportData(req, res, next) {
    try {
        const body = req.body || {};
        let rows;
        if (Array.isArray(body.ids) && body.ids.length > 0) {
            rows = await datasetService.getByIds({
                userId: req.userId,
                ids: body.ids,
            });
        } else {
            rows = await datasetService.queryAll({
                userId: req.userId,
                filters: body.filters || {},
                sort: Array.isArray(body.sort) ? body.sort : [],
                search: body.search,
            });
        }

        const buffer = buildExportBuffer(rows);
        const filename = `qp-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        );
        return res.send(buffer);
    } catch (err) {
        return next(err);
    }
}

module.exports = { listData, queryData, distinct, stats, analytics, exportData };