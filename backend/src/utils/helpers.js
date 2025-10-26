const crypto = require('crypto');

/**
 * Generate HMAC signature for webhook payload
 */
function generateHmacSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

/**
 * Verify HMAC signature
 */
function verifyHmacSignature(payload, signature, secret) {
  const expectedSignature = generateHmacSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate unique idempotency key
 */
function generateIdempotencyKey(eventType, data) {
  const hash = crypto.createHash('sha256');
  hash.update(`${eventType}:${JSON.stringify(data)}:${Date.now()}`);
  return hash.digest('hex');
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(attemptNumber, baseDelay, multiplier = 2) {
  return baseDelay * Math.pow(multiplier, attemptNumber - 1);
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeForLogging(data) {
  const sensitiveKeys = ['password', 'secret', 'token', 'api_key', 'secret_key'];
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    }
  });
  
  return sanitized;
}

/**
 * Format error for API response
 */
function formatError(error) {
  return {
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  };
}

/**
 * Validate URL format
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Generate random secret key
 */
function generateSecretKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  generateHmacSignature,
  verifyHmacSignature,
  generateIdempotencyKey,
  calculateRetryDelay,
  sanitizeForLogging,
  formatError,
  isValidUrl,
  generateSecretKey,
};