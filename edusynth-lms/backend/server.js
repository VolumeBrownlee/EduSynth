require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const routes = require('./routes');
const { connectDB, logger } = require('./utils');
const { globalErrorHandler, handleUncaughtExceptions, handleUnhandledRejections } = require('./middleware');
const { chatService, ragEngine } = require('./services');

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Port configuration
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',').map(o => o.trim());
app.use(cors({
  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api', routes);

// Socket.io setup
const socketOrigins = (process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173')
  .split(',').map(o => o.trim());
const io = new Server(httpServer, {
  cors: {
    origin: socketOrigins.length === 1 ? socketOrigins[0] : socketOrigins,
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const tenantId = socket.handshake.auth.tenantId;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify JWT token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.userId;
    socket.tenantId = tenantId || decoded.tenantId;
    socket.userRole = decoded.role;

    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id} - User: ${socket.userId}`);

  // Join tenant room
  socket.join(`tenant:${socket.tenantId}`);
  socket.join(`user:${socket.userId}`);

  // Handle chat messages
  socket.on('chat:message', async (data) => {
    try {
      const { sessionId, content } = data;

      // Send message and get AI response
      const response = await chatService.sendMessage(
        sessionId,
        socket.tenantId,
        socket.userId,
        content
      );

      // Emit response back to user
      socket.emit('chat:response', {
        messageId: response.messageId,
        content: response.content,
        timestamp: new Date()
      });

      // Emit typing indicator stop
      socket.emit('chat:typing', { isTyping: false });
    } catch (error) {
      logger.error('Socket chat error:', error);
      socket.emit('chat:error', {
        message: 'Failed to process message',
        error: error.message
      });
    }
  });

  // Handle typing indicator
  socket.on('chat:typing', (data) => {
    // Could broadcast to other users in same session if group chat
  });

  // Handle action triggers
  socket.on('chat:action', async (data) => {
    try {
      const { sessionId, action, params } = data;

      socket.emit('chat:typing', { isTyping: true });

      const result = await chatService.handleAction(
        sessionId,
        socket.tenantId,
        socket.userId,
        action,
        params
      );

      socket.emit('chat:action:response', {
        action,
        result: result.result
      });

      socket.emit('chat:typing', { isTyping: false });
    } catch (error) {
      logger.error('Socket action error:', error);
      socket.emit('chat:error', {
        message: 'Failed to execute action',
        error: error.message
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use(globalErrorHandler);

// Handle uncaught exceptions and unhandled rejections
handleUncaughtExceptions();
handleUnhandledRejections();

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Rebuild vector store from persisted embeddings
    ragEngine.rebuildFromDB().catch(() => {});

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`EduSynth Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Socket.io ready for connections`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  httpServer.close(() => {
    logger.info('HTTP server closed.');
    
    // Close database connection
    const { disconnectDB } = require('./utils');
    disconnectDB().then(() => {
      logger.info('Database connection closed.');
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

module.exports = { app, httpServer, io };
