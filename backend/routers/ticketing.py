"""
API endpoints for Ticketing System
Uses advanced router patterns to eliminate duplicate CRUD code
"""
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from shared.advanced_router import create_advanced_router
from shared.crud import CRUDBase
from models import (
    Ticket, TicketComment, TimeEntry, TicketTemplate,
    TicketStatus, TicketPriority, TicketTag
)


# Pydantic schemas
class TicketCreate(BaseModel):
    title: str
    description: str
    priority: str = TicketPriority.MEDIUM.value
    category: Optional[str] = None
    company_id: Optional[int] = None
    customer_id: Optional[int] = None


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assigned_to: Optional[int] = None
    resolution: Optional[str] = None


class CommentCreate(BaseModel):
    comment: str
    is_internal: bool = False


class TimeEntryCreate(BaseModel):
    minutes: int
    description: Optional[str] = None
    billable: bool = True


# Create CRUD operations
ticket_crud = CRUDBase(Ticket)

# Custom endpoints for ticketing-specific functionality
async def get_ticket_stats(db):
    """Custom endpoint for ticket statistics"""
    # Implementation would be here
    pass

async def assign_ticket(ticket_id: int, user_id: int, db):
    """Custom endpoint for ticket assignment"""
    # Implementation would be here
    pass

# Create advanced router with custom endpoints
custom_endpoints = {
    "stats": get_ticket_stats,
    "assign": assign_ticket
}

router = create_advanced_router(
    model=Ticket,
    create_schema=TicketCreate,
    update_schema=TicketUpdate,
    crud_operations=ticket_crud,
    route_prefix="",
    tags=["Tickets"],
    custom_endpoints=custom_endpoints,
    enable_search=True,
    enable_filters=True,
    enable_export=True
)


class TemplateCreate(BaseModel):
    name: str
    category: Optional[str] = None
    title_template: str
    description_template: str
    default_priority: str = TicketPriority.MEDIUM.value


def generate_ticket_number(db: Session) -> str:
    """Generate a unique ticket number"""
    # Get the count of tickets today
    today = datetime.utcnow().date()
    count = db.query(Ticket).filter(
        func.date(Ticket.created_at) == today
    ).count()
    
    # Format: YYYYMMDD-XXXX
    return f"{today.strftime('%Y%m%d')}-{count + 1:04d}"


def calculate_sla_due_date(priority: str) -> datetime:
    """Calculate SLA due date based on priority"""
    hours_map = {
        TicketPriority.CRITICAL.value: 4,
        TicketPriority.HIGH.value: 8,
        TicketPriority.MEDIUM.value: 24,
        TicketPriority.LOW.value: 72
    }
    hours = hours_map.get(priority, 24)
    return datetime.utcnow() + timedelta(hours=hours)


