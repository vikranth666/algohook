const express = require('express');
const router = express.Router();
const EventService = require('../services/eventService');
const WebhookService = require('../services/webhookService');
const DeliveryService = require('../services/deliveryService');
const { apiKeyAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/dashboard/overview
 * Get dashboard overview statistics
 */
router.get('/overview', apiKeyAuth, async (req, res, next) => {
  try {
    const [eventStats, deliveryStats, activeWebhooks] = await Promise.all([
      EventService.getEventStats(),
      DeliveryService.getDeliveryStats(),
      WebhookService.getActiveWebhooks(),
    ]);
    
    res.json({
      success: true,
      data: {
        events: eventStats,
        deliveries: deliveryStats,
        activeWebhooksCount: activeWebhooks.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/recent-deliveries
 * Get recent delivery logs
 */
router.get('/recent-deliveries', apiKeyAuth, async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    
    const deliveries = await DeliveryService.getRecentDeliveries(parseInt(limit));
    
    res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/health
 * System health check
 */
router.get('/health', async (req, res) => {
  const { redisClient } = require('../config/redis');
  const pool = require('../config/database');
  
  try {
    // Check Redis
    await redisClient.ping();
    const redisStatus = 'healthy';
    
    // Check PostgreSQL
    await pool.query('SELECT 1');
    const dbStatus = 'healthy';
    
    res.json({
      success: true,
      status: 'healthy',
      services: {
        database: dbStatus,
        cache: redisStatus,
        worker: 'running',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

/**
 * GET /api/dashboard/metrics
 * Get system metrics
 */
router.get('/metrics', apiKeyAuth, async (req, res, next) => {
  try {
    const { redisClient } = require('../config/redis');
    
    // Get Redis info
    const redisInfo = await redisClient.info('stats');
    
    // Get database pool info
    const pool = require('../config/database');
    
    res.json({
      success: true,
      data: {
        redis: {
          connected: redisClient.status === 'ready',
        },
        database: {
          totalConnections: pool.totalCount,
          idleConnections: pool.idleCount,
          waitingClients: pool.waitingCount,
        },
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;