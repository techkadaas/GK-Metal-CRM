import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

import dashboardRoutes from './routes/dashboardRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { store } from './store/memoryStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Security: Disable X-Powered-By
app.disable('x-powered-by');

// CORS configuration (supports dynamic Vercel subdomains, localhost, and custom domains)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (CORS_ORIGIN === '*') return callback(null, true);

    const allowed = CORS_ORIGIN.split(',').map(s => s.trim());
    if (
      allowed.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Logging
if (NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Connection management state
let isConnecting = false;
let reconnectTimer = null;
let reconnectAttempt = 0;

async function connectToMongoDB() {
  if (!MONGODB_URI) {
    console.log('ℹ Running with local JSON data persistence engine.');
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (isConnecting) {
    return false;
  }

  isConnecting = true;
  console.log('🔄 Connecting to MongoDB Atlas cloud database...');

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority'
    });
    console.log('✓ Connected to MongoDB Atlas database successfully.');
    reconnectAttempt = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    await store.syncWithMongo();
    return true;
  } catch (err) {
    console.error('! MongoDB connection attempt failed:', err.message);
    scheduleReconnect();
    return false;
  } finally {
    isConnecting = false;
  }
}

function scheduleReconnect() {
  if (!MONGODB_URI || reconnectTimer || mongoose.connection.readyState === 1) return;

  reconnectAttempt++;
  const delayMs = Math.min(5000 * Math.pow(2, reconnectAttempt - 1), 30000);
  console.log(`⏱ Scheduling MongoDB reconnection attempt #${reconnectAttempt} in ${delayMs / 1000}s...`);

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (mongoose.connection.readyState !== 1) {
      await connectToMongoDB();
    }
  }, delayMs);
}

mongoose.connection.on('disconnected', () => {
  console.warn('! MongoDB connection lost. Triggering background reconnection...');
  scheduleReconnect();
});

mongoose.connection.on('error', (err) => {
  console.error('! Mongoose connection error event:', err.message);
});

mongoose.connection.on('reconnected', async () => {
  console.log('✓ MongoDB reconnected. Synchronizing state with MongoDB Atlas...');
  await store.syncWithMongo();
});

// Start initial DB connection attempt
connectToMongoDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const dbStatus = MONGODB_URI ? (dbStatusMap[dbState] || 'unknown') : 'not_configured';

  const isHealthy = !MONGODB_URI || dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    environment: NODE_ENV,
    system: 'GK Metal Testing Lab CRM Server',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/employees', employeeRoutes);

// Serve static client assets in production if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for non-API client routes
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const isProd = NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isProd ? {} : { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` GK METAL TESTING LAB — INVOICE CRM BACKEND READY `);
  console.log(` Mode:        ${NODE_ENV.toUpperCase()}`);
  console.log(` Listening on: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
