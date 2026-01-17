# MSP IT Management System - Backend

FastAPI backend for Access Center, Knowledge Base, Monitoring Dashboard, and Ticketing System.

## Features

- **JWT Authentication** - Secure token-based authentication
- **RESTful APIs** - Complete API coverage for all systems
- **SQLite Database** - Easy local development with SQLite
- **CORS Enabled** - Supports multiple frontend applications

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Initialize Database

```bash
python init_db.py
```

This creates the database and populates it with sample data.

### 3. Run the Server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

## Default Credentials

- **Admin**: `admin` / `admin123`
- **Technician**: `tech1` / `tech123`
- **User**: `user1` / `user123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user info

### Dashboard (Access Center)
- `GET /api/dashboard/stats` - Get comprehensive statistics
- `GET /api/dashboard/recent-activity` - Recent activity feed

### Knowledge Base
- `GET /api/knowledge/categories` - List categories
- `GET /api/knowledge/articles` - List articles (with filters)
- `POST /api/knowledge/articles` - Create article
- `GET /api/knowledge/articles/{id}` - Get article details
- `GET /api/knowledge/articles/{id}/versions` - Version history
- `POST /api/knowledge/articles/{id}/favorite` - Toggle favorite

### Monitoring Dashboard
- `GET /api/monitoring/services` - List monitored services
- `GET /api/monitoring/alerts` - List alerts
- `GET /api/monitoring/metrics/{service_id}` - Get metrics
- `GET /api/monitoring/sla` - SLA tracking
- `GET /api/monitoring/widgets` - Custom dashboard widgets

### Ticketing System
- `GET /api/tickets` - List tickets (with filters)
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/{id}` - Get ticket details
- `PUT /api/tickets/{id}` - Update ticket
- `POST /api/tickets/{id}/comments` - Add comment
- `POST /api/tickets/{id}/time` - Log time entry
- `GET /api/tickets/templates/list` - List ticket templates

## Database Schema

The system uses SQLAlchemy ORM with the following main models:

- **Users** - User accounts and authentication
- **Knowledge Base** - Articles, categories, versions, favorites
- **Monitoring** - Services, alerts, metrics, SLA, widgets
- **Ticketing** - Tickets, comments, time entries, templates

## Development

### Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── database.py          # Database configuration
├── models.py            # SQLAlchemy models
├── auth.py              # JWT authentication
├── init_db.py           # Database initialization script
├── requirements.txt     # Python dependencies
├── routers/
│   ├── dashboard.py     # Dashboard API endpoints
│   ├── knowledge.py     # Knowledge Base endpoints
│   ├── monitoring.py    # Monitoring endpoints
│   └── ticketing.py     # Ticketing endpoints
└── msp_system.db        # SQLite database (created on init)
```

### Adding New Endpoints

1. Add routes to the appropriate router file in `routers/`
2. Use dependency injection for database and authentication
3. Follow the existing patterns for consistency

## Configuration

Edit these settings in the respective files:

- **Database URL**: `database.py` - Change `SQLALCHEMY_DATABASE_URL`
- **JWT Secret**: `auth.py` - Change `SECRET_KEY` for production
- **CORS Origins**: `main.py` - Update `allow_origins` list
- **Token Expiry**: `auth.py` - Modify `ACCESS_TOKEN_EXPIRE_MINUTES`

## Security Notes

⚠️ **Important for Production**:
- Change the JWT `SECRET_KEY` to a secure random string
- Use environment variables for sensitive configuration
- Enable HTTPS/TLS
- Implement rate limiting
- Add input validation and sanitization
- Use PostgreSQL or MySQL instead of SQLite
