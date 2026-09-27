from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.sql import func


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(64), primary_key=True)
    name = Column(String(256), nullable=False)
    status = Column(String(32), nullable=False, default="active", server_default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class OrganizationMembership(Base):
    __tablename__ = "organization_memberships"
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_organization_membership_user"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(String(64), ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    role = Column(String(64), nullable=False, default="viewer", server_default="viewer")
    status = Column(String(32), nullable=False, default="active", server_default="active")
    is_primary = Column(Boolean, nullable=False, default=True, server_default="true")
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())