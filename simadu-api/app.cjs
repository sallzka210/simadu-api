const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi.json');

const authRoutes = require('./src/routes/authRoutes.cjs');
const pengaduanRoutes = require('./src/routes/pengaduanRoutes.cjs');
const { notFound, errorHandler } = require('./src/middleware/errorHandler.cjs');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

// Respons API tidak boleh di-cache (berisi data pribadi / token).
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

app.use('/api/auth', authRoutes);
app.use('/api/pengaduan', pengaduanRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
