import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
const clientOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean),
];

app.use(helmet());
app.use(
  cors({
    origin: [...new Set(clientOrigins)],
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Certiflow', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.code === 'LIMIT_FILE_SIZE'
    ? 413
    : err.code?.startsWith('LIMIT_')
      ? 400
      : err.status || err.statusCode || 500;
  if (statusCode >= 500) console.error(err);
  res.status(statusCode).json({
    message: statusCode < 500 ? err.message : 'Something went wrong on the server.',
  });
});

export default app;
