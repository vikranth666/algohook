const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { DELIVERY_STATUS } = require('../config/constants');

class DeliveryLog {
  /**
   * Create a delivery log entry
   */
  static async create({ eventId, webhookId, status, attemptNumber = 1, responseCode, responseBody, errorMessage }) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO delivery_logs (
          id, event_id, webhook_id, status, attempt_number, 
          response_code, response_body, error_message, 
          delivered_at, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [
        uuidv4(),
        eventId,
        webhookId,
        status,
        attemptNumber,
        responseCode,
        responseBody,
        errorMessage,
        status === DELIVERY_STATUS.SUCCESS ? new Date() : null,
      ];
      
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating delivery log:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Find logs by event ID
   */
  static async findByEventId(eventId) {
    const query = `
      SELECT dl.*, w.name as webhook_name, w.url as webhook_url
      FROM delivery_logs dl
      JOIN webhooks w ON dl.webhook_id = w.id
      WHERE dl.event_id = $1
      ORDER BY dl.created_at DESC
    `;
    const result = await pool.query(query, [eventId]);
    return result.rows;
  }
  
  /**
   * Find logs by webhook ID
   */
  static async findByWebhookId(webhookId, limit = 50, offset = 0) {
    const query = `
      SELECT dl.*, e.event_type, e.event_name
      FROM delivery_logs dl
      JOIN events e ON dl.event_id = e.id
      WHERE dl.webhook_id = $1
      ORDER BY dl.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [webhookId, limit, offset]);
    return result.rows;
  }
  
  /**
   * Find failed deliveries for retry
   */
  static async findFailedDeliveries(limit = 100) {
    const query = `
      SELECT dl.*, e.event_type, e.payload, w.url, w.secret_key
      FROM delivery_logs dl
      JOIN events e ON dl.event_id = e.id
      JOIN webhooks w ON dl.webhook_id = w.id
      WHERE dl.status = $1 
      AND w.is_active = true
      ORDER BY dl.created_at ASC
      LIMIT $2
    `;
    const result = await pool.query(query, [DELIVERY_STATUS.FAILED, limit]);
    return result.rows;
  }
  
  /**
   * Get delivery statistics
   */
  static async getStats(webhookId = null) {
    let query = `
      SELECT 
        COUNT(*) as total_deliveries,
        SUM(CASE WHEN status = '${DELIVERY_STATUS.SUCCESS}' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = '${DELIVERY_STATUS.FAILED}' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = '${DELIVERY_STATUS.PENDING}' THEN 1 ELSE 0 END) as pending,
        AVG(attempt_number) as avg_attempts
      FROM delivery_logs
    `;
    
    const values = [];
    if (webhookId) {
      query += ' WHERE webhook_id = $1';
      values.push(webhookId);
    }
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Get recent delivery logs
   */
  static async getRecent(limit = 100) {
    const query = `
      SELECT 
        dl.*,
        e.event_type,
        e.event_name,
        w.name as webhook_name,
        w.url as webhook_url
      FROM delivery_logs dl
      JOIN events e ON dl.event_id = e.id
      JOIN webhooks w ON dl.webhook_id = w.id
      ORDER BY dl.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }
  
  /**
   * Delete old logs (cleanup)
   */
  static async deleteOldLogs(daysOld = 90) {
    const query = `
      DELETE FROM delivery_logs 
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      RETURNING COUNT(*) as deleted_count
    `;
    const result = await pool.query(query);
    logger.info(`Deleted ${result.rowCount} old delivery logs`);
    return result.rowCount;
  }
}

module.exports = DeliveryLog;