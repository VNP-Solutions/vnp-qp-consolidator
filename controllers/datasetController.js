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

module.exports = { listData };