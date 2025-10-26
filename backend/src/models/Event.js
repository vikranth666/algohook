const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class Event {
  /**
   * Create a new event
   */
  static async create({ eventType, eventName, payload, source, idempotencyKey }) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO events (id, event_type, event_name, payload, source, idempotency_key, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [
        uuidv4(),
        eventType,
        eventName,
        JSON.stringify(payload),
        source,
        idempotencyKey,
      ];
      
      const result = await client.query(query, values);
      logger.info('Event created:', { eventId: result.rows[0].id, eventType });
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        logger.warn('Duplicate event detected:', { idempotencyKey });
        throw new Error('Duplicate event: idempotency key already exists');
      }
      logger.error('Error creating event:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get event by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM events WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Get events by type
   */
  static async findByType(eventType, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM events 
      WHERE event_type = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [eventType, limit, offset]);
    return result.rows;
  }
  
  /**
   * Get all events with pagination
   */
  static async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT * FROM events 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }
  
  /**
   * Mark event as processed
   */
  static async markAsProcessed(id) {
    const query = `
      UPDATE events 
      SET processed_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  
  /**
   * Get event statistics
   */
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(processed_at) as processed_events,
        COUNT(*) - COUNT(processed_at) as pending_events,
        event_type,
        COUNT(*) as count
      FROM events
      GROUP BY event_type
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Event;
