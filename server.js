require('dotenv').config();

const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const { connectDatabase } = require('./services/database');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const openapiSpec = require('./docs/openapi');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Documentation
app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
        customSiteTitle: 'VNP QP CONSOLIDATOR API Docs',
    })
);
app.get('/api/docs.json', (req, res) => res.json(openapiSpec));

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
});

async function start() {
    try {
        await connectDatabase();
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

start();