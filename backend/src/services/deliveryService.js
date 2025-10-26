const axios = require('axios');
const DeliveryLog = require('../models/DeliveryLog');
const SecurityService = require('./securityService');
const { DELIVERY_STATUS, WEBHOOK_CONFIG } = require('../config/constants');
const { calculateRetryDelay } = require('../utils/helpers');
const logger = require('../utils/logger');

class DeliveryService {
  /**
   * Deliver event to webhook endpoint
   */
  static async deliverToWebhook(event, webhook, attemptNumber = 1) {
    try {
      logger.info('Attempting webhook delivery:', {
        eventId: event.id,
        webhookId: webhook.id,
        attempt: attemptNumber,
      });
      
      // Prepare payload
      const payload = {
        eventId: event.id,
        eventType: event.event_type,
        eventName: event.event_name,
        data: typeof event.payload === 'string' 
          ? JSON.parse(event.payload) 
          : event.payload,
        timestamp: event.created_at,
      };
      
      // Generate secure headers
      const headers = SecurityService.generateWebhookHeaders(
        payload,
        webhook.secret_key
      );
      
      // Make HTTP request
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: WEBHOOK_CONFIG.TIMEOUT,
        validateStatus: () => true, // Don't throw on any status
      });
      
      // Log delivery
      const isSuccess = response.status >= 200 && response.status < 300;
      
      await DeliveryLog.create({
        eventId: event.id,
        webhookId: webhook.id,
        status: isSuccess ? DELIVERY_STATUS.SUCCESS : DELIVERY_STATUS.FAILED,
        attemptNumber,
        responseCode: response.status,
        responseBody: JSON.stringify(response.data).substring(0, 1000),
        errorMessage: isSuccess ? null : `HTTP ${response.status}: ${response.statusText}`,
      });
      
      if (isSuccess) {
        logger.info('Webhook delivery successful:', {
          eventId: event.id,
          webhookId: webhook.id,
          status: response.status,
        });
        return { success: true, response };
      } else {
        logger.warn('Webhook delivery failed:', {
          eventId: event.id,
          webhookId: webhook.id,
          status: response.status,
          attempt: attemptNumber,
        });
        return { success: false, response, shouldRetry: this.shouldRetry(response.status, attemptNumber) };
      }
    } catch (error) {
      logger.error('Webhook delivery error:', {
        eventId: event.id,
        webhookId: webhook.id,
        error: error.message,
        attempt: attemptNumber,
      });
      
      // Log delivery failure
      await DeliveryLog.create({
        eventId: event.id,
        webhookId: webhook.id,
        status: DELIVERY_STATUS.FAILED,
        attemptNumber,
        responseCode: error.response?.status || null,
        responseBody: null,
        errorMessage: error.message,
      });
      
      return {
        success: false,
        error,
        shouldRetry: this.shouldRetry(error.response?.status, attemptNumber),
      };
    }
  }
  
  /**
   * Determine if delivery should be retried
   */
  static shouldRetry(statusCode, attemptNumber) {
    if (attemptNumber >= WEBHOOK_CONFIG.MAX_RETRIES) {
      return false;
    }
    
    // Retry on 5xx errors, timeouts, and network errors
    if (!statusCode || statusCode >= 500) {
      return true;
    }
    
    // Don't retry on 4xx errors (client errors)
    return false;
  }
  
  /**
   * Schedule retry for failed delivery
   */
  static async scheduleRetry(event, webhook, attemptNumber) {
    try {
      const delay = calculateRetryDelay(
        attemptNumber,
        WEBHOOK_CONFIG.RETRY_DELAY,
        WEBHOOK_CONFIG.RETRY_BACKOFF_MULTIPLIER
      );
      
      logger.info('Scheduling retry:', {
        eventId: event.id,
        webhookId: webhook.id,
        attempt: attemptNumber + 1,
        delayMs: delay,
      });
      
      // In production, this would use a job queue like BullMQ
      // For now, we'll use setTimeout (not ideal for production)
      setTimeout(async () => {
        await this.deliverToWebhook(event, webhook, attemptNumber + 1);
      }, delay);
      
      return { scheduled: true, delay, nextAttempt: attemptNumber + 1 };
    } catch (error) {
      logger.error('Error scheduling retry:', error);
      throw error;
    }
  }
  
  /**
   * Get delivery logs for event
   */
  static async getDeliveryLogs(eventId) {
    try {
      return await DeliveryLog.findByEventId(eventId);
    } catch (error) {
      logger.error('Error getting delivery logs:', error);
      throw error;
    }
  }
  
  /**
   * Get delivery logs for webhook
   */
  static async getWebhookDeliveryLogs(webhookId, limit = 50, offset = 0) {
    try {
      return await DeliveryLog.findByWebhookId(webhookId, limit, offset);
    } catch (error) {
      logger.error('Error getting webhook delivery logs:', error);
      throw error;
    }
  }
  
  /**
   * Get delivery statistics
   */
  static async getDeliveryStats(webhookId = null) {
    try {
      return await DeliveryLog.getStats(webhookId);
    } catch (error) {
      logger.error('Error getting delivery stats:', error);
      throw error;
    }
  }
  
  /**
   * Get recent deliveries
   */
  static async getRecentDeliveries(limit = 100) {
    try {
      return await DeliveryLog.getRecent(limit);
    } catch (error) {
      logger.error('Error getting recent deliveries:', error);
      throw error;
    }
  }
  
  /**
   * Retry failed delivery manually
   */
  static async retryDelivery(eventId, webhookId) {
    try {
      const Event = require('../models/Event');
      const Webhook = require('../models/Webhook');
      
      const event = await Event.findById(eventId);
      const webhook = await Webhook.findById(webhookId);
      
      if (!event || !webhook) {
        throw new Error('Event or webhook not found');
      }
      
      logger.info('Manual retry initiated:', { eventId, webhookId });
      
      return await this.deliverToWebhook(event, webhook, 1);
    } catch (error) {
      logger.error('Error retrying delivery:', error);
      throw error;
    }
  }
}

module.exports = DeliveryService;