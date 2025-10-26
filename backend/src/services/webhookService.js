const Webhook = require('../models/Webhook');
const { redisClient, CACHE_KEYS, CACHE_TTL } = require('../config/redis');
const logger = require('../utils/logger');

class WebhookService {
  /**
   * Create new webhook subscription
   */
  static async createWebhook(webhookData) {
    try {
      const webhook = await Webhook.create(webhookData);
      
      // Invalidate active webhooks cache
      await this.invalidateActiveWebhooksCache();
      
      logger.info('Webhook subscription created:', { 
        webhookId: webhook.id,
        name: webhook.name 
      });
      
      return webhook;
    } catch (error) {
      logger.error('Error creating webhook:', error);
      throw error;
    }
  }
  
  /**
   * Get webhook by ID with caching
   */
  static async getWebhookById(webhookId) {
    try {
      const cacheKey = `${CACHE_KEYS.WEBHOOK}${webhookId}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const webhook = await Webhook.findById(webhookId);
      
      if (webhook) {
        await redisClient.setex(
          cacheKey,
          CACHE_TTL.WEBHOOK,
          JSON.stringify(webhook)
        );
      }
      
      return webhook;
    } catch (error) {
      logger.error('Error getting webhook:', error);
      throw error;
    }
  }
  
  /**
   * Get active webhooks with caching
   */
  static async getActiveWebhooks() {
    try {
      const cacheKey = CACHE_KEYS.ACTIVE_WEBHOOKS;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const webhooks = await Webhook.findActive();
      
      await redisClient.setex(
        cacheKey,
        CACHE_TTL.ACTIVE_WEBHOOKS,
        JSON.stringify(webhooks)
      );
      
      return webhooks;
    } catch (error) {
      logger.error('Error getting active webhooks:', error);
      throw error;
    }
  }
  
  /**
   * Get webhooks subscribed to specific event type
   */
  static async getWebhooksByEventType(eventType) {
    try {
      const cacheKey = `${CACHE_KEYS.WEBHOOK}event:${eventType}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const webhooks = await Webhook.findByEventType(eventType);
      
      await redisClient.setex(
        cacheKey,
        CACHE_TTL.WEBHOOK,
        JSON.stringify(webhooks)
      );
      
      return webhooks;
    } catch (error) {
      logger.error('Error getting webhooks by event type:', error);
      throw error;
    }
  }
  
  /**
   * Update webhook
   */
  static async updateWebhook(webhookId, updates) {
    try {
      const webhook = await Webhook.update(webhookId, updates);
      
      // Invalidate caches
      await redisClient.del(`${CACHE_KEYS.WEBHOOK}${webhookId}`);
      await this.invalidateActiveWebhooksCache();
      
      logger.info('Webhook updated:', { webhookId });
      
      return webhook;
    } catch (error) {
      logger.error('Error updating webhook:', error);
      throw error;
    }
  }
  
  /**
   * Delete webhook
   */
  static async deleteWebhook(webhookId) {
    try {
      const webhook = await Webhook.delete(webhookId);
      
      // Invalidate caches
      await redisClient.del(`${CACHE_KEYS.WEBHOOK}${webhookId}`);
      await this.invalidateActiveWebhooksCache();
      
      logger.info('Webhook deleted:', { webhookId });
      
      return webhook;
    } catch (error) {
      logger.error('Error deleting webhook:', error);
      throw error;
    }
  }
  
  /**
   * Toggle webhook active status
   */
  static async toggleWebhook(webhookId, isActive) {
    try {
      const webhook = await Webhook.toggleActive(webhookId, isActive);
      
      // Invalidate caches
      await redisClient.del(`${CACHE_KEYS.WEBHOOK}${webhookId}`);
      await this.invalidateActiveWebhooksCache();
      
      logger.info('Webhook toggled:', { webhookId, isActive });
      
      return webhook;
    } catch (error) {
      logger.error('Error toggling webhook:', error);
      throw error;
    }
  }
  
  /**
   * Get all webhooks with pagination
   */
  static async getAllWebhooks(limit = 50, offset = 0) {
    try {
      return await Webhook.findAll(limit, offset);
    } catch (error) {
      logger.error('Error getting all webhooks:', error);
      throw error;
    }
  }
  
  /**
   * Invalidate active webhooks cache
   */
  static async invalidateActiveWebhooksCache() {
    try {
      await redisClient.del(CACHE_KEYS.ACTIVE_WEBHOOKS);
      
      // Also invalidate event type specific caches
      const keys = await redisClient.keys(`${CACHE_KEYS.WEBHOOK}event:*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }
}

module.exports = WebhookService;
