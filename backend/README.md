#  Webhook Event Relay System

A production-ready webhook event relay system built with Node.js, PostgreSQL, and Redis.

## Features

- ✅ Event ingestion from internal  modules
- ✅ Webhook subscription management
- ✅ Secure HMAC signature verification
- ✅ Automatic retry with exponential backoff
- ✅ Idempotency handling
- ✅ Redis caching for performance
- ✅ Comprehensive delivery logging
- ✅ Rate limiting and security
- ✅ Health monitoring endpoints

## Architecture

```
┌─────────────────┐
│  Modules│
│ (Jobs, Candidates)│
└────────┬────────┘
         │ Events
         ▼
┌─────────────────┐
│  Event Service  │
│  (Validation)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────┐
│  Redis Queue    │◄────►│PostgreSQL│
└────────┬────────┘      └──────────┘
         │
         ▼
┌─────────────────┐
│ Webhook Worker  │
│ (Background)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ External Systems│
│ (HRMS, CRM)     │
└─────────────────┘
```

## Quick Start

### 1. Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd -webhook-system/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Database Setup

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d

# Run database migrations
psql -U postgres -d _webhooks -f migrations/init.sql
```

### 4. Start Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on http://localhost:3000

## API Documentation

### Authentication

All API requests require authentication:
- **Internal services**: Use `X-Service-Token` header
- **External clients**: Use `X-Api-Key` header

### Endpoints

#### Events API

**Create Event** (Internal only)
```http
POST /api/events
X-Service-Token: your-service-token
Content-Type: application/json

{
  "eventType": "candidate.created",
  "eventName": "Candidate John Doe Created",
  "payload": {
    "candidateId": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "source": "candidates-service"
}
```

**Get Events**
```http
GET /api/events?eventType=candidate.created&limit=50&offset=0
X-Service-Token: your-service-token
```

#### Webhooks API

**Register Webhook**
```http
POST /api/webhooks
X-Api-Key: your-api-key
Content-Type: application/json

{
  "name": "HRMS Integration",
  "url": "https://hrms.example.com/webhooks",
  "eventTypes": ["candidate.created", "candidate.updated"]
}
```

**Get Webhooks**
```http
GET /api/webhooks
X-Api-Key: your-api-key
```

**Update Webhook**
```http
PUT /api/webhooks/:id
X-Api-Key: your-api-key
Content-Type: application/json

{
  "isActive": false
}
```

**Get Delivery Logs**
```http
GET /api/webhooks/:id/deliveries
X-Api-Key: your-api-key
```

**Retry Failed Delivery**
```http
POST /api/webhooks/:webhookId/retry/:eventId
X-Api-Key: your-api-key
```

#### Dashboard API

**Get Overview**
```http
GET /api/dashboard/overview
X-Api-Key: your-api-key
```

**Get Recent Deliveries**
```http
GET /api/dashboard/recent-deliveries?limit=100
X-Api-Key: your-api-key
```

**Health Check**
```http
GET /api/dashboard/health
```

## Event Types

- `job.created`
- `job.updated`
- `job.deleted`
- `candidate.created`
- `candidate.updated`
- `candidate.status_changed`
- `interview.scheduled`
- `interview.completed`
- `interview.cancelled`
- `assessment.submitted`
- `assessment.graded`

## Webhook Payload Format

When an event is delivered to your webhook, it will receive:

```json
{
  "eventId": "uuid",
  "eventType": "candidate.created",
  "eventName": "Candidate John Doe Created",
  "data": {
    "candidateId": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "timestamp": "2025-10-26T10:00:00.000Z"
}
```

### Webhook Headers

```
Content-Type: application/json
X--Signature: <hmac-sha256-signature>
X--Timestamp: <unix-timestamp>
User-Agent: -Webhook-System/1.0
```

### Signature Verification

To verify webhook authenticity:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expected = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| WEBHOOK_TIMEOUT | Request timeout (ms) | 5000 |
| WEBHOOK_MAX_RETRIES | Max retry attempts | 3 |
| WEBHOOK_RETRY_DELAY | Base retry delay (ms) | 60000 |

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Metrics
```bash
curl -H "X-Api-Key: your-key" http://localhost:3000/api/dashboard/metrics
```

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t -webhook-system .

# Run container
docker run -p 3000:3000 --env-file .env -webhook-system
```

### Production Checklist

- [ ] Set strong `API_SECRET_KEY` and `HMAC_SECRET`
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Enable production logging
- [ ] Configure database backups
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting
- [ ] Review security headers

## Troubleshooting

### Common Issues

**Database connection failed**
- Check PostgreSQL is running
- Verify credentials in .env
- Ensure database exists

**Redis connection failed**
- Check Redis is running
- Verify REDIS_HOST and REDIS_PORT

**Webhooks not delivering**
- Check webhook worker is running
- Verify target URL is accessible
- Check delivery logs for errors

## License

MIT

## Support

For issues and questions, please contact vikranthbolleddula@gmail.com