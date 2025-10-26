const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { generateSecretKey } = require('../utils/helpers');

class Webhook {
  /**
   * Create a new webhook subscription
   */
  static async create({ name, url, eventTypes, description }) {
    const client = await pool.connect();
    try {
      const secretKey = generateSecretKey();
      
      const query = `
        INSERT INTO webhooks (id, name, url, event_types, secret_key, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [
        uuidv4(),
        name,
        url,
        eventTypes,
        secretKey,
        true,
      ];
      
      const result = await client.query(query, values);
      logger.info('Webhook created:', { webhookId: result.rows[0].id, name });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating webhook:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Find webhook by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM webhooks WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find all active webhooks
   */
  static async findActive() {
    const query = 'SELECT * FROM webhooks WHERE is_active = true ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }
  
  /**
   * Find webhooks by event type
   */
  static async findByEventType(eventType) {
    const query = `
      SELECT * FROM webhooks 
      WHERE is_active = true 
      AND $1 = ANY(event_types)
    `;
    const result = await pool.query(query, [eventType]);
    return result.rows;
  }
  
  /**
   * Update webhook
   */
  static async update(id, updates) {
    const client = await pool.connect();
    try {
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      // Map camelCase keys to DB column names
      const keyMap = {
        isActive: 'is_active',
        name: 'name',
        url: 'url',
        // Add other columns here if needed
      };

      // Build SET clause
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          const column = keyMap[key] || key; // fallback to original key
          setClauses.push(`${column} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      });

      // If nothing to update, just return the current row
      if (setClauses.length === 0) {
        return await this.findById(id);
      }

      // Add updated_at timestamp
      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

      // Add the id as the last parameter for WHERE clause
      values.push(id);

      const query = `
        UPDATE webhooks
        SET ${setClauses.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        return null; // not found
      }

      logger.info('Webhook updated:', { webhookId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating webhook:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  
  /**
   * Delete webhook
   */
  static async delete(id) {
    const query = 'DELETE FROM webhooks WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    logger.info('Webhook deleted:', { webhookId: id });
    return result.rows[0];
  }
  
  /**
   * Toggle webhook active status
   */
  static async toggleActive(id, isActive) {
    const query = `
      UPDATE webhooks 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [isActive, id]);
    return result.rows[0];
  }
  
  /**
   * Get all webhooks with pagination
   */
  static async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT * FROM webhooks 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }
}

module.exports = Webhook;
