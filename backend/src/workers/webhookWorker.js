const { redisClient, CACHE_KEYS } = require('../config/redis');
const Event = require('../models/Event');
const WebhookService = require('../services/webhookService');
const DeliveryService = require('../services/deliveryService');
const logger = require('../utils/logger');

class WebhookWorker {
  constructor() {
    this.isRunning = false;
    this.pollInterval = 2000; // 2 seconds
  }
  
  /**
   * Start the webhook worker
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Webhook worker already running');
      return;
    }
    
    this.isRunning = true;
    logger.info('Webhook worker started');
    
    this.processQueue();
  }
  
  /**
   * Stop the webhook worker
   */
  stop() {
    this.isRunning = false;
    logger.info('Webhook worker stopped');
  }
  
  /**
   * Process delivery queue
   */
  async processQueue() {
    while (this.isRunning) {
      try {
        await this.processNextEvent();
      } catch (error) {
        logger.error('Error in webhook worker:', error);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }
  }
  
  /**
   * Process next event from queue
   */
  async processNextEvent() {
    try {
      const queueKey = `${CACHE_KEYS.DELIVERY}queue`;
      const eventData = await redisClient.rpop(queueKey);
      
      if (!eventData) {
        return; // Queue is empty
      }
      
      const { eventId, eventType } = JSON.parse(eventData);
      
      logger.debug('Processing event from queue:', { eventId, eventType });
      
      // Get full event details
      const event = await Event.findById(eventId);
      if (!event) {
        logger.error('Event not found:', { eventId });
        return;
      }
      
      // Get webhooks subscribed to this event type
      const webhooks = await WebhookService.getWebhooksByEventType(eventType);
      
      if (webhooks.length === 0) {
        logger.info('No webhooks subscribed to event type:', { eventType });
        await Event.markAsProcessed(eventId);
        return;
      }
      
      logger.info('Delivering event to webhooks:', {
        eventId,
        webhookCount: webhooks.length,
      });
      
      // Deliver to all subscribed webhooks
      const deliveryPromises = webhooks.map(webhook =>
        this.deliverToWebhook(event, webhook)
      );
      
      await Promise.allSettled(deliveryPromises);
      
      // Mark event as processed
      await Event.markAsProcessed(eventId);
      
    } catch (error) {
      logger.error('Error processing event:', error);
    }
  }
  
  /**
   * Deliver event to a webhook with retry logic
   */
  async deliverToWebhook(event, webhook) {
    try {
      const result = await DeliveryService.deliverToWebhook(event, webhook);
      
      if (!result.success && result.shouldRetry) {
        await DeliveryService.scheduleRetry(event, webhook, 1);
      }
      
      return result;
    } catch (error) {
      logger.error('Error delivering to webhook:', {
        eventId: event.id,
        webhookId: webhook.id,
        error: error.message,
      });
    }
  }
}

// Create singleton instance
const webhookWorker = new WebhookWorker();

module.exports = webhookWorker;
