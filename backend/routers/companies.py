"""
API endpoints for Company & Asset Management
Uses shared CRUD patterns to eliminate code duplication
"""
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from shared.router_factory import create_crud_router
from shared.crud import CRUDBase
from models import Company, CompanyContact, Asset


# Pydantic schemas
class CompanyCreate(BaseModel):
    name: str
    domain: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    contract_start: Optional[datetime] = None
    contract_end: Optional[datetime] = None
    notes: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    contract_start: Optional[datetime] = None
    contract_end: Optional[datetime] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_primary: bool = False
    user_id: Optional[int] = None


# Create CRUD operations
company_crud = CRUDBase(Company)

# Use router factory for standard CRUD endpoints
router = create_crud_router(
    model=Company,
    create_schema=CompanyCreate,
    update_schema=CompanyUpdate,
    crud_operations=company_crud,
    route_prefix="",
    tags=["Companies"]
)


class AssetCreate(BaseModel):
    asset_tag: str
    name: str
    asset_type: str
    company_id: Optional[int] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    cost: Optional[float] = None
    location: Optional[str] = None
    assigned_to: Optional[int] = None
    status: str = "active"
    notes: Optional[str] = None
    specifications: Optional[str] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    company_id: Optional[int] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    cost: Optional[float] = None
    location: Optional[str] = None
    assigned_to: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    specifications: Optional[str] = None


# ============= Companies =============
@router.get("/")
async def get_companies(
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all companies"""
    query = db.query(Company)
    
    if is_active is not None:
        query = query.filter(Company.is_active == is_active)
    
    if search:
        query = query.filter(
            or_(
                Company.name.ilike(f"%{search}%"),
                Company.domain.ilike(f"%{search}%")
            )
        )
    
    companies = query.all()
    
    return {
        "companies": [
            {
                "id": company.id,
                "name": company.name,
                "domain": company.domain,
                "email": company.email,
                "phone": company.phone,
                "is_active": company.is_active,
                "asset_count": len(company.assets),
                "contact_count": len(company.contacts),
                "created_at": company.created_at.isoformat()
            }
            for company in companies
        ]
    }


@router.get("/{company_id}")
async def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get company details"""
    company = db.query(Company).filter(Company.id == company_id).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {
        "id": company.id,
        "name": company.name,
        "domain": company.domain,
        "address": company.address,
        "phone": company.phone,
        "email": company.email,
        "website": company.website,
        "contract_start": company.contract_start.isoformat() if company.contract_start else None,
        "contract_end": company.contract_end.isoformat() if company.contract_end else None,
        "is_active": company.is_active,
        "notes": company.notes,
        "created_at": company.created_at.isoformat(),
        "contacts": [
            {
                "id": contact.id,
                "name": contact.name,
                "email": contact.email,
                "phone": contact.phone,
                "role": contact.role,
                "is_primary": contact.is_primary
            }
            for contact in company.contacts
        ],
        "assets": [
            {
                "id": asset.id,
                "asset_tag": asset.asset_tag,
                "name": asset.name,
                "asset_type": asset.asset_type,
                "status": asset.status
            }
            for asset in company.assets
        ]
    }


@router.post("/")
async def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new company"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    company = Company(**company_data.dict())
    
    db.add(company)
    db.commit()
    db.refresh(company)
    
    return {"message": "Company created", "company_id": company.id}


@router.put("/{company_id}")
async def update_company(
    company_id: int,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update company"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    company = db.query(Company).filter(Company.id == company_id).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    for key, value in company_data.dict(exclude_unset=True).items():
        setattr(company, key, value)
    
    db.commit()
    
    return {"message": "Company updated"}


# ============= Contacts =============
@router.post("/{company_id}/contacts")
async def add_contact(
    company_id: int,
    contact_data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add contact to company"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    contact = CompanyContact(
        company_id=company_id,
        **contact_data.dict()
    )
    
    db.add(contact)
    db.commit()
    
    return {"message": "Contact added"}


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete contact"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    contact = db.query(CompanyContact).filter(CompanyContact.id == contact_id).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    
    return {"message": "Contact deleted"}


# ============= Assets =============
@router.get("/assets/")
async def get_assets(
    company_id: Optional[int] = None,
    asset_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all assets"""
    query = db.query(Asset)
    
    if company_id:
        query = query.filter(Asset.company_id == company_id)
    
    if asset_type:
        query = query.filter(Asset.asset_type == asset_type)
    
    if status:
        query = query.filter(Asset.status == status)
    
    if search:
        query = query.filter(
            or_(
                Asset.name.ilike(f"%{search}%"),
                Asset.asset_tag.ilike(f"%{search}%"),
                Asset.serial_number.ilike(f"%{search}%")
            )
        )
    
    assets = query.all()
    
    return {
        "assets": [
            {
                "id": asset.id,
                "asset_tag": asset.asset_tag,
                "name": asset.name,
                "asset_type": asset.asset_type,
                "company_id": asset.company_id,
                "manufacturer": asset.manufacturer,
                "model": asset.model,
                "serial_number": asset.serial_number,
                "location": asset.location,
                "assigned_to": asset.assigned_to,
                "status": asset.status,
                "created_at": asset.created_at.isoformat()
            }
            for asset in assets
        ]
    }


@router.get("/assets/{asset_id}")
async def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get asset details"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return {
        "id": asset.id,
        "asset_tag": asset.asset_tag,
        "name": asset.name,
        "asset_type": asset.asset_type,
        "company_id": asset.company_id,
        "manufacturer": asset.manufacturer,
        "model": asset.model,
        "serial_number": asset.serial_number,
        "purchase_date": asset.purchase_date.isoformat() if asset.purchase_date else None,
        "warranty_expiry": asset.warranty_expiry.isoformat() if asset.warranty_expiry else None,
        "cost": asset.cost,
        "location": asset.location,
        "assigned_to": asset.assigned_to,
        "status": asset.status,
        "notes": asset.notes,
        "specifications": asset.specifications,
        "created_at": asset.created_at.isoformat(),
        "updated_at": asset.updated_at.isoformat()
    }


@router.post("/assets/")
async def create_asset(
    asset_data: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new asset"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if asset_tag already exists
    existing = db.query(Asset).filter(Asset.asset_tag == asset_data.asset_tag).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset tag already exists")
    
    asset = Asset(**asset_data.dict())
    
    db.add(asset)
    db.commit()
    db.refresh(asset)
    
    return {"message": "Asset created", "asset_id": asset.id}


@router.put("/assets/{asset_id}")
async def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update asset"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    for key, value in asset_data.dict(exclude_unset=True).items():
        setattr(asset, key, value)
    
    db.commit()
    
    return {"message": "Asset updated"}


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete asset"""
    if current_user.role not in ["admin", "technician"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    db.delete(asset)
    db.commit()
    
    return {"message": "Asset deleted"}
