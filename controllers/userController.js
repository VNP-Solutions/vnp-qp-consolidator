const userService = require('../services/userService');

async function createUser(req, res, next) {
    try {
        const { email, first_name, last_name, password } = req.body || {};

        if (!email || !first_name || !last_name || !password) {
            return res.status(400).json({
                error: 'email, first_name, last_name and password are required',
            });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const user = await userService.createUser({ email, first_name, last_name, password });
        return res.status(201).json(user);
    } catch (err) {
        return next(err);
    }
}

async function listUsers(req, res, next) {
    try {
        const { email, sort, limit, skip } = req.query;
        const result = await userService.listUsers({
            email,
            sort,
            limit: limit ? Number(limit) : undefined,
            skip: skip ? Number(skip) : undefined,
        });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

async function getUser(req, res, next) {
    try {
        const { id } = req.params;
        if (req.userId !== id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const user = await userService.getUserById(id);
        return res.json(user);
    } catch (err) {
        return next(err);
    }
}

module.exports = { createUser, listUsers, getUser };