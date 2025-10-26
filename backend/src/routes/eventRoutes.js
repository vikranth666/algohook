const express = require('express');
const router = express.Router();
const EventService = require('../services/eventService');
const { validate, eventSchema } = require('../middleware/validation');
const { internalAuth } = require('../middleware/auth');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * POST /api/events
 * Create a new event (internal services only)
 */
router.post('/', internalAuth, validate(eventSchema), async (req, res, next) => {
  try {
    const event = await EventService.createEvent(req.validatedData);
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    if (error.message.includes('Duplicate event')) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: 'Duplicate event',
        message: error.message,
      });
    }
    next(error);
  }
});

/**
 * GET /api/events
 * Get events with optional filtering
 */
router.get('/', internalAuth, async (req, res, next) => {
  try {
    const { eventType, limit = 50, offset = 0 } = req.query;
    
    const events = await EventService.getEvents({
      eventType,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    
    res.json({
      success: true,
      data: events,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: events.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/:id
 * Get specific event by ID
 */
router.get('/:id', internalAuth, async (req, res, next) => {
  try {
    const event = await EventService.getEventById(req.params.id);
    
    if (!event) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Event not found',
      });
    }
    
    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/stats
 * Get event statistics
 */
router.get('/analytics/stats', internalAuth, async (req, res, next) => {
  try {
    const stats = await EventService.getEventStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;