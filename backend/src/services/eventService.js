const Event = require('../models/Event');
const { redisClient, CACHE_KEYS, CACHE_TTL } = require('../config/redis');
const { generateIdempotencyKey } = require('../utils/helpers');
const logger = require('../utils/logger');

class EventService {
  /**
   * Create and publish a new event
   */
  static async createEvent({ eventType, eventName, payload, source, idempotencyKey }) {
    try {
      // Generate idempotency key if not provided
      if (!idempotencyKey) {
        idempotencyKey = generateIdempotencyKey(eventType, payload);
      }
      
      // Check cache for duplicate
      const cacheKey = `${CACHE_KEYS.EVENT}${idempotencyKey}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        logger.warn('Duplicate event detected in cache:', { idempotencyKey });
        return JSON.parse(cached);
      }
      
      // Create event in database
      const event = await Event.create({
        eventType,
        eventName,
        payload,
        source,
        idempotencyKey,
      });
      
      // Cache the event
      await redisClient.setex(
        cacheKey,
        CACHE_TTL.EVENT,
        JSON.stringify(event)
      );
      
      // Publish to delivery queue
      await this.publishEventForDelivery(event);
      
      logger.info('Event created and queued for delivery:', { 
        eventId: event.id, 
        eventType 
      });
      
      return event;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
  }
  
  /**
   * Publish event to delivery queue
   */
  static async publishEventForDelivery(event) {
    try {
      const queueKey = `${CACHE_KEYS.DELIVERY}queue`;
      await redisClient.lpush(queueKey, JSON.stringify({
        eventId: event.id,
        eventType: event.event_type,
        payload: event.payload,
        timestamp: Date.now(),
      }));
      
      logger.debug('Event published to delivery queue:', { eventId: event.id });
    } catch (error) {
      logger.error('Error publishing event to queue:', error);
      throw error;
    }
  }
  
  /**
   * Get event by ID with caching
   */
  static async getEventById(eventId) {
    try {
      const cacheKey = `${CACHE_KEYS.EVENT}id:${eventId}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const event = await Event.findById(eventId);
      
      if (event) {
        await redisClient.setex(
          cacheKey,
          CACHE_TTL.EVENT,
          JSON.stringify(event)
        );
      }
      
      return event;
    } catch (error) {
      logger.error('Error getting event:', error);
      throw error;
    }
  }
  
  /**
   * Get events with pagination
   */
  static async getEvents({ eventType, limit = 50, offset = 0 }) {
    try {
      if (eventType) {
        return await Event.findByType(eventType, limit, offset);
      }
      return await Event.findAll(limit, offset);
    } catch (error) {
      logger.error('Error fetching events:', error);
      throw error;
    }
  }
  
  /**
   * Get event statistics
   */
  static async getEventStats() {
    try {
      return await Event.getStats();
    } catch (error) {
      logger.error('Error fetching event stats:', error);
      throw error;
    }
  }
}

module.exports = EventService;
