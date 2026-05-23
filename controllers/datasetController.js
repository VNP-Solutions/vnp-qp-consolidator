const datasetService = require('../services/datasetService');

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

module.exports = { listData, queryData, distinct };