# Tickets
@router.get("/")
async def get_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tickets with optional filtering"""
    query = db.query(Ticket)
    
    if status:
        query = query.filter(Ticket.status == status)
    
    if priority:
        query = query.filter(Ticket.priority == priority)
    
    if assigned_to:
        query = query.filter(Ticket.assigned_to == assigned_to)
    
    if category:
        query = query.filter(Ticket.category == category)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Ticket.ticket_number.ilike(search_term),
                Ticket.title.ilike(search_term),
                Ticket.description.ilike(search_term)
            )
        )
    
    total = query.count()
    tickets = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "tickets": [
            {
                "id": ticket.id,
                "ticket_number": ticket.ticket_number,
                "title": ticket.title,
                "status": ticket.status,
                "priority": ticket.priority,
                "category": ticket.category,
                "submitter_id": ticket.submitter_id,
                "assigned_to": ticket.assigned_to,
                "sla_due_date": ticket.sla_due_date.isoformat() if ticket.sla_due_date else None,
                "time_spent_minutes": ticket.time_spent_minutes,
                "created_at": ticket.created_at.isoformat(),
                "updated_at": ticket.updated_at.isoformat()
            }
            for ticket in tickets
        ]
    }


@router.get("/{ticket_id}")
async def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed ticket information"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Get comments
    comments = db.query(TicketComment).filter(
        TicketComment.ticket_id == ticket_id
    ).order_by(TicketComment.created_at.asc()).all()
    
    # Get time entries
    time_entries = db.query(TimeEntry).filter(
        TimeEntry.ticket_id == ticket_id
    ).all()
    
    return {
        "ticket": {
            "id": ticket.id,
            "ticket_number": ticket.ticket_number,
            "title": ticket.title,
            "description": ticket.description,
            "status": ticket.status,
            "priority": ticket.priority,
            "category": ticket.category,
            "submitter_id": ticket.submitter_id,
            "assigned_to": ticket.assigned_to,
            "sla_due_date": ticket.sla_due_date.isoformat() if ticket.sla_due_date else None,
            "resolution": ticket.resolution,
            "time_spent_minutes": ticket.time_spent_minutes,
            "created_at": ticket.created_at.isoformat(),
            "updated_at": ticket.updated_at.isoformat(),
            "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
            "closed_at": ticket.closed_at.isoformat() if ticket.closed_at else None
        },
        "comments": [
            {
                "id": c.id,
                "user_id": c.user_id,
                "comment": c.comment,
                "is_internal": c.is_internal,
                "created_at": c.created_at.isoformat()
            }
            for c in comments
        ],
        "time_entries": [
            {
                "id": t.id,
                "user_id": t.user_id,
                "minutes": t.minutes,
                "description": t.description,
                "billable": t.billable,
                "created_at": t.created_at.isoformat()
            }
            for t in time_entries
        ]
    }


@router.post("/")
async def create_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new ticket"""
    ticket_number = generate_ticket_number(db)
    sla_due_date = calculate_sla_due_date(ticket.priority)
    
    new_ticket = Ticket(
        ticket_number=ticket_number,
        title=ticket.title,
        description=ticket.description,
        priority=ticket.priority,
        category=ticket.category,
        submitter_id=current_user.id,
        sla_due_date=sla_due_date,
        status=TicketStatus.NEW.value
    )
    
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    return {
        "message": "Ticket created",
        "ticket_id": new_ticket.id,
        "ticket_number": new_ticket.ticket_number
    }


