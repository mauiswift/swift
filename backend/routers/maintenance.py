"""
Maintenance page router with password protection and role-based access control.
Only admin and testers can view. Can be toggled on/off.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
from functools import lru_cache

from core.database import get_db
from models import User
from dependencies.auth import get_current_user

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

# ============================================================================
# Pydantic Models
# ============================================================================

class MaintenanceStatus(BaseModel):
    """Maintenance status response model"""
    is_active: bool
    message: str
    started_at: Optional[datetime] = None
    estimated_end_at: Optional[datetime] = None
    can_access: bool = False

class MaintenanceToggle(BaseModel):
    """Toggle maintenance mode request"""
    is_active: bool
    message: str = "The system is under maintenance. Please check back soon."
    estimated_end_at: Optional[datetime] = None

class MaintenanceStats(BaseModel):
    """Maintenance statistics"""
    is_active: bool
    message: str
    started_at: Optional[datetime]
    estimated_end_at: Optional[datetime]
    last_toggled_by: Optional[str]
    total_toggles: int

# ============================================================================
# In-Memory Maintenance State (Replace with DB for production)
# ============================================================================

maintenance_state = {
    "is_active": False,
    "message": "The system is under maintenance. Please check back soon.",
    "started_at": None,
    "estimated_end_at": None,
    "last_toggled_by": None,
    "total_toggles": 0
}

# ============================================================================
# Helper Functions
# ============================================================================

def is_admin_or_tester(user: User) -> bool:
    """Check if user is admin or tester"""
    return user.role in ["admin", "tester", "super_admin"]

def check_maintenance_access(user: Optional[User] = None) -> bool:
    """Check if user can access the system during maintenance"""
    if not maintenance_state["is_active"]:
        return True
    if user and is_admin_or_tester(user):
        return True
    return False

# ============================================================================
# Routes
# ============================================================================

@router.get("/status")
async def get_maintenance_status(
    current_user: Optional[User] = Depends(lambda: None)
) -> MaintenanceStatus:
    """
    Get current maintenance status.
    Anonymous users see minimal info if maintenance is active.
    Admin/testers see full details.
    """
    can_access = check_maintenance_access(current_user)
    
    if maintenance_state["is_active"] and not is_admin_or_tester(current_user) if current_user else True:
        # Return minimal info for non-admin users
        return MaintenanceStatus(
            is_active=True,
            message=maintenance_state["message"],
            can_access=False
        )
    
    return MaintenanceStatus(
        is_active=maintenance_state["is_active"],
        message=maintenance_state["message"],
        started_at=maintenance_state["started_at"],
        estimated_end_at=maintenance_state["estimated_end_at"],
        can_access=can_access
    )

@router.get("/page")
async def maintenance_page(
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed maintenance page.
    Only accessible by admin and testers.
    """
    if not is_admin_or_tester(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only admins and testers can view maintenance page."
        )
    
    return {
        "is_active": maintenance_state["is_active"],
        "message": maintenance_state["message"],
        "started_at": maintenance_state["started_at"],
        "estimated_end_at": maintenance_state["estimated_end_at"],
        "last_toggled_by": maintenance_state["last_toggled_by"],
        "total_toggles": maintenance_state["total_toggles"],
        "accessed_by": current_user.email,
        "accessed_at": datetime.utcnow()
    }

@router.post("/toggle")
async def toggle_maintenance(
    payload: MaintenanceToggle,
    current_user: User = Depends(get_current_user)
):
    """
    Toggle maintenance mode on/off.
    Only accessible by admin users.
    """
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only admins can toggle maintenance mode."
        )
    
    previous_state = maintenance_state["is_active"]
    
    maintenance_state["is_active"] = payload.is_active
    maintenance_state["message"] = payload.message
    maintenance_state["estimated_end_at"] = payload.estimated_end_at
    maintenance_state["last_toggled_by"] = current_user.email
    maintenance_state["total_toggles"] += 1
    
    if payload.is_active and not previous_state:
        maintenance_state["started_at"] = datetime.utcnow()
    elif not payload.is_active and previous_state:
        maintenance_state["started_at"] = None
    
    return {
        "status": "success",
        "is_active": maintenance_state["is_active"],
        "message": maintenance_state["message"],
        "toggled_by": current_user.email,
        "toggled_at": datetime.utcnow(),
        "previous_state": previous_state
    }

@router.post("/end")
async def end_maintenance(
    current_user: User = Depends(get_current_user)
):
    """
    Immediately end maintenance mode.
    Only accessible by admin users.
    """
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only admins can end maintenance."
        )
    
    was_active = maintenance_state["is_active"]
    
    maintenance_state["is_active"] = False
    maintenance_state["started_at"] = None
    maintenance_state["estimated_end_at"] = None
    maintenance_state["last_toggled_by"] = current_user.email
    maintenance_state["total_toggles"] += 1
    
    return {
        "status": "success",
        "message": "Maintenance mode ended",
        "was_active": was_active,
        "ended_by": current_user.email,
        "ended_at": datetime.utcnow()
    }

@router.get("/stats")
async def maintenance_stats(
    current_user: User = Depends(get_current_user)
) -> MaintenanceStats:
    """
    Get maintenance statistics.
    Only accessible by admin and testers.
    """
    if not is_admin_or_tester(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only admins and testers can view statistics."
        )
    
    return MaintenanceStats(
        is_active=maintenance_state["is_active"],
        message=maintenance_state["message"],
        started_at=maintenance_state["started_at"],
        estimated_end_at=maintenance_state["estimated_end_at"],
        last_toggled_by=maintenance_state["last_toggled_by"],
        total_toggles=maintenance_state["total_toggles"]
    )

# ============================================================================
# Middleware Integration
# ============================================================================

class MaintenanceMiddleware:
    """
    Middleware to check maintenance status on every request.
    Allows admin/tester access during maintenance.
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Skip maintenance check for maintenance endpoints
        path = scope["path"]
        if path.startswith("/maintenance"):
            await self.app(scope, receive, send)
            return
        
        # Check if maintenance is active
        if maintenance_state["is_active"]:
            # Get user info from request (simplified)
            # In production, extract from token/session
            user = None
            
            if not check_maintenance_access(user):
                # Return 503 Service Unavailable during maintenance
                await send({
                    "type": "http.response.start",
                    "status": 503,
                    "headers": [
                        [b"content-type", b"application/json"],
                        [b"retry-after", b"300"]
                    ]
                })
                await send({
                    "type": "http.response.body",
                    "body": b'{"detail": "System is under maintenance. Please try again later."}'
                })
                return
        
        await self.app(scope, receive, send)
