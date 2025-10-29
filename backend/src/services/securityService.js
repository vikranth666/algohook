const { generateHmacSignature, verifyHmacSignature } = require('../utils/helpers');
const logger = require('../utils/logger');

class SecurityService {
  /**
   * Sign webhook payload
   */
  static signPayload(payload, secret) {
    try {
      const signature = generateHmacSignature(payload, secret);
      const timestamp = Date.now();
      
      return {
        signature,
        timestamp,
        payload,
      };
    } catch (error) {
      logger.error('Error signing payload:', error);
      throw error;
    }
  }
  
  /**
   * Verify webhook signature (for incoming webhooks if needed)
   */
  static verifySignature(payload, signature, secret) {
    try {
      return verifyHmacSignature(payload, signature, secret);
    } catch (error) {
      logger.error('Error verifying signature:', error);
      return false;
    }
  }
  
  /**
   * Generate webhook headers with signature
   */
  static generateWebhookHeaders(payload, secret) {
    const signature = generateHmacSignature(payload, secret);
    const timestamp = Date.now().toString();
    
    return {
      'Content-Type': 'application/json',
      'X-AlgoHook-Signature': signature,
      'X-AlgoHook-Timestamp': timestamp,
      'User-Agent': 'AlgoHook/1.0',
    };
  }
}

module.exports = SecurityService;
