"""
API endpoints for Analytics & Reports
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from database import get_db
from auth import get_current_user
from models import (
    User, Ticket, TicketComment, TimeEntry, CustomerSatisfaction,
    Report, ScheduledReport, TicketStatus, TicketPriority
)

router = APIRouter()


# Pydantic schemas
class ReportCreate(BaseModel):
    name: str
    report_type: str
    description: Optional[str] = None
    config: str
    is_public: bool = False


class DateRangeQuery(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


@router.get("/dashboard")
async def get_dashboard_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive dashboard statistics"""
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    query = db.query(Ticket).filter(
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    )
    
    # Total tickets
    total_tickets = query.count()
    
    # Tickets by status
    status_counts = db.query(
        Ticket.status,
        func.count(Ticket.id).label('count')
    ).filter(
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    ).group_by(Ticket.status).all()
    
    # Tickets by priority
    priority_counts = db.query(
        Ticket.priority,
        func.count(Ticket.id).label('count')
    ).filter(
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    ).group_by(Ticket.priority).all()
    
    # Average resolution time
    resolved_tickets = db.query(
        func.avg(
            func.extract('epoch', Ticket.resolved_at - Ticket.created_at) / 3600
        ).label('avg_hours')
    ).filter(
        Ticket.resolved_at.isnot(None),
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    ).first()
    
    # Average first response time
    first_response = db.query(
        func.avg(
            func.extract('epoch', Ticket.first_response_at - Ticket.created_at) / 3600
        ).label('avg_hours')
    ).filter(
        Ticket.first_response_at.isnot(None),
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    ).first()
    
    # Average CSAT score
    avg_csat = db.query(
        func.avg(CustomerSatisfaction.rating).label('avg_rating'),
        func.count(CustomerSatisfaction.id).label('count')
    ).join(
        Ticket, CustomerSatisfaction.ticket_id == Ticket.id
    ).filter(
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    ).first()
    
    # SLA compliance
    sla_met = db.query(func.count(Ticket.id)).filter(
        Ticket.resolved_at.isnot(None),
        Ticket.resolved_at <= Ticket.sla_due_date,
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    ).scalar()
    
    total_with_sla = db.query(func.count(Ticket.id)).filter(
        Ticket.resolved_at.isnot(None),
        Ticket.sla_due_date.isnot(None),
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    ).scalar()
    
    sla_compliance = (sla_met / total_with_sla * 100) if total_with_sla > 0 else 100
    
    return {
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "summary": {
            "total_tickets": total_tickets,
            "avg_resolution_hours": round(resolved_tickets[0] if resolved_tickets[0] else 0, 2),
            "avg_first_response_hours": round(first_response[0] if first_response[0] else 0, 2),
            "sla_compliance_percent": round(sla_compliance, 2)
        },
        "tickets_by_status": {status: count for status, count in status_counts},
        "tickets_by_priority": {priority: count for priority, count in priority_counts},
        "customer_satisfaction": {
            "avg_rating": round(avg_csat[0] if avg_csat[0] else 0, 2),
            "response_count": avg_csat[1] if avg_csat[1] else 0
        }
    }


