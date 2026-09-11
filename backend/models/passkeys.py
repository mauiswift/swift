from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from core.database import Base


class PasskeyChallenge(Base):
    __tablename__ = "passkey_challenges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    challenge = Column(String(512), unique=True, index=True, nullable=False)
    user_id = Column(String(64), nullable=True, index=True)
    purpose = Column(String(32), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
