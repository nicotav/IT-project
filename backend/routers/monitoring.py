"""
API endpoints for Monitoring Dashboard system
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from database import get_db
from auth import get_current_user
from models import (
    User, MonitoredService, Alert, ServiceMetric, 
    SLA, DashboardWidget
)

router = APIRouter()


# Pydantic schemas
class ServiceCreate(BaseModel):
    name: str
    type: str
    url: Optional[str] = None
    description: Optional[str] = None


class AlertCreate(BaseModel):
    service_id: int
    severity: str
    title: str
    description: Optional[str] = None


class MetricCreate(BaseModel):
    service_id: int
    metric_name: str
    value: float
    unit: Optional[str] = None


class WidgetCreate(BaseModel):
    widget_type: str
    title: str
    config: Optional[str] = None
    position: int = 0
    size: str = "medium"


# Services
@router.get("/services")
async def get_services(
    status: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all monitored services"""
    query = db.query(MonitoredService)
    
    if status:
        query = query.filter(MonitoredService.status == status)
    
    if type:
        query = query.filter(MonitoredService.type == type)
    
    services = query.all()
    
    return {
        "services": [
            {
                "id": service.id,
                "name": service.name,
                "type": service.type,
                "url": service.url,
                "status": service.status,
                "last_check": service.last_check.isoformat() if service.last_check else None,
                "response_time": service.response_time,
                "uptime_percentage": service.uptime_percentage,
                "description": service.description,
                "created_at": service.created_at.isoformat()
            }
            for service in services
        ]
    }


@router.post("/services")
async def create_service(
    service: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new monitored service"""
    new_service = MonitoredService(**service.dict())
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return {"message": "Service created", "service_id": new_service.id}


@router.get("/services/{service_id}")
async def get_service_details(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a service including metrics"""
    service = db.query(MonitoredService).filter(MonitoredService.id == service_id).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get recent metrics (last 24 hours)
    recent_metrics = db.query(ServiceMetric).filter(
        ServiceMetric.service_id == service_id,
        ServiceMetric.timestamp >= datetime.utcnow() - timedelta(hours=24)
    ).order_by(ServiceMetric.timestamp.desc()).all()
    
    # Get active alerts
    active_alerts = db.query(Alert).filter(
        Alert.service_id == service_id,
        Alert.status == "active"
    ).all()
    
    return {
        "service": {
            "id": service.id,
            "name": service.name,
            "type": service.type,
            "url": service.url,
            "status": service.status,
            "last_check": service.last_check.isoformat() if service.last_check else None,
            "response_time": service.response_time,
            "uptime_percentage": service.uptime_percentage,
            "description": service.description
        },
        "metrics": [
            {
                "metric_name": m.metric_name,
                "value": m.value,
                "unit": m.unit,
                "timestamp": m.timestamp.isoformat()
            }
            for m in recent_metrics
        ],
        "active_alerts": [
            {
                "id": a.id,
                "severity": a.severity,
                "title": a.title,
                "created_at": a.created_at.isoformat()
            }
            for a in active_alerts
        ]
    }


@router.put("/services/{service_id}/status")
async def update_service_status(
    service_id: int,
    status: str,
    response_time: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update service status (typically called by monitoring agents)"""
    service = db.query(MonitoredService).filter(MonitoredService.id == service_id).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service.status = status
    service.last_check = datetime.utcnow()
    
    if response_time is not None:
        service.response_time = response_time
    
    db.commit()
    
    return {"message": "Service status updated"}


# Alerts
@router.get("/alerts")
async def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    service_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get alerts with optional filtering"""
    query = db.query(Alert)
    
    if status:
        query = query.filter(Alert.status == status)
    
    if severity:
        query = query.filter(Alert.severity == severity)
    
    if service_id:
        query = query.filter(Alert.service_id == service_id)
    
    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    
    return {
        "alerts": [
            {
                "id": alert.id,
                "service_id": alert.service_id,
                "service_name": alert.service.name if alert.service else None,
                "severity": alert.severity,
                "title": alert.title,
                "description": alert.description,
                "status": alert.status,
                "acknowledged_by": alert.acknowledged_by,
                "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
                "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
                "created_at": alert.created_at.isoformat()
            }
            for alert in alerts
        ]
    }


@router.post("/alerts")
async def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new alert"""
    new_alert = Alert(**alert.dict())
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return {"message": "Alert created", "alert_id": new_alert.id}


@router.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Acknowledge an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "acknowledged"
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Alert acknowledged"}


@router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resolve an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "resolved"
    alert.resolved_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Alert resolved"}


# Metrics
@router.post("/metrics")
async def add_metric(
    metric: MetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new metric data point"""
    new_metric = ServiceMetric(**metric.dict())
    db.add(new_metric)
    db.commit()
    return {"message": "Metric added"}


@router.get("/metrics/{service_id}")
async def get_service_metrics(
    service_id: int,
    metric_name: Optional[str] = None,
    hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get metrics for a service with trending data"""
    query = db.query(ServiceMetric).filter(
        ServiceMetric.service_id == service_id,
        ServiceMetric.timestamp >= datetime.utcnow() - timedelta(hours=hours)
    )
    
    if metric_name:
        query = query.filter(ServiceMetric.metric_name == metric_name)
    
    metrics = query.order_by(ServiceMetric.timestamp.asc()).all()
    
    # Group by metric name
    grouped_metrics = {}
    for metric in metrics:
        if metric.metric_name not in grouped_metrics:
            grouped_metrics[metric.metric_name] = []
        grouped_metrics[metric.metric_name].append({
            "value": metric.value,
            "unit": metric.unit,
            "timestamp": metric.timestamp.isoformat()
        })
    
    return {"metrics": grouped_metrics}


# SLA Management
@router.get("/sla")
async def get_slas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all SLA configurations"""
    slas = db.query(SLA).all()
    
    return {
        "slas": [
            {
                "id": sla.id,
                "service_id": sla.service_id,
                "name": sla.name,
                "target_uptime": sla.target_uptime,
                "current_uptime": sla.current_uptime,
                "response_time_target": sla.response_time_target,
                "status": sla.status,
                "start_date": sla.start_date.isoformat(),
                "end_date": sla.end_date.isoformat() if sla.end_date else None
            }
            for sla in slas
        ]
    }


# Custom Widgets
@router.get("/widgets")
async def get_user_widgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's custom dashboard widgets"""
    widgets = db.query(DashboardWidget).filter(
        DashboardWidget.user_id == current_user.id
    ).order_by(DashboardWidget.position).all()
    
    return {
        "widgets": [
            {
                "id": w.id,
                "widget_type": w.widget_type,
                "title": w.title,
                "config": w.config,
                "position": w.position,
                "size": w.size
            }
            for w in widgets
        ]
    }


@router.post("/widgets")
async def create_widget(
    widget: WidgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a custom dashboard widget"""
    new_widget = DashboardWidget(
        **widget.dict(),
        user_id=current_user.id
    )
    db.add(new_widget)
    db.commit()
    db.refresh(new_widget)
    return {"message": "Widget created", "widget_id": new_widget.id}


@router.delete("/widgets/{widget_id}")
async def delete_widget(
    widget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a dashboard widget"""
    widget = db.query(DashboardWidget).filter(
        DashboardWidget.id == widget_id,
        DashboardWidget.user_id == current_user.id
    ).first()
    
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    db.delete(widget)
    db.commit()
    
    return {"message": "Widget deleted"}