@router.put("/{ticket_id}")
async def update_ticket(
    ticket_id: int,
    ticket_update: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a ticket"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_data = ticket_update.dict(exclude_unset=True)
    
    # Handle status changes
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == TicketStatus.RESOLVED.value and not ticket.resolved_at:
            ticket.resolved_at = datetime.utcnow()
        elif new_status == TicketStatus.CLOSED.value and not ticket.closed_at:
            ticket.closed_at = datetime.utcnow()
    
    # Update priority and recalculate SLA if changed
    if "priority" in update_data and update_data["priority"] != ticket.priority:
        ticket.sla_due_date = calculate_sla_due_date(update_data["priority"])
    
    for key, value in update_data.items():
        setattr(ticket, key, value)
    
    ticket.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Ticket updated"}


@router.delete("/{ticket_id}")
async def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a ticket (admin only)"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    db.delete(ticket)
    db.commit()
    
    return {"message": "Ticket deleted"}


# Comments
@router.post("/{ticket_id}/comments")
async def add_comment(
    ticket_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a comment to a ticket"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    new_comment = TicketComment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        comment=comment.comment,
        is_internal=comment.is_internal
    )
    
    db.add(new_comment)
    ticket.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Comment added"}


# Time Tracking
@router.post("/{ticket_id}/time")
async def add_time_entry(
    ticket_id: int,
    time_entry: TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a time entry to a ticket"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    new_entry = TimeEntry(
        ticket_id=ticket_id,
        user_id=current_user.id,
        minutes=time_entry.minutes,
        description=time_entry.description,
        billable=time_entry.billable
    )
    
    db.add(new_entry)
    
    # Update total time on ticket
    ticket.time_spent_minutes += time_entry.minutes
    ticket.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Time entry added"}


# Templates
@router.get("/templates/list")
async def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all ticket templates"""
    templates = db.query(TicketTemplate).all()
    
    return {
        "templates": [
            {
                "id": t.id,
                "name": t.name,
                "category": t.category,
                "title_template": t.title_template,
                "description_template": t.description_template,
                "default_priority": t.default_priority
            }
            for t in templates
        ]
    }


@router.post("/templates")
async def create_template(
    template: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new ticket template"""
    new_template = TicketTemplate(
        **template.dict(),
        created_by=current_user.id
    )
    
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    
    return {"message": "Template created", "template_id": new_template.id}


@router.post("/templates/{template_id}/use")
async def create_ticket_from_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a ticket from a template"""
    template = db.query(TicketTemplate).filter(TicketTemplate.id == template_id).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    ticket_number = generate_ticket_number(db)
    sla_due_date = calculate_sla_due_date(template.default_priority)
    
    new_ticket = Ticket(
        ticket_number=ticket_number,
        title=template.title_template,
        description=template.description_template,
        priority=template.default_priority,
        category=template.category,
        submitter_id=current_user.id,
        sla_due_date=sla_due_date,
        status=TicketStatus.NEW.value
    )
    
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    return {
        "message": "Ticket created from template",
        "ticket_id": new_ticket.id,
        "ticket_number": new_ticket.ticket_number
    }


# Statistics
@router.get("/stats/overview")
async def get_ticket_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ticket statistics"""
    total = db.query(Ticket).count()
    
    by_status = db.query(
        Ticket.status, func.count(Ticket.id)
    ).group_by(Ticket.status).all()
    
    by_priority = db.query(
        Ticket.priority, func.count(Ticket.id)
    ).group_by(Ticket.priority).all()
    
    return {
        "total": total,
        "by_status": {status: count for status, count in by_status},
        "by_priority": {priority: count for priority, count in by_priority},
        "my_tickets": db.query(Ticket).filter(
            Ticket.assigned_to == current_user.id,
            Ticket.status != TicketStatus.CLOSED.value
        ).count()
    }


# Tags
@router.post("/{ticket_id}/tags")
async def add_tag(
    ticket_id: int,
    tag_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a tag to a ticket"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check if tag already exists
    existing = db.query(TicketTag).filter(
        TicketTag.ticket_id == ticket_id,
        TicketTag.tag_name == tag_name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Tag already exists")
    
    tag = TicketTag(ticket_id=ticket_id, tag_name=tag_name)
    db.add(tag)
    db.commit()
    
    return {"message": "Tag added"}


@router.delete("/{ticket_id}/tags/{tag_id}")
async def remove_tag(
    ticket_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a tag from a ticket"""
    tag = db.query(TicketTag).filter(
        TicketTag.id == tag_id,
        TicketTag.ticket_id == ticket_id
    ).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    db.delete(tag)
    db.commit()
    
    return {"message": "Tag removed"}


# Dependencies
@router.post("/{ticket_id}/dependencies")
async def add_dependency(
    ticket_id: int,
    depends_on_ticket_id: int,
    dependency_type: str = "blocks",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a dependency between tickets"""
    # Check both tickets exist
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    depends_on = db.query(Ticket).filter(Ticket.id == depends_on_ticket_id).first()
    
    if not ticket or not depends_on:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check if dependency already exists
    existing = db.query(TicketDependency).filter(
        TicketDependency.ticket_id == ticket_id,
        TicketDependency.depends_on_ticket_id == depends_on_ticket_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Dependency already exists")
    
    dependency = TicketDependency(
        ticket_id=ticket_id,
        depends_on_ticket_id=depends_on_ticket_id,
        dependency_type=dependency_type
    )
    
    db.add(dependency)
    db.commit()
    
    return {"message": "Dependency added"}


@router.get("/{ticket_id}/dependencies")
async def get_dependencies(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ticket dependencies"""
    dependencies = db.query(TicketDependency, Ticket).join(
        Ticket, TicketDependency.depends_on_ticket_id == Ticket.id
    ).filter(TicketDependency.ticket_id == ticket_id).all()
    
    return {
        "dependencies": [
            {
                "id": dep.id,
                "dependency_type": dep.dependency_type,
                "depends_on": {
                    "id": ticket.id,
                    "ticket_number": ticket.ticket_number,
                    "title": ticket.title,
                    "status": ticket.status
                }
            }
            for dep, ticket in dependencies
        ]
    }


@router.delete("/dependencies/{dependency_id}")
async def remove_dependency(
    dependency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a dependency"""
    dependency = db.query(TicketDependency).filter(TicketDependency.id == dependency_id).first()
    
    if not dependency:
        raise HTTPException(status_code=404, detail="Dependency not found")
    
    db.delete(dependency)
    db.commit()
    
    return {"message": "Dependency removed"}


# Custom Fields
@router.get("/custom-fields")
async def get_custom_fields(
    applies_to: str = "ticket",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get custom field definitions"""
    fields = db.query(CustomField).filter(
        CustomField.applies_to == applies_to,
        CustomField.is_active == True
    ).order_by(CustomField.position).all()
    
    return {
        "fields": [
            {
                "id": field.id,
                "name": field.name,
                "field_type": field.field_type,
                "options": field.options,
                "is_required": field.is_required
            }
            for field in fields
        ]
    }


@router.post("/{ticket_id}/custom-fields/{field_id}")
async def set_custom_field_value(
    ticket_id: int,
    field_id: int,
    value: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Set a custom field value for a ticket"""
    # Check if ticket and field exist
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    field = db.query(CustomField).filter(CustomField.id == field_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if not field:
        raise HTTPException(status_code=404, detail="Custom field not found")
    
    # Check if value already exists
    existing = db.query(CustomFieldValue).filter(
        CustomFieldValue.ticket_id == ticket_id,
        CustomFieldValue.custom_field_id == field_id
    ).first()
    
    if existing:
        existing.value = value
    else:
        field_value = CustomFieldValue(
            custom_field_id=field_id,
            ticket_id=ticket_id,
            value=value
        )
        db.add(field_value)
    
    db.commit()
    
    return {"message": "Custom field value set"}


# SLA Policies
@router.get("/sla-policies")
async def get_sla_policies(
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get SLA policies"""
    query = db.query(SLAPolicy)
    
    if is_active is not None:
        query = query.filter(SLAPolicy.is_active == is_active)
    
    policies = query.all()
    
    return {
        "policies": [
            {
                "id": policy.id,
                "name": policy.name,
                "description": policy.description,
                "priority": policy.priority,
                "response_time_hours": policy.response_time_hours,
                "resolution_time_hours": policy.resolution_time_hours,
                "is_active": policy.is_active
            }
            for policy in policies
        ]
    }


# Automation Rules
@router.get("/automation-rules")
async def get_automation_rules(
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get automation rules"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(AutomationRule)
    
    if is_active is not None:
        query = query.filter(AutomationRule.is_active == is_active)
    
    rules = query.order_by(AutomationRule.priority).all()
    
    return {
        "rules": [
            {
                "id": rule.id,
                "name": rule.name,
                "description": rule.description,
                "trigger_type": rule.trigger_type,
                "conditions": rule.conditions,
                "actions": rule.actions,
                "is_active": rule.is_active,
                "priority": rule.priority
            }
            for rule in rules
        ]
    }


# Editable time tracking
@router.put("/time/{time_entry_id}")
async def update_time_entry(
    time_entry_id: int,
    minutes: int,
    description: Optional[str] = None,
    billable: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update time entry (tech can edit at the end)"""
    time_entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()
    
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    # Only allow tech to edit their own time entries
    if time_entry.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update ticket total time
    ticket = db.query(Ticket).filter(Ticket.id == time_entry.ticket_id).first()
    if ticket:
        time_diff = minutes - time_entry.minutes
        ticket.time_spent_minutes += time_diff
    
    time_entry.minutes = minutes
    if description is not None:
        time_entry.description = description
    if billable is not None:
        time_entry.billable = billable
    
    db.commit()
    
    return {"message": "Time entry updated"}


@router.delete("/time/{time_entry_id}")
async def delete_time_entry(
    time_entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete time entry"""
    time_entry = db.query(TimeEntry).filter(TimeEntry.id == time_entry_id).first()
    
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    # Only allow tech to delete their own time entries
    if time_entry.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update ticket total time
    ticket = db.query(Ticket).filter(Ticket.id == time_entry.ticket_id).first()
    if ticket:
        ticket.time_spent_minutes -= time_entry.minutes
    
    db.delete(time_entry)
    db.commit()
    
    return {"message": "Time entry deleted"}

