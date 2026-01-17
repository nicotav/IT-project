"""
Enhanced router factory with advanced patterns for complex endpoints
Reduces duplicate code in more sophisticated routers
"""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from database import get_db
from auth import get_current_user
from models import User
from shared.crud import CRUDBase
from shared.utils import admin_required, paginate_query, StandardResponse


def create_advanced_router(
    model,
    create_schema,
    update_schema,
    crud_operations: CRUDBase,
    route_prefix: str = "",
    tags: List[str] = None,
    custom_endpoints: Dict = None,
    permissions_required: bool = True,
    enable_search: bool = True,
    enable_filters: bool = True,
    enable_export: bool = False
) -> APIRouter:
    """
    Creates an advanced CRUD router with additional features:
    - Search functionality
    - Advanced filtering
    - Bulk operations  
    - Export capabilities
    - Custom endpoint integration
    """
    router = APIRouter(prefix=route_prefix, tags=tags or [])
    
    # Standard GET all with filtering and search
    @router.get("/", response_model=StandardResponse)
    async def get_items(
        skip: int = Query(0, ge=0, description="Number of items to skip"),
        limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
        search: Optional[str] = Query(None, description="Search query"),
        sort_by: Optional[str] = Query(None, description="Field to sort by"),
        sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user) if permissions_required else None
    ):
        """Get all items with optional search and filtering"""
        try:
            items, total = crud_operations.get_multi_with_search(
                db, 
                skip=skip, 
                limit=limit,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
            
            return StandardResponse(
                success=True,
                data=items,
                meta={
                    "total": total,
                    "skip": skip,
                    "limit": limit,
                    "has_more": skip + limit < total
                }
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Standard GET by ID
    @router.get("/{item_id}", response_model=StandardResponse)
    async def get_item(
        item_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user) if permissions_required else None
    ):
        """Get a single item by ID"""
        item = crud_operations.get(db, id=item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        return StandardResponse(success=True, data=item)

    # Standard CREATE
    @router.post("/", response_model=StandardResponse)
    async def create_item(
        item: create_schema,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user) if permissions_required else None
    ):
        """Create a new item"""
        try:
            # Add created_by if model has it
            item_data = item.dict()
            if hasattr(model, 'created_by') and current_user:
                item_data['created_by'] = current_user.id
            
            new_item = crud_operations.create(db, obj_in=item_data)
            
            # Add background task for audit logging if needed
            if hasattr(model, '__tablename__'):
                background_tasks.add_task(
                    log_audit_event,
                    action="create",
                    table=model.__tablename__,
                    item_id=new_item.id,
                    user_id=current_user.id if current_user else None
                )
            
            return StandardResponse(
                success=True,
                data=new_item,
                message=f"{model.__name__} created successfully"
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    # Standard UPDATE
    @router.put("/{item_id}", response_model=StandardResponse)
    async def update_item(
        item_id: int,
        item: update_schema,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user) if permissions_required else None
    ):
        """Update an existing item"""
        existing_item = crud_operations.get(db, id=item_id)
        if not existing_item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        try:
            # Add updated_by if model has it
            item_data = item.dict(exclude_unset=True)
            if hasattr(model, 'updated_by') and current_user:
                item_data['updated_by'] = current_user.id
            
            updated_item = crud_operations.update(db, db_obj=existing_item, obj_in=item_data)
            
            # Add background task for audit logging
            if hasattr(model, '__tablename__'):
                background_tasks.add_task(
                    log_audit_event,
                    action="update",
                    table=model.__tablename__,
                    item_id=item_id,
                    user_id=current_user.id if current_user else None
                )
            
            return StandardResponse(
                success=True,
                data=updated_item,
                message=f"{model.__name__} updated successfully"
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    # Standard DELETE
    @router.delete("/{item_id}", response_model=StandardResponse)
    async def delete_item(
        item_id: int,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user) if permissions_required else None
    ):
        """Delete an item"""
        item = crud_operations.get(db, id=item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        try:
            crud_operations.remove(db, id=item_id)
            
            # Add background task for audit logging
            if hasattr(model, '__tablename__'):
                background_tasks.add_task(
                    log_audit_event,
                    action="delete",
                    table=model.__tablename__,
                    item_id=item_id,
                    user_id=current_user.id if current_user else None
                )
            
            return StandardResponse(
                success=True,
                message=f"{model.__name__} deleted successfully"
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    # Bulk operations
    @router.post("/bulk", response_model=StandardResponse)
    async def bulk_create(
        items: List[create_schema],
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user) if permissions_required else None
    ):
        """Bulk create multiple items"""
        try:
            created_items = []
            for item_data in items:
                item_dict = item_data.dict()
                if hasattr(model, 'created_by') and current_user:
                    item_dict['created_by'] = current_user.id
                
                new_item = crud_operations.create(db, obj_in=item_dict)
                created_items.append(new_item)
            
            return StandardResponse(
                success=True,
                data=created_items,
                message=f"Created {len(created_items)} {model.__name__}s successfully"
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.put("/bulk", response_model=StandardResponse)
    async def bulk_update(
        updates: List[Dict[str, Any]],
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user) if permissions_required else None
    ):
        """Bulk update multiple items"""
        try:
            updated_items = []
            for update_data in updates:
                item_id = update_data.pop('id')
                existing_item = crud_operations.get(db, id=item_id)
                if existing_item:
                    if hasattr(model, 'updated_by') and current_user:
                        update_data['updated_by'] = current_user.id
                    
                    updated_item = crud_operations.update(db, db_obj=existing_item, obj_in=update_data)
                    updated_items.append(updated_item)
            
            return StandardResponse(
                success=True,
                data=updated_items,
                message=f"Updated {len(updated_items)} {model.__name__}s successfully"
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.delete("/bulk", response_model=StandardResponse)
    async def bulk_delete(
        item_ids: List[int],
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user) if permissions_required else None
    ):
        """Bulk delete multiple items"""
        try:
            deleted_count = 0
            for item_id in item_ids:
                if crud_operations.get(db, id=item_id):
                    crud_operations.remove(db, id=item_id)
                    deleted_count += 1
            
            return StandardResponse(
                success=True,
                message=f"Deleted {deleted_count} {model.__name__}s successfully"
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    # Export functionality
    if enable_export:
        @router.get("/export/csv", response_class="text/csv")
        async def export_csv(
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user) if permissions_required else None
        ):
            """Export all items as CSV"""
            items, _ = crud_operations.get_multi(db, limit=10000)
            return crud_operations.export_to_csv(items)

    # Add custom endpoints if provided
    if custom_endpoints:
        for endpoint_name, endpoint_func in custom_endpoints.items():
            router.add_api_route(
                f"/{endpoint_name}",
                endpoint_func,
                methods=["GET", "POST"],
                tags=tags
            )

    return router


async def log_audit_event(action: str, table: str, item_id: int, user_id: Optional[int]):
    """Background task for audit logging"""
    # Implementation would log to audit table or external service
    pass


class BulkUpdateRequest(BaseModel):
    """Schema for bulk update requests"""
    ids: List[int]
    updates: Dict[str, Any]


class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete requests"""
    ids: List[int]
    reason: Optional[str] = None