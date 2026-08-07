const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 5035; // Changed from 31 to 5035

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many contact requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:31',
  'http://localhost:5035', // Added localhost:5035
"https://mandkeskills.com",
    "https://www.mandkeskills.com",
  process.env.CLIENT_URL,
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Remove the problematic app.options line and let Express handle OPTIONS automatically
// Express will handle OPTIONS preflight requests automatically with cors middleware

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (optional)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Routes - Apply rate limiting to contact routes
app.use('/api/contact', limiter, contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Contact API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// VPS Running Output API
app.get('/api/vps-status', (req, res) => {
  const vpsInfo = {
    status: 'running',
    server: 'VPS Server',
    port: PORT,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    cpuCores: require('os').cpus().length,
    totalMemory: require('os').totalmem(),
    freeMemory: require('os').freemem(),
    hostname: require('os').hostname(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.json({
    success: true,
    data: vpsInfo
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Contact API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/api/health',
      contact: '/api/contact',
      vpsStatus: '/api/vps-status'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  // Check if it's a CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false, 
      message: 'CORS error: Origin not allowed' 
    });
  }
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong! Please try again later.' 
      : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🖥️  VPS Status: http://localhost:${PORT}/api/vps-status`);
  console.log(`🔒 CORS enabled for:`, allowedOrigins);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Server listening on all network interfaces (0.0.0.0)`);
});
