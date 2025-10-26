const Joi = require('joi');
const { HTTP_STATUS, EVENT_TYPES } = require('../config/constants');
const logger = require('../utils/logger');

// Event creation validation schema
const eventSchema = Joi.object({
  eventType: Joi.string()
    .valid(...Object.values(EVENT_TYPES))
    .required(),
  eventName: Joi.string().max(255).required(),
  payload: Joi.object().required(),
  source: Joi.string().max(100).required(),
  idempotencyKey: Joi.string().max(255).optional(),
});

// Webhook creation validation schema
const webhookSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  eventTypes: Joi.array()
    .items(Joi.string().valid(...Object.values(EVENT_TYPES)))
    .min(1)
    .required(),
  description: Joi.string().max(500).optional(),
});

// Webhook update validation schema
const webhookUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(255).optional(),
  url: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
  eventTypes: Joi.array()
    .items(Joi.string().valid(...Object.values(EVENT_TYPES)))
    .min(1)
    .optional(),
  isActive: Joi.boolean().optional(),
  description: Joi.string().max(500).optional(),
});

/**
 * Validation middleware factory
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      logger.warn('Validation error:', { errors: error.details });
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation failed',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }
    
    req.validatedData = value;
    next();
  };
}

module.exports = {
  validate,
  eventSchema,
  webhookSchema,
  webhookUpdateSchema,
};
