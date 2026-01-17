"""
API endpoints for Knowledge Base system
Uses advanced router patterns to eliminate duplicate CRUD code
"""
from typing import Optional, List
from pydantic import BaseModel

from shared.advanced_router import create_advanced_router
from shared.crud import CRUDBase
from models import (
    KnowledgeArticle, KnowledgeCategory, 
    ArticleVersion, ArticleFavorite, ArticleComment
)


# Pydantic schemas
class ArticleCreate(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    category_id: int
    article_type: str = "reference"  # workflow, reference, snippet
    tags: Optional[str] = None
    itil_process: Optional[str] = None
    is_published: bool = False
    workflow_steps: Optional[List[dict]] = None


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    category_id: Optional[int] = None
    article_type: Optional[str] = None
    tags: Optional[str] = None
    itil_process: Optional[str] = None
    is_published: Optional[bool] = None
    change_description: Optional[str] = None
    workflow_steps: Optional[List[dict]] = None


class CommentCreate(BaseModel):
    comment: str


# Create CRUD operations
article_crud = CRUDBase(KnowledgeArticle)

# Custom endpoints for knowledge-specific functionality
async def search_articles(query: str, db):
    """Custom endpoint for full-text search"""
    # Implementation would be here
    pass

async def get_article_versions(article_id: int, db):
    """Custom endpoint for article version history"""
    # Implementation would be here
    pass

# Create advanced router with custom endpoints
custom_endpoints = {
    "search": search_articles,
    "versions": get_article_versions
}

router = create_advanced_router(
    model=KnowledgeArticle,
    create_schema=ArticleCreate,
    update_schema=ArticleUpdate,
    crud_operations=article_crud,
    route_prefix="",
    tags=["Knowledge"],
    custom_endpoints=custom_endpoints,
    enable_search=True,
    enable_filters=True,
    enable_export=True
)
    parent_comment_id: Optional[int] = None


class CoAuthorCreate(BaseModel):
    user_id: int
    role: str = "editor"


class WorkflowStepCreate(BaseModel):
    step_number: int
    title: str
    description: Optional[str] = None
    code_snippet: Optional[str] = None
    code_language: Optional[str] = None
    success_outcome: Optional[str] = None
    failure_outcome: Optional[str] = None
    next_step_on_success: Optional[int] = None
    next_step_on_failure: Optional[int] = None


class TicketLinkCreate(BaseModel):
    ticket_id: int
    link_type: str = "references"


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[int] = None


# Categories
@router.get("/categories")
async def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all knowledge base categories"""
    categories = db.query(KnowledgeCategory).all()
    return {"categories": [
        {
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "icon": cat.icon,
            "parent_id": cat.parent_id,
            "article_count": len(cat.articles)
        }
        for cat in categories
    ]}


@router.post("/categories")
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new category"""
    new_category = KnowledgeCategory(**category.dict())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return {"message": "Category created", "category_id": new_category.id}


# Articles
@router.get("/articles")
async def get_articles(
    category_id: Optional[int] = None,
    tag: Optional[str] = None,
    itil_process: Optional[str] = None,
    search: Optional[str] = None,
    published_only: bool = True,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get articles with optional filtering"""
    query = db.query(KnowledgeArticle).options(
        joinedload(KnowledgeArticle.category)

    )
    
    if published_only:
        query = query.filter(KnowledgeArticle.is_published == True)
    
    if category_id:
        query = query.filter(KnowledgeArticle.category_id == category_id)
    
    if tag:
        query = query.filter(KnowledgeArticle.tags.contains(tag))
    
    if itil_process:
        query = query.filter(KnowledgeArticle.itil_process == itil_process)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                KnowledgeArticle.title.ilike(search_term),
                KnowledgeArticle.content.ilike(search_term),
                KnowledgeArticle.summary.ilike(search_term)
            )
        )
    
    total = query.count()
    articles = query.order_by(KnowledgeArticle.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "articles": [
            {
                "id": article.id,
                "title": article.title,
                "summary": article.summary,
                "category_id": article.category_id,
                "category": article.category.name if article.category else None,
                "author_id": article.author_id,
                "author": f"User {article.author_id}" if article.author_id else "Unknown",
                "tags": article.tags,
                "article_type": article.article_type,
                "itil_process": article.itil_process,
                "version": article.version,
                "views": article.view_count,
                "is_published": article.is_published,
                "is_draft": article.is_draft,
                "created_at": article.created_at.isoformat(),
                "updated_at": article.updated_at.isoformat()
            }
            for article in articles
        ]
    }


@router.get("/articles/{article_id}")
async def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific article with full details"""
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Increment view count
    article.view_count += 1
    db.commit()
    
    # Check if favorited by current user
    is_favorited = db.query(ArticleFavorite).filter(
        ArticleFavorite.article_id == article_id,
        ArticleFavorite.user_id == current_user.id
    ).first() is not None
    
    return {
        "id": article.id,
        "title": article.title,
        "content": article.content,
        "summary": article.summary,
        "category_id": article.category_id,
        "category": article.category.name if article.category else None,
        "author_id": article.author_id,
        "author_name": f"User {article.author_id}" if article.author_id else "Unknown",
        "tags": article.tags,
        "article_type": article.article_type,
        "itil_process": article.itil_process,
        "version": article.version,
        "views": article.view_count,
        "is_published": article.is_published,
        "is_draft": article.is_draft,
        "is_favorited": is_favorited,
        "created_at": article.created_at.isoformat(),
        "updated_at": article.updated_at.isoformat()
    }


@router.post("/articles")
async def create_article(
    article: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new knowledge article"""
    article_data = article.dict()
    workflow_steps = article_data.pop('workflow_steps', None)
    
    new_article = KnowledgeArticle(
        **article_data,
        author_id=current_user.id
    )
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    
    # Create initial version
    initial_version = ArticleVersion(
        article_id=new_article.id,
        version=1,
        title=new_article.title,
        content=new_article.content,
        changed_by=current_user.id,
        change_description="Initial version"
    )
    db.add(initial_version)
    
    # Create workflow steps if provided
    if workflow_steps and article.article_type == 'workflow':
        for step_data in workflow_steps:
            step = ArticleWorkflowStep(
                article_id=new_article.id,
                **step_data
            )
            db.add(step)
    
    db.commit()
    
    return {"message": "Article created", "article_id": new_article.id}


@router.put("/articles/{article_id}")
async def update_article(
    article_id: int,
    article_update: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing article (creates new version)"""
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Create new version if content or title changed
    if article_update.title or article_update.content:
        article.version += 1
        new_version = ArticleVersion(
            article_id=article.id,
            version=article.version,
            title=article_update.title or article.title,
            content=article_update.content or article.content,
            changed_by=current_user.id,
            change_description=article_update.change_description or "Updated article"
        )
        db.add(new_version)
    
    # Update article
    update_data = article_update.dict(exclude_unset=True, exclude={"change_description"})
    for key, value in update_data.items():
        setattr(article, key, value)
    
    article.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Article updated", "version": article.version}


@router.get("/articles/{article_id}/versions")
async def get_article_versions(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get version history of an article"""
    versions = db.query(ArticleVersion).filter(
        ArticleVersion.article_id == article_id
    ).order_by(ArticleVersion.version.desc()).all()
    
    return {
        "versions": [
            {
                "version": v.version,
                "title": v.title,
                "changed_by": v.changed_by,
                "change_description": v.change_description,
                "created_at": v.created_at.isoformat()
            }
            for v in versions
        ]
    }


# Favorites
@router.post("/articles/{article_id}/favorite")
async def toggle_favorite(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add or remove article from favorites"""
    favorite = db.query(ArticleFavorite).filter(
        ArticleFavorite.article_id == article_id,
        ArticleFavorite.user_id == current_user.id
    ).first()
    
    if favorite:
        db.delete(favorite)
        db.commit()
        return {"message": "Removed from favorites", "is_favorited": False}
    else:
        new_favorite = ArticleFavorite(
            article_id=article_id,
            user_id=current_user.id
        )
        db.add(new_favorite)
        db.commit()
        return {"message": "Added to favorites", "is_favorited": True}


@router.get("/favorites")
async def get_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's favorite articles"""
    favorites = db.query(ArticleFavorite).filter(
        ArticleFavorite.user_id == current_user.id
    ).all()
    
    articles = []
    for fav in favorites:
        article = fav.article
        articles.append({
            "id": article.id,
            "title": article.title,
            "summary": article.summary,
            "category_name": article.category.name if article.category else None,
            "tags": article.tags.split(",") if article.tags else [],
            "favorited_at": fav.created_at.isoformat()
        })
    
    return {"favorites": articles}


# Comments
@router.get("/articles/{article_id}/comments")
async def get_article_comments(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all comments for an article"""
    comments = db.query(ArticleComment).filter(
        ArticleComment.article_id == article_id
    ).order_by(ArticleComment.created_at.asc()).all()
    
    return {
        "comments": [
            {
                "id": c.id,
                "article_id": c.article_id,
                "user_id": c.user_id,
                "parent_comment_id": c.parent_comment_id,
                "comment": c.comment,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat()
            }
            for c in comments
        ]
    }


@router.post("/articles/{article_id}/comments")
async def create_comment(
    article_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a comment to an article"""
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    new_comment = ArticleComment(
        article_id=article_id,
        user_id=current_user.id,
        **comment_data.dict()
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return {"message": "Comment added", "comment_id": new_comment.id}


@router.delete("/articles/{article_id}/comments/{comment_id}")
async def delete_comment(
    article_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a comment (only by author or admin)"""
    comment = db.query(ArticleComment).filter(
        ArticleComment.id == comment_id,
        ArticleComment.article_id == article_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(comment)
    db.commit()
    
    return {"message": "Comment deleted"}


# Co-Authors
@router.get("/articles/{article_id}/coauthors")
async def get_coauthors(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all co-authors for an article"""
    coauthors = db.query(ArticleCoAuthor).filter(
        ArticleCoAuthor.article_id == article_id
    ).all()
    
    return {
        "coauthors": [
            {
                "id": ca.id,
                "user_id": ca.user_id,
                "role": ca.role,
                "added_at": ca.added_at.isoformat()
            }
            for ca in coauthors
        ]
    }


@router.post("/articles/{article_id}/coauthors")
async def add_coauthor(
    article_id: int,
    coauthor_data: CoAuthorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a co-author to an article"""
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Check if user is article owner or admin
    if article.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if already a coauthor
    existing = db.query(ArticleCoAuthor).filter(
        ArticleCoAuthor.article_id == article_id,
        ArticleCoAuthor.user_id == coauthor_data.user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User is already a co-author")
    
    new_coauthor = ArticleCoAuthor(
        article_id=article_id,
        **coauthor_data.dict()
    )
    db.add(new_coauthor)
    db.commit()
    
    return {"message": "Co-author added"}


@router.delete("/articles/{article_id}/coauthors/{coauthor_id}")
async def remove_coauthor(
    article_id: int,
    coauthor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a co-author from an article"""
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if article.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    coauthor = db.query(ArticleCoAuthor).filter(ArticleCoAuthor.id == coauthor_id).first()
    if not coauthor:
        raise HTTPException(status_code=404, detail="Co-author not found")
    
    db.delete(coauthor)
    db.commit()
    
    return {"message": "Co-author removed"}


# Workflow Steps
@router.get("/articles/{article_id}/workflow-steps")
async def get_workflow_steps(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get workflow steps for an article"""
    steps = db.query(ArticleWorkflowStep).filter(
        ArticleWorkflowStep.article_id == article_id
    ).order_by(ArticleWorkflowStep.step_number).all()
    
    return {
        "steps": [
            {
                "id": s.id,
                "step_number": s.step_number,
                "title": s.title,
                "description": s.description,
                "code_snippet": s.code_snippet,
                "code_language": s.code_language,
                "success_outcome": s.success_outcome,
                "failure_outcome": s.failure_outcome,
                "next_step_on_success": s.next_step_on_success,
                "next_step_on_failure": s.next_step_on_failure
            }
            for s in steps
        ]
    }


@router.post("/articles/{article_id}/workflow-steps")
async def create_workflow_steps(
    article_id: int,
    steps: List[WorkflowStepCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or replace workflow steps for an article"""
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Delete existing steps
    db.query(ArticleWorkflowStep).filter(ArticleWorkflowStep.article_id == article_id).delete()
    
    # Create new steps
    for step_data in steps:
        new_step = ArticleWorkflowStep(
            article_id=article_id,
            **step_data.dict()
        )
        db.add(new_step)
    
    db.commit()
    
    return {"message": "Workflow steps updated"}


# Ticket Links
@router.get("/articles/{article_id}/tickets")
async def get_article_tickets(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tickets linked to an article"""
    links = db.query(ArticleTicketLink).filter(
        ArticleTicketLink.article_id == article_id
    ).all()
    
    return {
        "tickets": [
            {
                "id": link.id,
                "ticket_id": link.ticket_id,
                "ticket_number": link.ticket.ticket_number if link.ticket else None,
                "ticket_title": link.ticket.title if link.ticket else None,
                "link_type": link.link_type,
                "created_by": link.created_by,
                "created_at": link.created_at.isoformat()
            }
            for link in links
        ]
    }


@router.post("/articles/{article_id}/link-ticket")
async def link_ticket_to_article(
    article_id: int,
    link_data: TicketLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Link a ticket to an article"""
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    ticket = db.query(Ticket).filter(Ticket.id == link_data.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check if already linked
    existing = db.query(ArticleTicketLink).filter(
        ArticleTicketLink.article_id == article_id,
        ArticleTicketLink.ticket_id == link_data.ticket_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already linked")
    
    new_link = ArticleTicketLink(
        article_id=article_id,
        ticket_id=link_data.ticket_id,
        link_type=link_data.link_type,
        created_by=current_user.id
    )
    db.add(new_link)
    db.commit()
    
    return {"message": "Ticket linked to article"}


@router.delete("/articles/{article_id}/tickets/{link_id}")
async def unlink_ticket(
    article_id: int,
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove ticket link from article"""
    link = db.query(ArticleTicketLink).filter(
        ArticleTicketLink.id == link_id,
        ArticleTicketLink.article_id == article_id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    db.delete(link)
    db.commit()
    
    return {"message": "Ticket unlinked"}


# Advanced Search
@router.post("/search")
async def advanced_search(
    filters: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Advanced search with multiple filters"""
    query = db.query(KnowledgeArticle)
    
    # Apply filters
    if filters.get('article_type'):
        query = query.filter(KnowledgeArticle.article_type == filters['article_type'])
    
    if filters.get('category_ids'):
        query = query.filter(KnowledgeArticle.category_id.in_(filters['category_ids']))
    
    if filters.get('tags'):
        for tag in filters['tags']:
            query = query.filter(KnowledgeArticle.tags.contains(tag))
    
    if filters.get('search_text'):
        search_term = f"%{filters['search_text']}%"
        query = query.filter(
            or_(
                KnowledgeArticle.title.ilike(search_term),
                KnowledgeArticle.content.ilike(search_term),
                KnowledgeArticle.summary.ilike(search_term)
            )
        )
    
    if filters.get('published_only', True):
        query = query.filter(KnowledgeArticle.is_published == True)
    
    articles = query.order_by(KnowledgeArticle.created_at.desc()).limit(50).all()
    
    return {
        "results": [
            {
                "id": a.id,
                "title": a.title,
                "summary": a.summary,
                "article_type": a.article_type,
                "category_name": a.category.name if a.category else None,
                "tags": a.tags.split(",") if a.tags else [],
                "view_count": a.view_count,
                "created_at": a.created_at.isoformat()
            }
            for a in articles
        ]
    }


# Related Articles
@router.get("/articles/{article_id}/related")
async def get_related_articles(
    article_id: int,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get related articles based on tags and category"""
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Find articles with similar tags or same category
    query = db.query(KnowledgeArticle).filter(
        KnowledgeArticle.id != article_id,
        KnowledgeArticle.is_published == True
    )
    
    # Prioritize same category
    if article.category_id:
        related = query.filter(KnowledgeArticle.category_id == article.category_id).limit(limit).all()
        
        if len(related) < limit and article.tags:
            # Add by tags if not enough from category
            tags = article.tags.split(",")
            for tag in tags:
                tag_matches = query.filter(
                    KnowledgeArticle.tags.contains(tag),
                    KnowledgeArticle.id.notin_([r.id for r in related])
                ).limit(limit - len(related)).all()
                related.extend(tag_matches)
                if len(related) >= limit:
                    break
    else:
        related = []
    
    return {
        "related": [
            {
                "id": r.id,
                "title": r.title,
                "summary": r.summary,
                "article_type": r.article_type,
                "category_name": r.category.name if r.category else None,
                "tags": r.tags.split(",") if r.tags else []
            }
            for r in related[:limit]
        ]
    }

