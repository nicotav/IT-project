"""
SQLAlchemy database models for all systems
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base


# ============= User Management =============
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # admin, technician, user
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)


# ============= Knowledge Base =============
class KnowledgeCategory(Base):
    __tablename__ = "knowledge_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    parent_id = Column(Integer, ForeignKey("knowledge_categories.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    articles = relationship("KnowledgeArticle", back_populates="category")


class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("knowledge_categories.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    tags = Column(String(500), nullable=True)  # Comma-separated
    itil_process = Column(String(100), nullable=True)  # incident, problem, change, etc.
    article_type = Column(String(50), default="reference")  # workflow, reference, snippet
    version = Column(Integer, default=1)
    is_published = Column(Boolean, default=False)
    is_draft = Column(Boolean, default=True)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    category = relationship("KnowledgeCategory", back_populates="articles")
    versions = relationship("ArticleVersion", back_populates="article")
    favorites = relationship("ArticleFavorite", back_populates="article")
    comments = relationship("ArticleComment", back_populates="article")
    coauthors = relationship("ArticleCoAuthor", back_populates="article")
    workflow_steps = relationship("ArticleWorkflowStep", back_populates="article", order_by="ArticleWorkflowStep.step_number")
    ticket_links = relationship("ArticleTicketLink", back_populates="article")


class ArticleVersion(Base):
    __tablename__ = "article_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("knowledge_articles.id"))
    version = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"))
    change_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    article = relationship("KnowledgeArticle", back_populates="versions")


class ArticleFavorite(Base):
    __tablename__ = "article_favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("knowledge_articles.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    article = relationship("KnowledgeArticle", back_populates="favorites")


class ArticleComment(Base):
    __tablename__ = "article_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("knowledge_articles.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    parent_comment_id = Column(Integer, ForeignKey("article_comments.id"), nullable=True)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    article = relationship("KnowledgeArticle", back_populates="comments")
    replies = relationship("ArticleComment", remote_side=[id])


class ArticleCoAuthor(Base):
    __tablename__ = "article_coauthors"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("knowledge_articles.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String(20), default="editor")  # owner, editor, viewer
    added_at = Column(DateTime, default=datetime.utcnow)
    
    article = relationship("KnowledgeArticle", back_populates="coauthors")


class ArticleWorkflowStep(Base):
    __tablename__ = "article_workflow_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("knowledge_articles.id"))
    step_number = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    code_snippet = Column(Text, nullable=True)
    code_language = Column(String(50), nullable=True)
    success_outcome = Column(Text, nullable=True)
    failure_outcome = Column(Text, nullable=True)
    next_step_on_success = Column(Integer, nullable=True)
    next_step_on_failure = Column(Integer, nullable=True)
    
    article = relationship("KnowledgeArticle", back_populates="workflow_steps")


class ArticleTicketLink(Base):
    __tablename__ = "article_ticket_links"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("knowledge_articles.id"))
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    link_type = Column(String(20), default="references")  # resolves, references, related
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    article = relationship("KnowledgeArticle", back_populates="ticket_links")
    ticket = relationship("Ticket", back_populates="article_links")


# ============= Monitoring Dashboard =============
class MonitoredService(Base):
    __tablename__ = "monitored_services"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # server, application, network, database
    url = Column(String(255), nullable=True)
    status = Column(String(20), default="unknown")  # up, down, warning, unknown
    last_check = Column(DateTime, nullable=True)
    response_time = Column(Float, nullable=True)  # in milliseconds
    uptime_percentage = Column(Float, default=100.0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    alerts = relationship("Alert", back_populates="service")
    metrics = relationship("ServiceMetric", back_populates="service")


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("monitored_services.id"))
    severity = Column(String(20), nullable=False)  # critical, warning, info
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="active")  # active, acknowledged, resolved
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    service = relationship("MonitoredService", back_populates="alerts")


class ServiceMetric(Base):
    __tablename__ = "service_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("monitored_services.id"))
    metric_name = Column(String(100), nullable=False)  # cpu, memory, disk, network
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=True)  # %, MB, GB, ms
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    service = relationship("MonitoredService", back_populates="metrics")


class SLA(Base):
    __tablename__ = "slas"
    
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("monitored_services.id"))
    name = Column(String(100), nullable=False)
    target_uptime = Column(Float, default=99.9)  # Percentage
    response_time_target = Column(Float, nullable=True)  # milliseconds
    current_uptime = Column(Float, default=100.0)
    status = Column(String(20), default="meeting")  # meeting, at-risk, breached
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)


class DashboardWidget(Base):
    __tablename__ = "dashboard_widgets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    widget_type = Column(String(50), nullable=False)  # chart, metric, alert-list, service-status
    title = Column(String(100), nullable=False)
    config = Column(Text, nullable=True)  # JSON configuration
    position = Column(Integer, default=0)
    size = Column(String(20), default="medium")  # small, medium, large
    created_at = Column(DateTime, default=datetime.utcnow)


# ============= Ticketing System =============
class TicketStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    PENDING = "pending"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(20), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), default=TicketStatus.NEW.value)
    priority = Column(String(20), default=TicketPriority.MEDIUM.value)
    category = Column(String(50), nullable=True)  # Hardware, Software, Network, etc.
    submitter_id = Column(Integer, ForeignKey("users.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    sla_policy_id = Column(Integer, ForeignKey("sla_policies.id"), nullable=True)
    sla_due_date = Column(DateTime, nullable=True)
    first_response_at = Column(DateTime, nullable=True)
    resolution = Column(Text, nullable=True)
    time_spent_minutes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    comments = relationship("TicketComment", back_populates="ticket")
    time_entries = relationship("TimeEntry", back_populates="ticket")
    article_links = relationship("ArticleTicketLink", back_populates="ticket")


class TicketComment(Base):
    __tablename__ = "ticket_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    comment = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    ticket = relationship("Ticket", back_populates="comments")


class TimeEntry(Base):
    __tablename__ = "time_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    minutes = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    billable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    ticket = relationship("Ticket", back_populates="time_entries")


class TicketTemplate(Base):
    __tablename__ = "ticket_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=True)
    title_template = Column(String(200), nullable=False)
    description_template = Column(Text, nullable=False)
    default_priority = Column(String(20), default=TicketPriority.MEDIUM.value)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


# ============= Teams Management =============
class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    team_lead_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    members = relationship("TeamMember", back_populates="team")
    boards = relationship("Board", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String(50), default="member")  # lead, member, viewer
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    team = relationship("Team", back_populates="members")


# ============= Kanban Boards =============
class Board(Base):
    __tablename__ = "boards"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    team = relationship("Team", back_populates="boards")
    columns = relationship("BoardColumn", back_populates="board", order_by="BoardColumn.position")


class BoardColumn(Base):
    __tablename__ = "board_columns"
    
    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id"))
    name = Column(String(100), nullable=False)
    position = Column(Integer, default=0)
    wip_limit = Column(Integer, nullable=True)  # Work in progress limit
    color = Column(String(7), nullable=True)  # Hex color
    
    board = relationship("Board", back_populates="columns")
    cards = relationship("BoardCard", back_populates="column")


class BoardCard(Base):
    __tablename__ = "board_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    board_column_id = Column(Integer, ForeignKey("board_columns.id"))
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    position = Column(Integer, default=0)
    
    column = relationship("BoardColumn", back_populates="cards")


# ============= Appointments Scheduler =============
class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    technician_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String(200), nullable=True)
    status = Column(String(20), default="scheduled")  # scheduled, confirmed, completed, cancelled
    meeting_link = Column(String(255), nullable=True)
    reminder_sent = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============= SLA Management =============
class SLAPolicy(Base):
    __tablename__ = "sla_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), nullable=False)  # critical, high, medium, low
    response_time_hours = Column(Integer, nullable=False)  # First response time
    resolution_time_hours = Column(Integer, nullable=False)  # Time to resolve
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============= Automation Rules =============
class AutomationRule(Base):
    __tablename__ = "automation_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    trigger_type = Column(String(50), nullable=False)  # ticket_created, ticket_updated, time_based
    conditions = Column(Text, nullable=False)  # JSON conditions
    actions = Column(Text, nullable=False)  # JSON actions
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)  # Execution order
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    executions = relationship("AutomationExecution", back_populates="rule")


class AutomationExecution(Base):
    __tablename__ = "automation_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("automation_rules.id"))
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    status = Column(String(20), nullable=False)  # success, failed
    error_message = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow)
    
    rule = relationship("AutomationRule", back_populates="executions")


# ============= Company & Asset Management =============
class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    domain = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    website = Column(String(200), nullable=True)
    contract_start = Column(DateTime, nullable=True)
    contract_end = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    assets = relationship("Asset", back_populates="company")
    contacts = relationship("CompanyContact", back_populates="company")


class CompanyContact(Base):
    __tablename__ = "company_contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    role = Column(String(100), nullable=True)
    is_primary = Column(Boolean, default=False)
    
    company = relationship("Company", back_populates="contacts")


class AssetType(str, enum.Enum):
    COMPUTER = "computer"
    SERVER = "server"
    NETWORK_DEVICE = "network_device"
    PRINTER = "printer"
    MOBILE = "mobile"
    SOFTWARE = "software"
    LICENSE = "license"
    OTHER = "other"


class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    asset_type = Column(String(50), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    manufacturer = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)
    purchase_date = Column(DateTime, nullable=True)
    warranty_expiry = Column(DateTime, nullable=True)
    cost = Column(Float, nullable=True)
    location = Column(String(200), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="active")  # active, retired, in_repair, lost
    notes = Column(Text, nullable=True)
    specifications = Column(Text, nullable=True)  # JSON for custom specs
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company", back_populates="assets")


# ============= Tags & Categories =============
class TicketTag(Base):
    __tablename__ = "ticket_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    tag_name = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class TicketCategory(Base):
    __tablename__ = "ticket_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    parent_id = Column(Integer, ForeignKey("ticket_categories.id"), nullable=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    color = Column(String(7), nullable=True)
    is_active = Column(Boolean, default=True)


# ============= Ticket Dependencies =============
class TicketDependency(Base):
    __tablename__ = "ticket_dependencies"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    depends_on_ticket_id = Column(Integer, ForeignKey("tickets.id"))
    dependency_type = Column(String(50), default="blocks")  # blocks, relates_to, duplicates
    created_at = Column(DateTime, default=datetime.utcnow)


# ============= Custom Fields =============
class CustomField(Base):
    __tablename__ = "custom_fields"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    field_type = Column(String(50), nullable=False)  # text, number, date, dropdown, checkbox
    options = Column(Text, nullable=True)  # JSON for dropdown options
    is_required = Column(Boolean, default=False)
    applies_to = Column(String(50), default="ticket")  # ticket, asset, company
    position = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CustomFieldValue(Base):
    __tablename__ = "custom_field_values"
    
    id = Column(Integer, primary_key=True, index=True)
    custom_field_id = Column(Integer, ForeignKey("custom_fields.id"))
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    value = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============= File Attachments =============
class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    mime_type = Column(String(100), nullable=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    comment_id = Column(Integer, ForeignKey("ticket_comments.id"), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


# ============= Mentions System =============
class Mention(Base):
    __tablename__ = "mentions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # Who was mentioned
    comment_id = Column(Integer, ForeignKey("ticket_comments.id"))
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============= Customer Satisfaction =============
class CustomerSatisfaction(Base):
    __tablename__ = "customer_satisfaction"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    rating = Column(Integer, nullable=False)  # 1-5 stars
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============= Email Integration =============
class EmailConfig(Base):
    __tablename__ = "email_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email_address = Column(String(100), nullable=False)
    imap_server = Column(String(200), nullable=False)
    imap_port = Column(Integer, default=993)
    smtp_server = Column(String(200), nullable=False)
    smtp_port = Column(Integer, default=587)
    username = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)  # Should be encrypted
    auto_create_tickets = Column(Boolean, default=True)
    default_priority = Column(String(20), default=TicketPriority.MEDIUM.value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmailTicket(Base):
    __tablename__ = "email_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    message_id = Column(String(255), nullable=False)
    from_email = Column(String(100), nullable=False)
    subject = Column(String(500), nullable=False)
    received_at = Column(DateTime, default=datetime.utcnow)


# ============= Reports & Analytics =============
class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    report_type = Column(String(50), nullable=False)  # tickets, performance, sla, csat
    description = Column(Text, nullable=True)
    config = Column(Text, nullable=False)  # JSON configuration
    created_by = Column(Integer, ForeignKey("users.id"))
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"))
    frequency = Column(String(20), nullable=False)  # daily, weekly, monthly
    recipients = Column(Text, nullable=False)  # JSON array of emails
    next_run = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
