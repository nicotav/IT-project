"""
Shared CRUD operations and database utilities
Eliminates repetitive database patterns across all routers
"""
from typing import Type, TypeVar, Generic, List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.ext.declarative import DeclarativeMeta
from sqlalchemy import or_, and_, func
from fastapi import HTTPException, status
from pydantic import BaseModel
from datetime import datetime

ModelType = TypeVar("ModelType", bound=DeclarativeMeta)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Generic CRUD operations class - eliminates duplicate CRUD patterns
    """
    
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: int) -> Optional[ModelType]:
        """Get single record by ID"""
        return db.query(self.model).filter(self.model.id == id).first()

    def get_or_404(self, db: Session, id: int, detail: str = None) -> ModelType:
        """Get record or raise 404"""
        obj = self.get(db, id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=detail or f"{self.model.__name__} not found"
            )
        return obj

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Dict[str, Any] = None,
        search: str = None,
        search_fields: List[str] = None
    ) -> List[ModelType]:
        """Get multiple records with filtering and search"""
        query = db.query(self.model)

        # Apply filters
        if filters:
            for field, value in filters.items():
                if value is not None and hasattr(self.model, field):
                    attr = getattr(self.model, field)
                    if isinstance(value, list):
                        query = query.filter(attr.in_(value))
                    else:
                        query = query.filter(attr == value)

        # Apply search
        if search and search_fields:
            search_clauses = []
            for field in search_fields:
                if hasattr(self.model, field):
                    attr = getattr(self.model, field)
                    search_clauses.append(attr.ilike(f"%{search}%"))
            if search_clauses:
                query = query.filter(or_(*search_clauses))

        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType, **kwargs) -> ModelType:
        """Create new record"""
        obj_data = obj_in.dict() if hasattr(obj_in, 'dict') else obj_in
        obj_data.update(kwargs)
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, 
        db: Session, 
        *, 
        db_obj: ModelType, 
        obj_in: UpdateSchemaType
    ) -> ModelType:
        """Update existing record"""
        update_data = obj_in.dict(exclude_unset=True) if hasattr(obj_in, 'dict') else obj_in
        
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        # Auto-update timestamps if model has them
        if hasattr(db_obj, 'updated_at'):
            setattr(db_obj, 'updated_at', datetime.utcnow())
            
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, id: int) -> ModelType:
        """Delete record"""
        obj = self.get_or_404(db, id)
        db.delete(obj)
        db.commit()
        return obj

    def soft_delete(self, db: Session, *, id: int) -> ModelType:
        """Soft delete (mark as inactive)"""
        obj = self.get_or_404(db, id)
        if hasattr(obj, 'is_active'):
            obj.is_active = False
            db.add(obj)
            db.commit()
            db.refresh(obj)
        return obj

    def count(self, db: Session, filters: Dict[str, Any] = None) -> int:
        """Count records with optional filters"""
        query = db.query(func.count(self.model.id))
        
        if filters:
            for field, value in filters.items():
                if value is not None and hasattr(self.model, field):
                    attr = getattr(self.model, field)
                    query = query.filter(attr == value)
                    
        return query.scalar()


def to_dict(obj: Any, exclude: List[str] = None) -> Dict[str, Any]:
    """Convert SQLAlchemy model to dictionary"""
    exclude = exclude or []
    result = {}
    
    for column in obj.__table__.columns:
        if column.name not in exclude:
            value = getattr(obj, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
            
    return result


def serialize_list(items: List[Any], exclude: List[str] = None) -> List[Dict[str, Any]]:
    """Serialize list of SQLAlchemy models"""
    return [to_dict(item, exclude) for item in items]


class APIResponse:
    """Standardized API response helpers"""
    
    @staticmethod
    def success(data: Any = None, message: str = "Success") -> Dict[str, Any]:
        """Standard success response"""
        response = {"success": True, "message": message}
        if data is not None:
            response["data"] = data
        return response

    @staticmethod
    def created(data: Any = None, message: str = "Created successfully") -> Dict[str, Any]:
        """Standard creation response"""
        response = {"success": True, "message": message}
        if data is not None:
            response["data"] = data
        return response

    @staticmethod
    def list_response(items: List[Any], total: int = None, page: int = 1) -> Dict[str, Any]:
        """Standard list response"""
        response = {
            "success": True,
            "items": items,
            "count": len(items)
        }
        if total is not None:
            response["total"] = total
            response["page"] = page
        return response