@router.get("/tickets/trend")
async def get_ticket_trend(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ticket creation trend over time"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Group by date
    trend = db.query(
        func.date(Ticket.created_at).label('date'),
        func.count(Ticket.id).label('count')
    ).filter(
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    ).group_by(
        func.date(Ticket.created_at)
    ).order_by('date').all()
    
    return {
        "trend": [
            {
                "date": date.isoformat(),
                "count": count
            }
            for date, count in trend
        ]
    }


@router.get("/technicians/performance")
async def get_technician_performance(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get technician performance metrics"""
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Get technicians
    technicians = db.query(User).filter(
        User.role == "technician",
        User.is_active == True
    ).all()
    
    performance = []
    
    for tech in technicians:
        # Total tickets assigned
        total_assigned = db.query(func.count(Ticket.id)).filter(
            Ticket.assigned_to == tech.id,
            Ticket.created_at >= start_date,
            Ticket.created_at <= end_date
        ).scalar()
        
        # Resolved tickets
        resolved = db.query(func.count(Ticket.id)).filter(
            Ticket.assigned_to == tech.id,
            Ticket.status.in_([TicketStatus.RESOLVED.value, TicketStatus.CLOSED.value]),
            Ticket.created_at >= start_date,
            Ticket.created_at <= end_date
        ).scalar()
        
        # Average resolution time
        avg_resolution = db.query(
            func.avg(
                func.extract('epoch', Ticket.resolved_at - Ticket.created_at) / 3600
            )
        ).filter(
            Ticket.assigned_to == tech.id,
            Ticket.resolved_at.isnot(None),
            Ticket.created_at >= start_date,
            Ticket.created_at <= end_date
        ).scalar()
        
        # Total time logged
        total_time = db.query(func.sum(TimeEntry.minutes)).filter(
            TimeEntry.user_id == tech.id,
            TimeEntry.created_at >= start_date,
            TimeEntry.created_at <= end_date
        ).scalar() or 0
        
        # Average CSAT
        avg_csat = db.query(func.avg(CustomerSatisfaction.rating)).join(
            Ticket, CustomerSatisfaction.ticket_id == Ticket.id
        ).filter(
            Ticket.assigned_to == tech.id,
            Ticket.created_at >= start_date,
            Ticket.created_at <= end_date
        ).scalar()
        
        performance.append({
            "technician_id": tech.id,
            "technician_name": tech.username,
            "total_assigned": total_assigned,
            "resolved": resolved,
            "resolution_rate": round((resolved / total_assigned * 100) if total_assigned > 0 else 0, 2),
            "avg_resolution_hours": round(avg_resolution if avg_resolution else 0, 2),
            "total_time_minutes": int(total_time),
            "avg_csat": round(avg_csat if avg_csat else 0, 2)
        })
    
    return {"technicians": performance}


@router.get("/categories/distribution")
async def get_category_distribution(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ticket distribution by category"""
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    distribution = db.query(
        Ticket.category,
        func.count(Ticket.id).label('count')
    ).filter(
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    ).group_by(Ticket.category).all()
    
    return {
        "distribution": [
            {
                "category": category or "Uncategorized",
                "count": count
            }
            for category, count in distribution
        ]
    }


@router.get("/sla/compliance")
async def get_sla_compliance(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get SLA compliance metrics"""
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # SLA met by priority
    sla_by_priority = db.query(
        Ticket.priority,
        func.count(Ticket.id).label('total'),
        func.sum(
            case(
                (Ticket.resolved_at <= Ticket.sla_due_date, 1),
                else_=0
            )
        ).label('met')
    ).filter(
        Ticket.resolved_at.isnot(None),
        Ticket.sla_due_date.isnot(None),
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    ).group_by(Ticket.priority).all()
    
    return {
        "sla_by_priority": [
            {
                "priority": priority,
                "total": total,
                "met": met,
                "compliance_percent": round((met / total * 100) if total > 0 else 0, 2)
            }
            for priority, total, met in sla_by_priority
        ]
    }


# Reports management
@router.get("/reports")
async def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all reports"""
    query = db.query(Report)
    
    if current_user.role != "admin":
        query = query.filter(
            or_(
                Report.is_public == True,
                Report.created_by == current_user.id
            )
        )
    
    reports = query.all()
    
    return {
        "reports": [
            {
                "id": report.id,
                "name": report.name,
                "report_type": report.report_type,
                "description": report.description,
                "is_public": report.is_public,
                "created_by": report.created_by,
                "created_at": report.created_at.isoformat()
            }
            for report in reports
        ]
    }


@router.post("/reports")
async def create_report(
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new report"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    report = Report(
        name=report_data.name,
        report_type=report_data.report_type,
        description=report_data.description,
        config=report_data.config,
        is_public=report_data.is_public,
        created_by=current_user.id
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return {"message": "Report created", "report_id": report.id}
