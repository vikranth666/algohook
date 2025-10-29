const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Simple API key authentication middleware
 */
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    logger.warn('Missing API key in request');
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'API key required',
    });
  }
  
  if (apiKey !== process.env.API_SECRET_KEY) {
    logger.warn('Invalid API key provided');
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Invalid API key',
    });
  }
  
  next();
}
/**
 * Internal service authentication (for AlgoHook modules)
 */
function internalAuth(req, res, next) {
  const serviceToken = req.headers['x-service-token'];
  
  if (!serviceToken || serviceToken !== process.env.API_SECRET_KEY) {
    logger.warn('Unauthorized internal service access attempt');
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Unauthorized service',
    });
  }
  
  next();
}

module.exports = { apiKeyAuth, internalAuth };