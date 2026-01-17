"""
API endpoints for Appointment Scheduler
Uses shared CRUD patterns to eliminate code duplication
"""
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from shared.router_factory import create_crud_router
from shared.crud import CRUDBase
from models import Appointment


# Pydantic schemas
class AppointmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    ticket_id: Optional[int] = None
    customer_id: int
    technician_id: int
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    meeting_link: Optional[str] = None


class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    status: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


# Create CRUD operations
appointment_crud = CRUDBase(Appointment)

# Use router factory for standard CRUD endpoints
router = create_crud_router(
    model=Appointment,
    create_schema=AppointmentCreate,
    update_schema=AppointmentUpdate,
    crud_operations=appointment_crud,
    route_prefix="",
    tags=["Appointments"]
)
        )
    )
    
    if exclude_id:
        query = query.filter(Appointment.id != exclude_id)
    
    return query.count() == 0


@router.get("/")
async def get_appointments(
    technician_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get appointments with filtering"""
    query = db.query(Appointment)
    
    if technician_id:
        query = query.filter(Appointment.technician_id == technician_id)
    
    if customer_id:
        query = query.filter(Appointment.customer_id == customer_id)
    
    if status:
        query = query.filter(Appointment.status == status)
    
    if start_date:
        query = query.filter(Appointment.start_time >= start_date)
    
    if end_date:
        query = query.filter(Appointment.end_time <= end_date)
    
    appointments = query.order_by(Appointment.start_time).all()
    
    return {
        "appointments": [
            {
                "id": appt.id,
                "title": appt.title,
                "description": appt.description,
                "ticket_id": appt.ticket_id,
                "customer_id": appt.customer_id,
                "technician_id": appt.technician_id,
                "start_time": appt.start_time.isoformat(),
                "end_time": appt.end_time.isoformat(),
                "location": appt.location,
                "status": appt.status,
                "meeting_link": appt.meeting_link,
                "notes": appt.notes,
                "created_at": appt.created_at.isoformat()
            }
            for appt in appointments
        ]
    }


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get appointment details"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return {
        "id": appointment.id,
        "title": appointment.title,
        "description": appointment.description,
        "ticket_id": appointment.ticket_id,
        "customer_id": appointment.customer_id,
        "technician_id": appointment.technician_id,
        "start_time": appointment.start_time.isoformat(),
        "end_time": appointment.end_time.isoformat(),
        "location": appointment.location,
        "status": appointment.status,
        "meeting_link": appointment.meeting_link,
        "notes": appointment.notes,
        "reminder_sent": appointment.reminder_sent,
        "created_at": appointment.created_at.isoformat(),
        "updated_at": appointment.updated_at.isoformat()
    }


@router.post("/")
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new appointment"""
    # Validate start and end times
    if appointment_data.start_time >= appointment_data.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    # Check technician availability
    if not check_availability(db, appointment_data.technician_id, appointment_data.start_time, appointment_data.end_time):
        raise HTTPException(status_code=400, detail="Technician is not available at this time")
    
    appointment = Appointment(
        title=appointment_data.title,
        description=appointment_data.description,
        ticket_id=appointment_data.ticket_id,
        customer_id=appointment_data.customer_id,
        technician_id=appointment_data.technician_id,
        start_time=appointment_data.start_time,
        end_time=appointment_data.end_time,
        location=appointment_data.location,
        meeting_link=appointment_data.meeting_link
    )
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    return {"message": "Appointment created", "appointment_id": appointment.id}


@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: int,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # If updating times, check availability
    new_start = appointment_data.start_time or appointment.start_time
    new_end = appointment_data.end_time or appointment.end_time
    
    if new_start >= new_end:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    if appointment_data.start_time or appointment_data.end_time:
        if not check_availability(db, appointment.technician_id, new_start, new_end, appointment_id):
            raise HTTPException(status_code=400, detail="Technician is not available at this time")
    
    for key, value in appointment_data.dict(exclude_unset=True).items():
        setattr(appointment, key, value)
    
    db.commit()
    
    return {"message": "Appointment updated"}


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel/delete appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = "cancelled"
    db.commit()
    
    return {"message": "Appointment cancelled"}


@router.get("/availability/{technician_id}")
async def get_availability(
    technician_id: int,
    date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get technician availability for a specific day"""
    start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    appointments = db.query(Appointment).filter(
        Appointment.technician_id == technician_id,
        Appointment.status.in_(["scheduled", "confirmed"]),
        Appointment.start_time >= start_of_day,
        Appointment.start_time < end_of_day
    ).order_by(Appointment.start_time).all()
    
    # Working hours: 9 AM to 5 PM
    working_start = start_of_day.replace(hour=9)
    working_end = start_of_day.replace(hour=17)
    
    busy_slots = [
        {
            "start": appt.start_time.isoformat(),
            "end": appt.end_time.isoformat()
        }
        for appt in appointments
    ]
    
    return {
        "technician_id": technician_id,
        "date": date.date().isoformat(),
        "working_hours": {
            "start": working_start.isoformat(),
            "end": working_end.isoformat()
        },
        "busy_slots": busy_slots
    }
