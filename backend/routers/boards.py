"""
API endpoints for Kanban Boards
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from auth import get_current_user
from models import User, Board, BoardColumn, BoardCard, Ticket

router = APIRouter()


# Pydantic schemas
class BoardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    team_id: Optional[int] = None


class BoardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ColumnCreate(BaseModel):
    name: str
    position: int = 0
    wip_limit: Optional[int] = None
    color: Optional[str] = None


class ColumnUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[int] = None
    wip_limit: Optional[int] = None
    color: Optional[str] = None


class CardMove(BaseModel):
    column_id: int
    position: int


@router.get("/")
async def get_boards(
    team_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all boards"""
    query = db.query(Board).filter(Board.is_active == True)
    
    if team_id:
        query = query.filter(Board.team_id == team_id)
    
    boards = query.all()
    
    return {
        "boards": [
            {
                "id": board.id,
                "name": board.name,
                "description": board.description,
                "team_id": board.team_id,
                "created_by": board.created_by,
                "columns_count": len(board.columns),
                "created_at": board.created_at.isoformat()
            }
            for board in boards
        ]
    }


@router.get("/{board_id}")
async def get_board(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get board with columns and cards"""
    board = db.query(Board).filter(Board.id == board_id).first()
    
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    columns_data = []
    for column in board.columns:
        cards = db.query(BoardCard, Ticket).join(
            Ticket, BoardCard.ticket_id == Ticket.id
        ).filter(
            BoardCard.board_column_id == column.id
        ).order_by(BoardCard.position).all()
        
        columns_data.append({
            "id": column.id,
            "name": column.name,
            "position": column.position,
            "wip_limit": column.wip_limit,
            "color": column.color,
            "cards": [
                {
                    "id": card.id,
                    "position": card.position,
                    "ticket": {
                        "id": ticket.id,
                        "ticket_number": ticket.ticket_number,
                        "title": ticket.title,
                        "status": ticket.status,
                        "priority": ticket.priority,
                        "assigned_to": ticket.assigned_to
                    }
                }
                for card, ticket in cards
            ]
        })
    
    return {
        "id": board.id,
        "name": board.name,
        "description": board.description,
        "team_id": board.team_id,
        "created_by": board.created_by,
        "columns": columns_data
    }


@router.post("/")
async def create_board(
    board_data: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new board"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    board = Board(
        name=board_data.name,
        description=board_data.description,
        team_id=board_data.team_id,
        created_by=current_user.id
    )
    
    db.add(board)
    db.commit()
    db.refresh(board)
    
    # Create default columns
    default_columns = [
        {"name": "Backlog", "position": 0, "color": "#95A5A6"},
        {"name": "To Do", "position": 1, "color": "#3498DB"},
        {"name": "In Progress", "position": 2, "color": "#F39C12"},
        {"name": "Testing", "position": 3, "color": "#9B59B6"},
        {"name": "Done", "position": 4, "color": "#27AE60"}
    ]
    
    for col_data in default_columns:
        column = BoardColumn(
            board_id=board.id,
            name=col_data["name"],
            position=col_data["position"],
            color=col_data["color"]
        )
        db.add(column)
    
    db.commit()
    
    return {"message": "Board created", "board_id": board.id}


@router.put("/{board_id}")
async def update_board(
    board_id: int,
    board_data: BoardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update board"""
    board = db.query(Board).filter(Board.id == board_id).first()
    
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    for key, value in board_data.dict(exclude_unset=True).items():
        setattr(board, key, value)
    
    db.commit()
    
    return {"message": "Board updated"}


@router.post("/{board_id}/columns")
async def create_column(
    board_id: int,
    column_data: ColumnCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new column"""
    board = db.query(Board).filter(Board.id == board_id).first()
    
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    column = BoardColumn(
        board_id=board_id,
        name=column_data.name,
        position=column_data.position,
        wip_limit=column_data.wip_limit,
        color=column_data.color
    )
    
    db.add(column)
    db.commit()
    db.refresh(column)
    
    return {"message": "Column created", "column_id": column.id}


@router.put("/columns/{column_id}")
async def update_column(
    column_id: int,
    column_data: ColumnUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update column"""
    column = db.query(BoardColumn).filter(BoardColumn.id == column_id).first()
    
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    
    for key, value in column_data.dict(exclude_unset=True).items():
        setattr(column, key, value)
    
    db.commit()
    
    return {"message": "Column updated"}


@router.delete("/columns/{column_id}")
async def delete_column(
    column_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete column"""
    column = db.query(BoardColumn).filter(BoardColumn.id == column_id).first()
    
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    
    # Delete all cards in column
    db.query(BoardCard).filter(BoardCard.board_column_id == column_id).delete()
    db.delete(column)
    db.commit()
    
    return {"message": "Column deleted"}


@router.post("/{board_id}/cards/{ticket_id}")
async def add_card(
    board_id: int,
    ticket_id: int,
    column_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add ticket to board"""
    # Verify board and column exist
    column = db.query(BoardColumn).filter(
        BoardColumn.id == column_id,
        BoardColumn.board_id == board_id
    ).first()
    
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    
    # Verify ticket exists
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check if card already exists
    existing = db.query(BoardCard).join(BoardColumn).filter(
        BoardCard.ticket_id == ticket_id,
        BoardColumn.board_id == board_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Ticket already on this board")
    
    # Get position
    max_position = db.query(func.max(BoardCard.position)).filter(
        BoardCard.board_column_id == column_id
    ).scalar() or -1
    
    card = BoardCard(
        board_column_id=column_id,
        ticket_id=ticket_id,
        position=max_position + 1
    )
    
    db.add(card)
    db.commit()
    
    return {"message": "Card added to board"}


@router.put("/cards/{card_id}/move")
async def move_card(
    card_id: int,
    move_data: CardMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Move card to different column/position"""
    card = db.query(BoardCard).filter(BoardCard.id == card_id).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    old_column_id = card.board_column_id
    old_position = card.position
    
    # Update card
    card.board_column_id = move_data.column_id
    card.position = move_data.position
    
    # Reorder cards in old column if changed
    if old_column_id != move_data.column_id:
        db.query(BoardCard).filter(
            BoardCard.board_column_id == old_column_id,
            BoardCard.position > old_position
        ).update({BoardCard.position: BoardCard.position - 1})
    
    # Reorder cards in new column
    db.query(BoardCard).filter(
        BoardCard.board_column_id == move_data.column_id,
        BoardCard.id != card_id,
        BoardCard.position >= move_data.position
    ).update({BoardCard.position: BoardCard.position + 1})
    
    db.commit()
    
    return {"message": "Card moved"}


@router.delete("/cards/{card_id}")
async def remove_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove card from board"""
    card = db.query(BoardCard).filter(BoardCard.id == card_id).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    db.delete(card)
    db.commit()
    
    return {"message": "Card removed"}
