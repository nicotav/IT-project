"""
API endpoints for Customer Portal
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from auth import get_current_user
from models import (
    User, Ticket, TicketComment, TicketTemplate, CustomerSatisfaction,
    Attachment, TicketTag, TicketDependency, CustomField, CustomFieldValue,
    Mention
)

router = APIRouter()


# Pydantic schemas
class CustomerTicketCreate(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    category: Optional[str] = None


class CommentCreate(BaseModel):
    comment: str
    is_internal: bool = False


class SatisfactionCreate(BaseModel):
    rating: int  # 1-5
    feedback: Optional[str] = None


# Customer-facing ticket endpoints
@router.get("/my-tickets")
async def get_my_tickets(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tickets submitted by current user"""
    query = db.query(Ticket).filter(Ticket.submitter_id == current_user.id)
    
    if status:
        query = query.filter(Ticket.status == status)
    
    tickets = query.order_by(Ticket.created_at.desc()).all()
    
    return {
        "tickets": [
            {
                "id": ticket.id,
                "ticket_number": ticket.ticket_number,
                "title": ticket.title,
                "description": ticket.description,
                "status": ticket.status,
                "priority": ticket.priority,
                "category": ticket.category,
                "assigned_to": ticket.assigned_to,
                "created_at": ticket.created_at.isoformat(),
                "updated_at": ticket.updated_at.isoformat()
            }
            for ticket in tickets
        ]
    }


@router.get("/tickets/{ticket_id}")
async def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ticket details (customer can only see their own)"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check permissions
    if current_user.role == "user" and ticket.submitter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
    
    # Get comments (exclude internal notes for customers)
    comments_query = db.query(TicketComment).filter(
        TicketComment.ticket_id == ticket_id
    )
    
    if current_user.role == "user":
        comments_query = comments_query.filter(TicketComment.is_internal == False)
    
    comments = comments_query.order_by(TicketComment.created_at).all()
    
    # Get tags
    tags = db.query(TicketTag).filter(TicketTag.ticket_id == ticket_id).all()
    
    # Get custom field values
    custom_values = db.query(CustomFieldValue, CustomField).join(
        CustomField, CustomFieldValue.custom_field_id == CustomField.id
    ).filter(
        CustomFieldValue.ticket_id == ticket_id
    ).all()
    
    return {
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
        "created_at": ticket.created_at.isoformat(),
        "updated_at": ticket.updated_at.isoformat(),
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        "comments": [
            {
                "id": comment.id,
                "user_id": comment.user_id,
                "comment": comment.comment,
                "is_internal": comment.is_internal,
                "created_at": comment.created_at.isoformat()
            }
            for comment in comments
        ],
        "tags": [tag.tag_name for tag in tags],
        "custom_fields": [
            {
                "field_name": field.name,
                "field_type": field.field_type,
                "value": value.value
            }
            for value, field in custom_values
        ]
    }


