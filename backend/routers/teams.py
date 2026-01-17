"""
API endpoints for Teams Management
Uses shared CRUD patterns to eliminate code duplication
"""
from typing import Optional
from pydantic import BaseModel

from shared.router_factory import create_crud_router
from shared.crud import CRUDBase
from models import Team, TeamMember, User


# Pydantic schemas
class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    team_lead_id: Optional[int] = None
    email: Optional[str] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    team_lead_id: Optional[int] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class TeamMemberAdd(BaseModel):
    user_id: int
    role: str = "member"


# Create CRUD operations for teams
team_crud = CRUDBase(Team)

# Use router factory to create standardized endpoints
router = create_crud_router(
    model=Team,
    create_schema=TeamCreate,
    update_schema=TeamUpdate,
    crud_operations=team_crud,
    route_prefix="",
    tags=["Teams"]
)
    
    return {
        "teams": [
            {
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "team_lead_id": team.team_lead_id,
                "email": team.email,
                "is_active": team.is_active,
                "member_count": len(team.members),
                "created_at": team.created_at.isoformat()
            }
            for team in teams
        ]
    }


@router.get("/{team_id}")
async def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get team details"""
    team = db.query(Team).filter(Team.id == team_id).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "team_lead_id": team.team_lead_id,
        "email": team.email,
        "is_active": team.is_active,
        "created_at": team.created_at.isoformat(),
        "members": [
            {
                "id": member.id,
                "user_id": member.user_id,
                "role": member.role,
                "joined_at": member.joined_at.isoformat()
            }
            for member in members
        ]
    }


@router.post("/")
async def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new team"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    team = Team(
        name=team_data.name,
        description=team_data.description,
        team_lead_id=team_data.team_lead_id,
        email=team_data.email
    )
    
    db.add(team)
    db.commit()
    db.refresh(team)
    
    return {"message": "Team created", "team_id": team.id}


@router.put("/{team_id}")
async def update_team(
    team_id: int,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update team"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    team = db.query(Team).filter(Team.id == team_id).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    for key, value in team_data.dict(exclude_unset=True).items():
        setattr(team, key, value)
    
    db.commit()
    
    return {"message": "Team updated"}


@router.post("/{team_id}/members")
async def add_team_member(
    team_id: int,
    member_data: TeamMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add member to team"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if user exists
    user = db.query(User).filter(User.id == member_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already member
    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == member_data.user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User already in team")
    
    member = TeamMember(
        team_id=team_id,
        user_id=member_data.user_id,
        role=member_data.role
    )
    
    db.add(member)
    db.commit()
    
    return {"message": "Member added to team"}


@router.delete("/{team_id}/members/{user_id}")
async def remove_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove member from team"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in team")
    
    db.delete(member)
    db.commit()
    
    return {"message": "Member removed from team"}
