const express = require('express');
const router = express.Router();
const WebhookService = require('../services/webhookService');
const DeliveryService = require('../services/deliveryService');
const { validate, webhookSchema, webhookUpdateSchema } = require('../middleware/validation');
const { apiKeyAuth } = require('../middleware/auth');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * POST /api/webhooks
 * Register a new webhook subscription
 */
router.post('/', apiKeyAuth, validate(webhookSchema), async (req, res, next) => {
  try {
    const webhook = await WebhookService.createWebhook(req.validatedData);
    
    // Don't expose secret key in response, but mention it's been created
    const response = { ...webhook };
    const secretKey = response.secret_key;
    response.secret_key = '***REDACTED***';
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Webhook registered successfully',
      data: response,
      secretKey: secretKey, // Only returned once during creation
      note: 'Please save the secret key securely. It will not be shown again.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/webhooks
 * Get all webhooks
 */
router.get('/', apiKeyAuth, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const webhooks = await WebhookService.getAllWebhooks(
      parseInt(limit),
      parseInt(offset)
    );
    
    // Redact secret keys
    const sanitizedWebhooks = webhooks.map(w => ({
      ...w,
      secret_key: '***REDACTED***',
    }));
    
    res.json({
      success: true,
      data: sanitizedWebhooks,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: webhooks.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/webhooks/:id
 * Get specific webhook by ID
 */
router.get('/:id', apiKeyAuth, async (req, res, next) => {
  try {
    const webhook = await WebhookService.getWebhookById(req.params.id);
    
    if (!webhook) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Webhook not found',
      });
    }
    
    // Redact secret key
    const sanitized = { ...webhook, secret_key: '***REDACTED***' };
    
    res.json({
      success: true,
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/webhooks/:id
 * Update webhook configuration
 */
router.put('/:id', apiKeyAuth, validate(webhookUpdateSchema), async (req, res, next) => {
  try {
    const webhook = await WebhookService.updateWebhook(
      req.params.id,
      req.validatedData
    );
    
    if (!webhook) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Webhook not found',
      });
    }
    
    const sanitized = { ...webhook, secret_key: '***REDACTED***' };
    
    res.json({
      success: true,
      message: 'Webhook updated successfully',
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete webhook subscription
 */
router.delete('/:id', apiKeyAuth, async (req, res, next) => {
  try {
    const webhook = await WebhookService.deleteWebhook(req.params.id);
    
    if (!webhook) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Webhook not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webhooks/:id/toggle
 * Toggle webhook active status
 */
router.post('/:id/toggle', apiKeyAuth, async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'isActive must be a boolean',
      });
    }
    
    const webhook = await WebhookService.toggleWebhook(req.params.id, isActive);
    
    if (!webhook) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Webhook not found',
      });
    }
    
    res.json({
      success: true,
      message: `Webhook ${isActive ? 'enabled' : 'disabled'} successfully`,
      data: { ...webhook, secret_key: '***REDACTED***' },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/webhooks/:id/deliveries
 * Get delivery logs for specific webhook
 */
router.get('/:id/deliveries', apiKeyAuth, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const deliveries = await DeliveryService.getWebhookDeliveryLogs(
      req.params.id,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: deliveries,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: deliveries.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/webhooks/:id/stats
 * Get delivery statistics for webhook
 */
router.get('/:id/stats', apiKeyAuth, async (req, res, next) => {
  try {
    const stats = await DeliveryService.getDeliveryStats(req.params.id);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webhooks/:webhookId/retry/:eventId
 * Manually retry failed delivery
 */
router.post('/:webhookId/retry/:eventId', apiKeyAuth, async (req, res, next) => {
  try {
    const { webhookId, eventId } = req.params;
    
    const result = await DeliveryService.retryDelivery(eventId, webhookId);

    // Only return safe data
    const safeResult = {
      eventId,
      webhookId,
      status: result.status || (result.success ? 'queued' : 'failed'),
      attempts: result.attempts || 0,
    };

    res.json({
      success: result.success,
      message: result.success ? 'Delivery queued successfully' : 'Delivery failed',
      data: safeResult,
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