@router.post("/tickets")
async def create_ticket(
    ticket_data: CustomerTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new ticket"""
    from routers.ticketing import generate_ticket_number, calculate_sla_due_date
    
    ticket = Ticket(
        ticket_number=generate_ticket_number(db),
        title=ticket_data.title,
        description=ticket_data.description,
        priority=ticket_data.priority,
        category=ticket_data.category,
        submitter_id=current_user.id,
        sla_due_date=calculate_sla_due_date(ticket_data.priority)
    )
    
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    return {
        "message": "Ticket created successfully",
        "ticket_id": ticket.id,
        "ticket_number": ticket.ticket_number
    }


@router.post("/tickets/{ticket_id}/comments")
async def add_comment(
    ticket_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add comment to ticket"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check permissions
    if current_user.role == "user" and ticket.submitter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Customers cannot create internal notes
    if current_user.role == "user":
        comment_data.is_internal = False
    
    comment = TicketComment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        comment=comment_data.comment,
        is_internal=comment_data.is_internal
    )
    
    db.add(comment)
    
    # Update ticket first_response_at if this is first tech response
    if current_user.role in ["technician", "admin"] and not ticket.first_response_at:
        ticket.first_response_at = datetime.utcnow()
    
    # Parse @mentions
    import re
    mentions = re.findall(r'@(\w+)', comment_data.comment)
    
    for username in mentions:
        mentioned_user = db.query(User).filter(User.username == username).first()
        if mentioned_user:
            mention = Mention(
                user_id=mentioned_user.id,
                comment_id=comment.id,
                ticket_id=ticket_id
            )
            db.add(mention)
    
    db.commit()
    db.refresh(comment)
    
    return {"message": "Comment added", "comment_id": comment.id}


@router.post("/tickets/{ticket_id}/attachments")
async def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload file attachment to ticket"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check permissions
    if current_user.role == "user" and ticket.submitter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Save file (simplified - in production, use proper file storage)
    import os
    import uuid
    
    upload_dir = "uploads/attachments"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    attachment = Attachment(
        filename=file.filename,
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type,
        ticket_id=ticket_id,
        uploaded_by=current_user.id
    )
    
    db.add(attachment)
    db.commit()
    
    return {"message": "File uploaded", "filename": file.filename}


@router.get("/tickets/{ticket_id}/satisfaction")
async def get_satisfaction(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get satisfaction survey for ticket"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check if already submitted
    existing = db.query(CustomerSatisfaction).filter(
        CustomerSatisfaction.ticket_id == ticket_id
    ).first()
    
    return {
        "ticket_id": ticket_id,
        "ticket_number": ticket.ticket_number,
        "already_submitted": existing is not None,
        "rating": existing.rating if existing else None,
        "feedback": existing.feedback if existing else None
    }


@router.post("/tickets/{ticket_id}/satisfaction")
async def submit_satisfaction(
    ticket_id: int,
    satisfaction_data: SatisfactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit satisfaction survey"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Verify user is ticket submitter
    if ticket.submitter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify ticket is resolved
    if ticket.status not in ["resolved", "closed"]:
        raise HTTPException(status_code=400, detail="Can only rate resolved tickets")
    
    # Validate rating
    if not 1 <= satisfaction_data.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if already submitted
    existing = db.query(CustomerSatisfaction).filter(
        CustomerSatisfaction.ticket_id == ticket_id
    ).first()
    
    if existing:
        # Update existing
        existing.rating = satisfaction_data.rating
        existing.feedback = satisfaction_data.feedback
    else:
        # Create new
        satisfaction = CustomerSatisfaction(
            ticket_id=ticket_id,
            rating=satisfaction_data.rating,
            feedback=satisfaction_data.feedback
        )
        db.add(satisfaction)
    
    db.commit()
    
    return {"message": "Thank you for your feedback!"}


@router.get("/templates")
async def get_templates(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ticket templates for quick ticket creation"""
    query = db.query(TicketTemplate)
    
    if category:
        query = query.filter(TicketTemplate.category == category)
    
    templates = query.all()
    
    return {
        "templates": [
            {
                "id": template.id,
                "name": template.name,
                "category": template.category,
                "title_template": template.title_template,
                "description_template": template.description_template,
                "default_priority": template.default_priority
            }
            for template in templates
        ]
    }


@router.get("/mentions")
async def get_mentions(
    is_read: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get mentions for current user"""
    query = db.query(Mention).filter(Mention.user_id == current_user.id)
    
    if is_read is not None:
        query = query.filter(Mention.is_read == is_read)
    
    mentions = query.order_by(Mention.created_at.desc()).all()
    
    return {
        "mentions": [
            {
                "id": mention.id,
                "ticket_id": mention.ticket_id,
                "comment_id": mention.comment_id,
                "is_read": mention.is_read,
                "created_at": mention.created_at.isoformat()
            }
            for mention in mentions
        ]
    }


@router.put("/mentions/{mention_id}/read")
async def mark_mention_read(
    mention_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark mention as read"""
    mention = db.query(Mention).filter(
        Mention.id == mention_id,
        Mention.user_id == current_user.id
    ).first()
    
    if not mention:
        raise HTTPException(status_code=404, detail="Mention not found")
    
    mention.is_read = True
    db.commit()
    
    return {"message": "Mention marked as read"}
