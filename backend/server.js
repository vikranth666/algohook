require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');
const webhookWorker = require('./src/workers/webhookWorker');

// Validate required environment variables
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'REDIS_HOST',
  'REDIS_PORT',
  'API_SECRET_KEY',
  'HMAC_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 AlgoHook Webhook System started on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API endpoints: http://localhost:${PORT}/api`);
  
  // Start webhook worker
  webhookWorker.start();
  logger.info('⚙️  Webhook worker started');
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Stop webhook worker
  webhookWorker.stop();
  
  // Close database connections
  const pool = require('./src/config/database');
  await pool.end();
  logger.info('Database connections closed');
  
  // Close Redis connection
  const { redisClient } = require('./src/config/redis');
  await redisClient.quit();
  logger.info('Redis connection closed');
  
  logger.info('Graceful shutdown completed');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = server;