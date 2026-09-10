import secrets
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.support_tickets import SupportTicket
from schemas.auth import UserResponse
from services.admin_notification_service import AdminNotificationService
from utils.datetime import serialize_utc_datetime

router = APIRouter(prefix="/api/v1/support/tickets", tags=["support-tickets"])

TICKET_STATUSES = {"open", "in_progress", "waiting_on_user", "resolved", "closed"}
TICKET_CATEGORIES = {"general", "payment", "withdrawal", "disbursement", "account", "technical"}
TICKET_PRIORITIES = {"low", "normal", "high", "urgent"}


class TicketCreateRequest(BaseModel):
    subject: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=10000)
    category: str = "general"
    priority: str = "normal"


class TicketMessageRequest(BaseModel):
    body: str = Field(min_length=1, max_length=10000)


class TicketUpdateRequest(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = Field(default=None, max_length=64)


def _is_super_admin(user: UserResponse) -> bool:
    return bool(user.permissions and user.permissions.is_super_admin)


def _ensure_owner_or_admin(ticket: SupportTicket, user: UserResponse) -> None:
    if str(ticket.user_id) != str(user.id) and not _is_super_admin(user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")


def _ticket_response(ticket: SupportTicket) -> dict[str, Any]:
    return {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "user_id": ticket.user_id,
        "user_name": ticket.user_name,
        "user_email": ticket.user_email,
        "subject": ticket.subject,
        "description": ticket.description,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "assigned_to": ticket.assigned_to,
        "messages": ticket.messages or [],
        "created_at": serialize_utc_datetime(ticket.created_at),
        "updated_at": serialize_utc_datetime(ticket.updated_at),
        "last_response_at": serialize_utc_datetime(ticket.last_response_at),
    }


def _validate_ticket_values(category: str, priority: str) -> None:
    if category not in TICKET_CATEGORIES:
        raise HTTPException(status_code=400, detail="Unsupported ticket category")
    if priority not in TICKET_PRIORITIES:
        raise HTTPException(status_code=400, detail="Unsupported ticket priority")


@router.get("")
async def list_tickets(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    query = select(SupportTicket).order_by(desc(SupportTicket.updated_at))
    if not _is_super_admin(current_user):
        query = query.where(SupportTicket.user_id == str(current_user.id))
    elif status_filter:
        if status_filter not in TICKET_STATUSES:
            raise HTTPException(status_code=400, detail="Unsupported ticket status")
        query = query.where(SupportTicket.status == status_filter)
    result = await db.execute(query)
    tickets = result.scalars().all()
    return {"tickets": [_ticket_response(ticket) for ticket in tickets]}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_ticket(
    body: TicketCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    category = body.category.strip().lower()
    priority = body.priority.strip().lower()
    _validate_ticket_values(category, priority)
    now = datetime.now(timezone.utc)
    ticket = SupportTicket(
        ticket_number=f"SP-{now.strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}",
        user_id=str(current_user.id),
        user_name=current_user.name,
        user_email=current_user.email,
        organization_id=current_user.organization_id,
        subject=body.subject.strip(),
        description=body.description.strip(),
        category=category,
        priority=priority,
        status="open",
        messages=[{
            "author_id": str(current_user.id),
            "author_name": current_user.name or current_user.email or "User",
            "author_role": "user",
            "body": body.description.strip(),
            "created_at": now.isoformat(),
        }],
        last_response_at=now,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    await AdminNotificationService.notify_super_admins(
        db,
        notification_type="support_ticket",
        title=f"New support ticket {ticket.ticket_number}",
        message=f"{ticket.subject} submitted by {ticket.user_name or ticket.user_email or ticket.user_id}",
        user_id=str(current_user.id),
        user_name=current_user.name or current_user.email,
        resource_type="support_ticket",
        resource_id=str(ticket.id),
        metadata={"ticket_number": ticket.ticket_number, "category": category, "priority": priority},
        priority="urgent" if priority == "urgent" else "normal",
        action_url=f"/support?ticket={ticket.id}",
    )
    return {"ticket": _ticket_response(ticket)}


@router.get("/{ticket_id}")
async def get_ticket(
    ticket_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticket = await db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    _ensure_owner_or_admin(ticket, current_user)
    return {"ticket": _ticket_response(ticket)}


@router.post("/{ticket_id}/messages")
async def add_ticket_message(
    ticket_id: int,
    body: TicketMessageRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticket = await db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    _ensure_owner_or_admin(ticket, current_user)
    if ticket.status == "closed":
        raise HTTPException(status_code=409, detail="Closed tickets cannot receive new messages")
    now = datetime.now(timezone.utc)
    messages = list(ticket.messages or [])
    messages.append({
        "author_id": str(current_user.id),
        "author_name": current_user.name or current_user.email or "User",
        "author_role": "admin" if _is_super_admin(current_user) else "user",
        "body": body.body.strip(),
        "created_at": now.isoformat(),
    })
    ticket.messages = messages
    ticket.last_response_at = now
    ticket.status = "waiting_on_user" if _is_super_admin(current_user) else "open"
    await db.commit()
    await db.refresh(ticket)
    return {"ticket": _ticket_response(ticket)}


@router.patch("/{ticket_id}")
async def update_ticket(
    ticket_id: int,
    body: TicketUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Super admin access required")
    ticket = await db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if body.status is not None:
        if body.status not in TICKET_STATUSES:
            raise HTTPException(status_code=400, detail="Unsupported ticket status")
        ticket.status = body.status
    if body.priority is not None:
        if body.priority not in TICKET_PRIORITIES:
            raise HTTPException(status_code=400, detail="Unsupported ticket priority")
        ticket.priority = body.priority
    if body.assigned_to is not None:
        ticket.assigned_to = body.assigned_to.strip() or None
    await db.commit()
    await db.refresh(ticket)
    return {"ticket": _ticket_response(ticket)}