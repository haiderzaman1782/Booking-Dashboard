# Booking Dashboard - AI Voice System

> Intelligent booking management platform with integrated AI voice capabilities for automated reservation handling and customer interaction.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://booking-dashboard-rho.vercel.app/)
[![Vercel](https://img.shields.io/badge/deployed-vercel-black)](https://vercel.com)

---

## Introduction

The Booking Dashboard is an advanced reservation management system that combines traditional dashboard functionality with AI-powered voice interaction capabilities. The platform enables businesses to automate booking processes, manage reservations efficiently, and provide seamless customer experiences through natural language voice interactions.

### Key Capabilities

**AI Voice Integration**
- Natural language processing for voice-based bookings
- Automated customer interaction via AI voice assistant
- Real-time booking confirmation through voice interface
- Multi-language voice recognition support

**Dashboard Management**
- Centralized reservation oversight
- Real-time availability tracking
- Customer booking history and analytics
- Automated scheduling and conflict resolution

**Business Intelligence**
- Booking trends and analytics
- Revenue tracking and forecasting
- Customer behavior insights
- Performance metrics and KPIs

### Use Cases

- Restaurant table reservations
- Hotel room bookings
- Service appointment scheduling
- Event ticket management
- Healthcare appointment booking
- Salon and spa reservations

---

## Technology Stack

### Frontend
```
React.js / Next.js    → Modern UI framework
JavaScript/TypeScript → Application logic
Tailwind CSS          → Utility-first styling
Chart.js / Recharts   → Data visualization
Axios                 → HTTP client
```

### Backend
```
Node.js               → Server runtime
Express.js            → Web framework
RESTful API           → API architecture
JWT                   → Authentication tokens
```

### AI Voice System
```
Speech Recognition    → Voice-to-text conversion
Natural Language Processing → Intent recognition
Text-to-Speech (TTS) → Voice response generation
AI Engine             → Conversation management
```

### Database
```
PostgreSQL / MongoDB  → Primary data storage
Redis (Optional)      → Caching layer
```

### Deployment
```
Vercel                → Frontend hosting
Cloud Infrastructure  → Backend services
CDN                   → Static asset delivery
```

---

## API Reference

### Authentication Endpoints

```http
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/verify
```

**Example Request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Example Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

---

### Booking Endpoints

```http
GET    /api/bookings              # List all bookings
POST   /api/bookings              # Create new booking
GET    /api/bookings/:id          # Get booking details
PUT    /api/bookings/:id          # Update booking
DELETE /api/bookings/:id          # Cancel booking
GET    /api/bookings/availability # Check availability
```

**Create Booking Request:**
```json
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "cust_123",
  "serviceType": "table_reservation",
  "date": "2026-02-15",
  "time": "19:00",
  "duration": 120,
  "guests": 4,
  "specialRequests": "Window seating preferred"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "book_456",
    "bookingNumber": "BK-2026-0001",
    "status": "confirmed",
    "customer": {...},
    "date": "2026-02-15",
    "time": "19:00",
    "createdAt": "2026-01-21T10:30:00Z"
  }
}
```

---

### AI Voice Endpoints

```http
POST   /api/voice/start-session   # Initialize voice session
POST   /api/voice/process          # Process voice input
POST   /api/voice/confirm          # Confirm booking via voice
GET    /api/voice/session/:id      # Get session status
DELETE /api/voice/session/:id      # End voice session
```

**Process Voice Input:**
```json
POST /api/voice/process
Content-Type: application/json

{
  "sessionId": "vs_789",
  "audioData": "base64_encoded_audio",
  "context": {
    "previousIntent": "booking_inquiry",
    "conversationHistory": [...]
  }
}
```

**Voice Response:**
```json
{
  "success": true,
  "transcript": "I'd like to book a table for 4 people tomorrow at 7 PM",
  "intent": "create_booking",
  "entities": {
    "guests": 4,
    "date": "2026-01-22",
    "time": "19:00"
  },
  "response": {
    "text": "I found availability for 4 guests tomorrow at 7 PM. Would you like to confirm this reservation?",
    "audioUrl": "https://cdn.example.com/response_audio.mp3"
  },
  "nextAction": "await_confirmation"
}
```

---

### Analytics Endpoints

```http
GET    /api/analytics/dashboard    # Dashboard statistics
GET    /api/analytics/bookings     # Booking metrics
GET    /api/analytics/revenue      # Revenue reports
GET    /api/analytics/customers    # Customer insights
```

**Dashboard Statistics Response:**
```json
{
  "success": true,
  "data": {
    "todayBookings": 45,
    "upcomingBookings": 128,
    "canceledBookings": 3,
    "revenue": {
      "today": 2450.00,
      "week": 18900.00,
      "month": 78600.00
    },
    "occupancyRate": 87.5,
    "trends": {
      "weekOverWeek": 12.3,
      "monthOverMonth": 8.7
    }
  }
}
```

---

### Customer Endpoints

```http
GET    /api/customers              # List customers
POST   /api/customers              # Create customer
GET    /api/customers/:id          # Get customer details
PUT    /api/customers/:id          # Update customer
GET    /api/customers/:id/history  # Booking history
```

---

### Availability Endpoints

```http
GET    /api/availability/check     # Check specific time slot
GET    /api/availability/calendar  # Get monthly availability
POST   /api/availability/block     # Block time slots
DELETE /api/availability/unblock   # Unblock time slots
```

**Check Availability Request:**
```json
GET /api/availability/check?date=2026-02-15&time=19:00&guests=4&duration=120
```

**Response:**
```json
{
  "success": true,
  "available": true,
  "alternatives": [
    {
      "time": "18:30",
      "available": true
    },
    {
      "time": "19:30",
      "available": true
    }
  ],
  "capacity": {
    "total": 50,
    "booked": 32,
    "available": 18
  }
}
```

---

### Notification Endpoints

```http
POST   /api/notifications/send     # Send notification
GET    /api/notifications/:bookingId # Get booking notifications
PUT    /api/notifications/:id/read # Mark as read
```

---

## Installation & Setup

### Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | ≥18.0.0 | Runtime environment |
| npm/yarn | Latest | Package manager |
| PostgreSQL | ≥14.0 | Database server |

---

### Installation Steps

**1. Clone Repository**
```bash
git clone <repository-url>
cd booking-dashboard
```

**2. Install Dependencies**

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

**3. Environment Configuration**

**Backend** (`.env`):
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/booking_db

# Authentication
JWT_SECRET=your_secure_jwt_secret_min_32_characters
JWT_EXPIRES_IN=7d

# AI Voice API Keys
SPEECH_API_KEY=your_speech_recognition_api_key
NLP_API_KEY=your_nlp_service_api_key
TTS_API_KEY=your_text_to_speech_api_key

# Third-party Integrations
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
SENDGRID_API_KEY=your_sendgrid_key

# Redis (Optional)
REDIS_URL=redis://localhost:6379
```

**Frontend** (`.env.local`):
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Feature Flags
NEXT_PUBLIC_VOICE_ENABLED=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

**4. Database Setup**

```bash
# Create database
createdb booking_db

# Run migrations
cd backend
npm run migrate

# Seed initial data (optional)
npm run seed
```

**5. Start Development Servers**

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

**Access Points:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- API Documentation: `http://localhost:5000/api/docs`

---

### Production Deployment

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Deploy to Vercel:**
```bash
vercel --prod
```

**Environment Variables:**
Set all production environment variables in Vercel dashboard.

**Production URL:** https://booking-dashboard-rho.vercel.app/

---

## API Authentication

All protected endpoints require JWT authentication:

```http
Authorization: Bearer {your_jwt_token}
```

**Token Lifecycle:**
1. Obtain token via `/api/auth/login`
2. Include token in Authorization header
3. Token expires after 7 days (configurable)
4. Refresh token via `/api/auth/refresh`

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "The requested booking does not exist",
    "statusCode": 404,
    "details": {
      "bookingId": "book_123"
    }
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `BOOKING_CONFLICT` | 409 | Time slot already booked |
| `CAPACITY_EXCEEDED` | 422 | Requested capacity unavailable |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

API endpoints are rate-limited to ensure service stability:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Booking Operations | 100 requests | 1 hour |
| Voice Processing | 50 requests | 1 hour |
| Analytics | 200 requests | 1 hour |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642789200
```

---

## Testing

### API Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- bookings

# Run with coverage
npm run test:coverage
```

### Example API Test

```bash
# Test booking creation
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-15",
    "time": "19:00",
    "guests": 4
  }'
```

---

## Support

**Documentation:** API documentation available at `/api/docs`

**Issues:** Report bugs via GitHub Issues

**Contact:** Provide support contact information

---

**Production Instance:** [booking-dashboard-rho.vercel.app](https://booking-dashboard-rho.vercel.app/)

---

*Last Updated: January 2026*
