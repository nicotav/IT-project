"""
MSP IT Management System - Shared Backend
FastAPI backend with JWT authentication for multiple frontend applications
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import uvicorn

from database import get_db, engine, Base
from auth import create_access_token, verify_password, get_password_hash, get_current_user
from models import User
from routers import knowledge, monitoring, ticketing, dashboard, teams, boards, appointments, companies, analytics, customer_portal

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MSP IT Management System API",
    description="Unified backend for Access Center, Knowledge Base, Monitoring Dashboard, and Ticketing System",
    version="1.0.0"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Access Center
        "http://localhost:3001",  # Knowledge Base
        "http://localhost:3002",  # Monitoring Dashboard
        "http://localhost:3003",  # Ticketing System
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["Knowledge Base"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"])
app.include_router(ticketing.router, prefix="/api/tickets", tags=["Ticketing"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(boards.router, prefix="/api/boards", tags=["Boards"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(companies.router, prefix="/api/companies", tags=["Companies & Assets"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(customer_portal.router, prefix="/api/portal", tags=["Customer Portal"])


@app.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return JWT token"""
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }


@app.post("/api/auth/register")
async def register(username: str, email: str, password: str, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        role="user"  # Default role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User created successfully", "user_id": user.id}


@app.get("/api/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }


@app.get("/")
async def root():
    """API health check"""
    return {
        "status": "online",
        "message": "MSP IT Management System API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
