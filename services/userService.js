const User = require('../models/User');

async function createUser({ email, first_name, last_name, password }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        const err = new Error('A user with this email already exists');
        err.statusCode = 409;
        throw err;
    }

    const user = await User.create({ email, first_name, last_name, password });
    return user;
}

async function listUsers({ email, sort = 'desc', limit = 50, skip = 0 } = {}) {
    const query = {};
    if (email) {
        query.email = { $regex: email, $options: 'i' };
    }

    const sortOrder = sort === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
        User.find(query).sort({ created_at: sortOrder }).skip(skip).limit(limit),
        User.countDocuments(query),
    ]);

    return { items, total, limit, skip };
}

async function getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        throw err;
    }
    return user;
}

module.exports = { createUser, listUsers, getUserById };