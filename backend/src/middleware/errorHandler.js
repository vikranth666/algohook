const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');
const { formatError } = require('../utils/helpers');

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(formatError(err));
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(formatError(err));
  }
  
  // Default error response
  res.status(err.statusCode || HTTP_STATUS.INTERNAL_ERROR).json({
    error: {
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: 'Resource not found',
    path: req.path,
  });
}

module.exports = { errorHandler, notFoundHandler };
