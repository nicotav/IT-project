"""
API endpoints for Dashboard (Access Center stats)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from database import get_db
from auth import get_current_user
from models import (
    User, Ticket, KnowledgeArticle, MonitoredService, 
    Alert, TicketStatus, TicketPriority
)

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard statistics for Access Center"""
    
    # Ticket statistics
    total_tickets = db.query(Ticket).count()
    open_tickets = db.query(Ticket).filter(
        Ticket.status.in_([TicketStatus.NEW.value, TicketStatus.IN_PROGRESS.value])
    ).count()
    critical_tickets = db.query(Ticket).filter(
        Ticket.priority == TicketPriority.CRITICAL.value,
        Ticket.status != TicketStatus.CLOSED.value
    ).count()
    
    # Today's tickets
    today = datetime.utcnow().date()
    tickets_today = db.query(Ticket).filter(
        func.date(Ticket.created_at) == today
    ).count()
    
    # Knowledge Base statistics
    total_articles = db.query(KnowledgeArticle).filter(
        KnowledgeArticle.is_published == True
    ).count()
    articles_this_week = db.query(KnowledgeArticle).filter(
        KnowledgeArticle.created_at >= datetime.utcnow() - timedelta(days=7),
        KnowledgeArticle.is_published == True
    ).count()
    
    # Monitoring statistics
    total_services = db.query(MonitoredService).count()
    services_down = db.query(MonitoredService).filter(
        MonitoredService.status == "down"
    ).count()
    services_warning = db.query(MonitoredService).filter(
        MonitoredService.status == "warning"
    ).count()
    
    # Alert statistics
    active_alerts = db.query(Alert).filter(
        Alert.status == "active"
    ).count()
    critical_alerts = db.query(Alert).filter(
        Alert.status == "active",
        Alert.severity == "critical"
    ).count()
    
    # Calculate overall health score (0-100)
    health_score = 100
    if total_services > 0:
        health_score -= (services_down * 20)
        health_score -= (services_warning * 5)
        health_score = max(0, min(100, health_score))
    
    return {
        "tickets": {
            "total": total_tickets,
            "open": open_tickets,
            "critical": critical_tickets,
            "today": tickets_today,
            "assigned_to_me": db.query(Ticket).filter(
                Ticket.assigned_to == current_user.id,
                Ticket.status != TicketStatus.CLOSED.value
            ).count()
        },
        "knowledge": {
            "total_articles": total_articles,
            "new_this_week": articles_this_week
        },
        "monitoring": {
            "total_services": total_services,
            "services_up": total_services - services_down - services_warning,
            "services_down": services_down,
            "services_warning": services_warning,
            "health_score": health_score
        },
        "alerts": {
            "active": active_alerts,
            "critical": critical_alerts
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity across all systems"""
    
    # Recent tickets
    recent_tickets = db.query(Ticket).order_by(
        Ticket.created_at.desc()
    ).limit(5).all()
    
    # Recent alerts
    recent_alerts = db.query(Alert).order_by(
        Alert.created_at.desc()
    ).limit(5).all()
    
    activities = []
    
    for ticket in recent_tickets:
        activities.append({
            "type": "ticket",
            "title": f"Ticket #{ticket.ticket_number}: {ticket.title}",
            "priority": ticket.priority,
            "status": ticket.status,
            "timestamp": ticket.created_at.isoformat()
        })
    
    for alert in recent_alerts:
        activities.append({
            "type": "alert",
            "title": alert.title,
            "severity": alert.severity,
            "status": alert.status,
            "timestamp": alert.created_at.isoformat()
        })
    
    # Sort by timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {"activities": activities[:limit]}
