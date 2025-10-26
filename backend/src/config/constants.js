module.exports = {
  // Event Types
  EVENT_TYPES: {
    JOB_CREATED: 'job.created',
    JOB_UPDATED: 'job.updated',
    JOB_DELETED: 'job.deleted',
    CANDIDATE_CREATED: 'candidate.created',
    CANDIDATE_UPDATED: 'candidate.updated',
    CANDIDATE_STATUS_CHANGED: 'candidate.status_changed',
    INTERVIEW_SCHEDULED: 'interview.scheduled',
    INTERVIEW_COMPLETED: 'interview.completed',
    INTERVIEW_CANCELLED: 'interview.cancelled',
    ASSESSMENT_SUBMITTED: 'assessment.submitted',
    ASSESSMENT_GRADED: 'assessment.graded',
  },

  // Delivery Status
  DELIVERY_STATUS: {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
    RETRYING: 'retrying',
  },

  // Webhook Configuration
  WEBHOOK_CONFIG: {
    TIMEOUT: parseInt(process.env.WEBHOOK_TIMEOUT) || 5000,
    MAX_RETRIES: parseInt(process.env.WEBHOOK_MAX_RETRIES) || 3,
    RETRY_DELAY: parseInt(process.env.WEBHOOK_RETRY_DELAY) || 60000,
    RETRY_BACKOFF_MULTIPLIER: 2,
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // API Routes
  API_ROUTES: {
    EVENTS: '/api/events',
    WEBHOOKS: '/api/webhooks',
    DASHBOARD: '/api/dashboard',
  },
};
