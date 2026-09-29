import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import dnsPromises from 'dns/promises';
import { fileURLToPath } from 'url';

dotenv.config();

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
} catch (e) {
  // Ignore if setting DNS is not permitted
}

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

// Resilient DB Connection function with automatic SRV DNS fallback
async function initializeDatabaseConnection() {
  if (!MONGODB_URI) {
    console.log('ℹ Running with local JSON data persistence engine.');
    return;
  }

  console.log('🔄 Connecting to MongoDB Atlas cloud database...');
  let connected = false;

  // 1. Primary SRV connection attempt
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    });
    connected = true;
    console.log('✓ Connected to MongoDB Atlas database successfully (Primary SRV).');
  } catch (err) {
    console.warn(`! Primary SRV connection attempt failed (${err.message}). Attempting public DNS fallback resolution...`);
  }

  // 2. Fallback: Resolve SRV target host directly via public DNS (Google/Cloudflare)
  if (!connected) {
    try {
      const srvMatch = MONGODB_URI.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/(.*)$/);
      if (srvMatch) {
        const [, user, pass, host, rest] = srvMatch;
        const resolver = new dnsPromises.Resolver();
        resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
        const srvs = await resolver.resolveSrv('_mongodb._tcp.' + host);
        if (srvs && srvs.length > 0) {
          const targetHost = srvs[0].name;
          const dbName = rest.split('?')[0] || 'gkmetal_crm';
          const directUri = `mongodb://${user}:${pass}@${targetHost}:27017/${dbName}?ssl=true&authSource=admin&retryWrites=true&w=majority`;

          await mongoose.connect(directUri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
          });
          connected = true;
          console.log('✓ Connected to MongoDB Atlas database successfully (Direct Shard Fallback).');
        }
      }
    } catch (fallbackErr) {
      console.error('! MongoDB fallback connection failed:', fallbackErr.message);
    }
  }

  if (connected) {
    await store.syncWithMongo();
  } else {
    console.warn('! Running with local resilient cache store. Will retry MongoDB sync on background events...');
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('! MongoDB disconnected. Running with cached resilient store...');
});

mongoose.connection.on('reconnected', async () => {
  console.log('✓ MongoDB reconnected. Synchronizing state with MongoDB Atlas...');
  await store.syncWithMongo();
});

// Kick off DB Connection
initializeDatabaseConnection();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
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
