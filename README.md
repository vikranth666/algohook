<<<<<<< HEAD
# algohook
a full stack
=======
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

#  Webhook System - Frontend Dashboard

A modern React dashboard for managing and monitoring the  Webhook Event Relay System.

## 🎨 Features

- **Dashboard Overview** - Real-time statistics and system health monitoring
- **Webhook Management** - Create, update, and delete webhook subscriptions
- **Event Tracking** - View all system events with filtering and search
- **Delivery Monitoring** - Track delivery status, retries, and failures
- **Statistics** - Detailed analytics for each webhook
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **ShadCN UI** - Modern component library
- **Axios** - HTTP client
- **Recharts** - Chart library
- **Lucide React** - Icon library

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/              # ShadCN UI components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── input.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── switch.jsx
│   │   │   └── label.jsx
│   │   ├── Layout.jsx       # Main layout with sidebar
│   │   ├── CreateWebhookDialog.jsx
│   │   └── WebhookDetailsDialog.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx    # Overview page
│   │   ├── Webhooks.jsx     # Webhook management
│   │   └── Events.jsx       # Events listing
│   ├── services/
│   │   └── api.js           # API client and endpoints
│   ├── lib/
│   │   └── utils.js         # Utility functions
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── .env                     # Environment variables
├── .env.example             # Environment template
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Backend server running on http://localhost:3000

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The dashboard will be available at **http://localhost:5173**

## ⚙️ Environment Configuration

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_API_KEY=-secret-key-2024-change-in-production
```

## 📦 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🎯 Features Guide

### Dashboard Page

- **System Overview**: Total deliveries, success rate, active webhooks
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Recent Deliveries**: Latest webhook delivery attempts
- **Health Status**: System health indicator

### Webhooks Page

- **Register Webhooks**: Create new webhook subscriptions
- **Event Selection**: Choose which events to subscribe to
- **Toggle Status**: Enable/disable webhooks
- **View Details**: Delivery history and statistics
- **Delete Webhooks**: Remove subscriptions

### Events Page

- **Event Listing**: View all system events
- **Search**: Filter events by name or type
- **Event Types Filter**: Quick filter by event type
- **Event Details**: View full event payload
- **Refresh**: Manual data refresh

## 🎨 UI Components

### Button
```jsx
import { Button } from '@/components/ui/button';

<Button variant="default">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
```

### Card
```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### Badge
```jsx
import { Badge } from '@/components/ui/badge';

<Badge variant="success">Active</Badge>
<Badge variant="error">Failed</Badge>
```

### Dialog
```jsx
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
    Content here
  </DialogContent>
</Dialog>
```

## 🔌 API Integration

The frontend communicates with the backend through Axios:

```javascript
// Example: Get all webhooks
import { webhooksAPI } from '@/services/api';

const response = await webhooksAPI.getAll();
const webhooks = response.data.data;

// Example: Create webhook
const newWebhook = await webhooksAPI.create({
  name: 'My Webhook',
  url: 'https://api.example.com/webhook',
  eventTypes: ['candidate.created']
});
```

### Available API Methods

**Webhooks**
- `webhooksAPI.getAll(params)`
- `webhooksAPI.getById(id)`
- `webhooksAPI.create(data)`
- `webhooksAPI.update(id, data)`
- `webhooksAPI.delete(id)`
- `webhooksAPI.toggle(id, isActive)`
- `webhooksAPI.getDeliveries(id, params)`
- `webhooksAPI.getStats(id)`
- `webhooksAPI.retry(webhookId, eventId)`

**Events**
- `eventsAPI.getAll(params)`
- `eventsAPI.getById(id)`
- `eventsAPI.create(data)`
- `eventsAPI.getStats()`

**Dashboard**
- `dashboardAPI.getOverview()`
- `dashboardAPI.getRecentDeliveries(limit)`
- `dashboardAPI.getHealth()`
- `dashboardAPI.getMetrics()`

## 🎨 Customization

### Theming

Colors are defined in `src/index.css` using CSS variables:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  /* ... more colors */
}
```

### Dark Mode

The system supports dark mode via the `.dark` class:

```jsx
// Toggle dark mode
document.documentElement.classList.toggle('dark');
```

## 🚀 Production Build

```bash
# Build for production
npm run build

# Preview build
npm run preview

# Deploy dist/ folder to your hosting service
```

### Build Output

The build creates optimized files in `dist/`:
- Minified JavaScript
- Optimized CSS
- Asset optimization
- Code splitting

## 📱 Responsive Design

The dashboard is fully responsive:

- **Desktop** (1024px+): Full sidebar navigation
- **Tablet** (768px-1023px): Collapsible sidebar
- **Mobile** (<768px): Bottom navigation

## 🧪 Testing

```bash
# Add testing library (optional)
npm install -D @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test
```

## 🔒 Security

- API keys stored in environment variables
- HTTPS-only webhook URLs enforced
- CORS handled by backend
- No sensitive data in localStorage

## 🐛 Troubleshooting

### CORS Errors
Ensure backend CORS is configured to allow http://localhost:5173

### API Connection Failed
Check that:
1. Backend is running on http://localhost:3000
2. `VITE_API_URL` in `.env` is correct
3. `VITE_API_KEY` matches backend configuration

### Components Not Rendering
Clear cache and restart dev server:
```bash
rm -rf node_modules .vite
npm install
npm run dev
```

### Build Errors
Update dependencies:
```bash
npm update
npm run build
```

## 📊 Performance

- Lazy loading for routes
- Optimized bundle size (~150KB gzipped)
- Code splitting by route
- Efficient re-renders with React hooks

## 🔄 State Management

Currently using React hooks (useState, useEffect). For larger apps, consider:
- React Context for global state
- Zustand for simple state management
- React Query for API data caching

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [ShadCN UI](https://ui.shadcn.com)
- [React Router](https://reactrouter.com)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

MIT

---

## 🎬 Quick Demo

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Open Browser**: http://localhost:5173
4. **Register Webhook**: Click "Register Webhook" button
5. **Create Event**: Use API or backend to create test event
6. **Monitor**: Watch deliveries in real-time

>>>>>>> 1b24054 (Initial commit)
