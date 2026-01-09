# Installation and Setup Guide

## Quick Start

### 1. Backend Setup

```powershell
# Navigate to backend
cd backend

# Install dependencies (if not already done)
pip install fastapi uvicorn sqlalchemy passlib python-jose python-multipart

# Recreate database with new models
python init_db.py

# Start backend server
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```powershell
# Navigate to ticketing system
cd ticketing-system

# Install new dependency for drag-and-drop
npm install react-beautiful-dnd

# Start frontend
npm run dev
```

### 3. Access the System

- **Ticketing System:** http://localhost:3003
- **API Documentation:** http://localhost:8000/docs
- **Access Center:** http://localhost:3000

### Default Login Credentials

After running `init_db.py`:

- **Admin:** 
  - Username: `admin`
  - Password: `admin123`

- **Technician:** 
  - Username: `tech1`
  - Password: `tech123`

- **User:** 
  - Username: `user1`
  - Password: `user123`

## Navigation

The header now includes links to all features:
- **Tickets** - Traditional ticket list view
- **Boards** - Kanban board with drag-and-drop
- **Appointments** - Schedule meetings with technicians
- **Teams** - Manage teams and members
- **Companies** - Manage companies and their assets
- **Analytics** - View reports and dashboards
- **Portal** - Customer self-service portal

## Feature Highlights

### 🎯 Most Important Features for Techs

1. **Editable Time Tracking** - Edit your time entries anytime
2. **Kanban Boards** - Visual workflow management
3. **Internal Notes** - Private team communication
4. **@Mentions** - Tag colleagues in comments

### 📊 Most Important Features for Admins

1. **Teams Management** - Organize your workforce
2. **Company & Asset Tracking** - Full client management
3. **Automation Rules** - Automate repetitive tasks
4. **Analytics Dashboard** - Performance insights

### 👥 Most Important Features for Customers

1. **Customer Portal** - Self-service ticket management
2. **Satisfaction Surveys** - Rate your experience
3. **File Attachments** - Upload screenshots/documents
4. **Appointment Scheduling** - Book tech visits

## Testing the Features

### Test Kanban Board
1. Go to **Boards** tab
2. A default board is created automatically
3. Drag tickets between columns
4. Add tickets to board from ticket list

### Test Appointments
1. Go to **Appointments** tab
2. Click **+ New Appointment**
3. Fill in details (use existing user IDs from database)
4. View scheduled appointments by date

### Test Teams
1. Go to **Teams** tab
2. Click **+ New Team**
3. Add team members
4. Assign tickets to teams

### Test Time Tracking (Editable)
1. Open any ticket
2. Add time entry
3. Click edit on your time entry
4. Modify minutes, description, or billable status
5. Delete if needed

## Database Reset

If you need to start fresh:

```powershell
# Stop backend server (Ctrl+C)

# Delete database
Remove-Item backend\ticketing.db -ErrorAction SilentlyContinue

# Recreate with all new tables
cd backend
python init_db.py
```

## Troubleshooting

### Backend Issues

**Import Errors:**
```powershell
pip install --upgrade fastapi sqlalchemy
```

**Database Errors:**
- Delete `ticketing.db` and run `init_db.py` again

### Frontend Issues

**Module Not Found:**
```powershell
cd ticketing-system
npm install
```

**React Beautiful DnD Issues:**
```powershell
npm install react-beautiful-dnd --force
```

### CORS Issues

Make sure backend main.py has correct CORS origins:
```python
allow_origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
]
```

## What's Working vs What's Stubbed

### ✅ Fully Implemented (Backend + Frontend)
- Kanban Boards with drag-and-drop
- Appointment Scheduler
- Time Tracking (editable)
- Ticket Tags
- Ticket Dependencies
- Custom Fields
- Internal Notes
- @Mentions system
- File Attachments

### ✅ Backend Complete (Frontend Placeholder)
- Teams Management (basic UI done)
- Company & Asset Management (basic UI done)
- Analytics Dashboard (basic UI done)
- Customer Portal (basic UI done)
- SLA Management
- Automation Rules
- Email Integration
- Reports

### 🚀 Ready to Expand
All backend APIs are complete and tested. Frontend components can be enhanced with:
- Rich data visualizations for Analytics
- Full CRUD interfaces for Companies/Assets
- Advanced team member management UI
- Email configuration UI
- Notification center

## Next Development Steps

1. **Enhance Analytics UI** - Add charts using Chart.js or Recharts
2. **Complete Company/Asset UI** - Full management interface
3. **Add Email Config UI** - IMAP/SMTP settings page
4. **Implement Notifications** - Real-time updates
5. **Add Advanced Search** - Full-text search across tickets

## API Endpoints Summary

See `FEATURES_DOCUMENTATION.md` for complete API reference, or visit:
http://localhost:8000/docs

All endpoints are RESTful and follow standard conventions.
