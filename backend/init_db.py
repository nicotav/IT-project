"""
Initialize database with sample data
Run this once to set up the database with initial data
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random

from database import SessionLocal, engine, Base
from models import *
from auth import get_password_hash

# Create all tables
Base.metadata.create_all(bind=engine)

def init_db():
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).first():
            print("Database already initialized!")
            return
        
        print("Initializing database with sample data...")
        
        # Create users
        admin = User(
            username="admin",
            email="admin@msp.com",
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        
        tech1 = User(
            username="tech1",
            email="tech1@msp.com",
            hashed_password=get_password_hash("tech123"),
            role="technician"
        )
        
        user1 = User(
            username="user1",
            email="user1@company.com",
            hashed_password=get_password_hash("user123"),
            role="user"
        )
        
        db.add_all([admin, tech1, user1])
        db.commit()
        print("✓ Users created")
        
        # Knowledge Base Categories
        categories = [
            KnowledgeCategory(name="Network", description="Network troubleshooting and configuration", icon="network"),
            KnowledgeCategory(name="Hardware", description="Hardware issues and maintenance", icon="computer"),
            KnowledgeCategory(name="Software", description="Software installation and troubleshooting", icon="software"),
            KnowledgeCategory(name="Security", description="Security policies and procedures", icon="shield"),
            KnowledgeCategory(name="ITIL Processes", description="ITIL framework and best practices", icon="book")
        ]
        db.add_all(categories)
        db.commit()
        print("✓ Knowledge categories created")
        
        # Sample Knowledge Articles
        articles = [
            KnowledgeArticle(
                title="How to Reset Network Configuration",
                content="Step 1: Open Command Prompt as Administrator\nStep 2: Run ipconfig /release\nStep 3: Run ipconfig /renew\nStep 4: Test connectivity",
                summary="Quick guide to reset network settings",
                category_id=1,
                author_id=admin.id,
                tags="network,troubleshooting,ipconfig",
                itil_process="incident",
                is_published=True,
                view_count=42
            ),
            KnowledgeArticle(
                title="Incident Management Process",
                content="Incident Management focuses on restoring normal service operation as quickly as possible...",
                summary="ITIL Incident Management best practices",
                category_id=5,
                author_id=admin.id,
                tags="itil,incident,process",
                itil_process="incident",
                is_published=True,
                view_count=128
            ),
            KnowledgeArticle(
                title="Password Policy Guidelines",
                content="1. Minimum 12 characters\n2. Mix of uppercase, lowercase, numbers, symbols\n3. Change every 90 days\n4. No reuse of last 5 passwords",
                summary="Company password requirements",
                category_id=4,
                author_id=admin.id,
                tags="security,password,policy",
                is_published=True,
                view_count=256
            )
        ]
        db.add_all(articles)
        db.commit()
        print("✓ Knowledge articles created")
        
        # Monitored Services
        services = [
            MonitoredService(
                name="Primary Web Server",
                type="server",
                url="https://web01.company.com",
                status="up",
                last_check=datetime.utcnow(),
                response_time=45.2,
                uptime_percentage=99.95
            ),
            MonitoredService(
                name="Database Server",
                type="database",
                url="db01.company.com:5432",
                status="up",
                last_check=datetime.utcnow(),
                response_time=12.8,
                uptime_percentage=99.99
            ),
            MonitoredService(
                name="Email Server",
                type="application",
                url="mail.company.com",
                status="warning",
                last_check=datetime.utcnow(),
                response_time=156.3,
                uptime_percentage=98.5
            ),
            MonitoredService(
                name="VPN Gateway",
                type="network",
                url="vpn.company.com",
                status="up",
                last_check=datetime.utcnow(),
                response_time=23.1,
                uptime_percentage=99.8
            )
        ]
        db.add_all(services)
        db.commit()
        print("✓ Monitored services created")
        
        # Alerts
        alerts = [
            Alert(
                service_id=3,
                severity="warning",
                title="High response time detected",
                description="Email server response time exceeds 150ms threshold",
                status="active"
            ),
            Alert(
                service_id=1,
                severity="info",
                title="Scheduled maintenance completed",
                description="Server patching completed successfully",
                status="resolved",
                resolved_at=datetime.utcnow() - timedelta(hours=2)
            )
        ]
        db.add_all(alerts)
        db.commit()
        print("✓ Alerts created")
        
        # Sample Tickets
        tickets = [
            Ticket(
                ticket_number="20260119-0001",
                title="Cannot connect to network printer",
                description="User cannot print to the accounting department printer. Error: Printer offline",
                status=TicketStatus.NEW.value,
                priority=TicketPriority.MEDIUM.value,
                category="Hardware",
                submitter_id=user1.id,
                sla_due_date=datetime.utcnow() + timedelta(hours=24)
            ),
            Ticket(
                ticket_number="20260119-0002",
                title="Password reset request",
                description="User forgot domain password and is locked out",
                status=TicketStatus.IN_PROGRESS.value,
                priority=TicketPriority.HIGH.value,
                category="Account",
                submitter_id=user1.id,
                assigned_to=tech1.id,
                sla_due_date=datetime.utcnow() + timedelta(hours=8)
            ),
            Ticket(
                ticket_number="20260118-0015",
                title="Email not syncing on mobile device",
                description="Outlook mobile app not receiving new emails",
                status=TicketStatus.RESOLVED.value,
                priority=TicketPriority.LOW.value,
                category="Software",
                submitter_id=user1.id,
                assigned_to=tech1.id,
                resolution="Removed and re-added account. Verified sync working.",
                resolved_at=datetime.utcnow() - timedelta(hours=3),
                sla_due_date=datetime.utcnow() + timedelta(hours=72),
                time_spent_minutes=30
            )
        ]
        db.add_all(tickets)
        db.commit()
        print("✓ Tickets created")
        
        # Ticket Templates
        templates = [
            TicketTemplate(
                name="Password Reset",
                category="Account",
                title_template="Password reset for [Username]",
                description_template="User: [Username]\nReason: [Forgotten/Expired/Locked]\nVerification completed: Yes",
                default_priority=TicketPriority.HIGH.value,
                created_by=admin.id
            ),
            TicketTemplate(
                name="New User Setup",
                category="Account",
                title_template="New employee setup - [Name]",
                description_template="Employee Name: [Name]\nDepartment: [Department]\nStart Date: [Date]\n\nSetup required:\n- AD account\n- Email\n- Software licenses\n- Hardware",
                default_priority=TicketPriority.MEDIUM.value,
                created_by=admin.id
            ),
            TicketTemplate(
                name="Hardware Request",
                category="Hardware",
                title_template="Hardware request - [Item]",
                description_template="Item: [Description]\nQuantity: [Number]\nBudget Code: [Code]\nJustification: [Reason]",
                default_priority=TicketPriority.LOW.value,
                created_by=admin.id
            )
        ]
        db.add_all(templates)
        db.commit()
        print("✓ Ticket templates created")
        
        print("\n✅ Database initialized successfully!")
        print("\nDefault credentials:")
        print("  Admin: admin / admin123")
        print("  Technician: tech1 / tech123")
        print("  User: user1 / user123")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
