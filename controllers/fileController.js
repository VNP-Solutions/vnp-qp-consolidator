const fileService = require('../services/fileService');

async function uploadFile(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // userId still recorded as `uploaded_by` for attribution in the UI.
        const doc = await fileService.uploadFile({
            userId: req.userId,
            file: req.file,
        });
        return res.status(201).json(doc);
    } catch (err) {
        return next(err);
    }
}

async function listFiles(req, res, next) {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const skip = req.query.skip ? Number(req.query.skip) : undefined;
        const q = req.query.q;
        // Workspace-wide: any authenticated user sees all files.
        const result = await fileService.listFiles({ limit, skip, q });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

async function getFile(req, res, next) {
    try {
        const file = await fileService.getFile({ fileId: req.params.id });
        return res.json(file);
    } catch (err) {
        return next(err);
    }
}

async function parseFile(req, res, next) {
    try {
        const file = await fileService.startParse({ fileId: req.params.id });
        return res.status(202).json(file);
    } catch (err) {
        return next(err);
    }
}

async function deleteFile(req, res, next) {
    try {
        const file = await fileService.startDelete({ fileId: req.params.id });
        return res.status(202).json(file);
    } catch (err) {
        return next(err);
    }
}

module.exports = { uploadFile, listFiles, getFile, parseFile, deleteFile };
