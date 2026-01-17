"""
Shared utilities and decorators for FastAPI routes
Eliminates duplicate patterns across router modules
"""
from functools import wraps
from typing import Callable, Dict, Any, Optional
from fastapi import Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import User


def admin_required(func: Callable) -> Callable:
    """Decorator to require admin role"""
    @wraps(func)
    async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper


def owner_or_admin_required(model_class, id_field: str = "id"):
    """Decorator to require ownership or admin role"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), **kwargs):
            # Get the ID from kwargs
            resource_id = kwargs.get(id_field)
            
            if current_user.role == "admin":
                return await func(*args, db=db, current_user=current_user, **kwargs)
            
            # Check ownership
            resource = db.query(model_class).filter(getattr(model_class, id_field) == resource_id).first()
            if not resource:
                raise HTTPException(status_code=404, detail="Resource not found")
            
            # Check if user owns the resource (assuming created_by or user_id field)
            owner_field = getattr(resource, 'created_by', None) or getattr(resource, 'user_id', None)
            if owner_field != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access this resource"
                )
            
            return await func(*args, db=db, current_user=current_user, **kwargs)
        return wrapper
    return decorator


class CommonParams:
    """Common query parameters for list endpoints"""
    
    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Number of items to skip"),
        limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
        search: Optional[str] = Query(None, description="Search term"),
        sort_by: Optional[str] = Query(None, description="Field to sort by"),
        sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$", description="Sort order")
    ):
        self.skip = skip
        self.limit = limit
        self.search = search
        self.sort_by = sort_by
        self.sort_order = sort_order


def create_filter_params(**filter_fields) -> Callable:
    """Create a dynamic filter parameters class"""
    def filter_params(
        common: CommonParams = Depends(),
        **kwargs
    ):
        # Dynamic filter parameters based on filter_fields
        filters = {}
        for field_name, field_type in filter_fields.items():
            value = kwargs.get(field_name)
            if value is not None:
                filters[field_name] = value
        
        return {
            "skip": common.skip,
            "limit": common.limit,
            "search": common.search,
            "sort_by": common.sort_by,
            "sort_order": common.sort_order,
            "filters": filters
        }
    
    return filter_params


def standardize_response(data: Any, message: str = "Success") -> Dict[str, Any]:
    """Standardize API response format"""
    if isinstance(data, list):
        return {
            "success": True,
            "message": message,
            "items": data,
            "count": len(data)
        }
    else:
        return {
            "success": True,
            "message": message,
            "data": data
        }


def handle_exceptions(func: Callable) -> Callable:
    """Generic exception handler decorator"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # Log the error in production
            print(f"Unexpected error in {func.__name__}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred"
            )
    return wrapper


# Common validation functions
def validate_date_range(start_date: Optional[str], end_date: Optional[str]) -> Dict[str, Any]:
    """Validate and parse date range parameters"""
    from datetime import datetime, timedelta
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    else:
        end_dt = datetime.utcnow()
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    else:
        start_dt = end_dt - timedelta(days=30)
    
    if start_dt >= end_dt:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    return {"start_date": start_dt, "end_date": end_dt}


# Common pagination helper
def paginate_query(query, skip: int = 0, limit: int = 50):
    """Apply pagination to SQLAlchemy query"""
    return query.offset(skip).limit(limit)


# Response helpers for common patterns
class ResponseTemplates:
    """Common response templates"""
    
    @staticmethod
    def not_found(resource_name: str = "Resource"):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name} not found"
        )
    
    @staticmethod
    def forbidden(message: str = "Access forbidden"):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message
        )
    
    @staticmethod
    def bad_request(message: str = "Bad request"):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )