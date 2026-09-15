import secrets
from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func


def generate_key(prefix: str = "") -> str:
    return prefix + secrets.token_hex(16).upper()


class MerchantApiConfig(Base):
    __tablename__ = "merchant_api_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(String(64), index=True, nullable=False)
    user_id = Column(String(64), index=True, nullable=True)

    # Store Personalization
    store_name = Column(String(256), nullable=True)
    store_logo_url = Column(String(2048), nullable=True)
    permanent_link_slug = Column(String(128), unique=True, index=True, nullable=True)
    store_slug = Column(String(128), nullable=False, default="3", server_default="3")
    collection_currency = Column(String(3), nullable=False, default="PHP", server_default="PHP")
    krw_access_granted = Column(Boolean, nullable=False, default=False, server_default='false')

    # API Keys
    test_access_key = Column(String(64), nullable=False, default=lambda: generate_key("TEST_"))
    test_secret_key = Column(String(64), nullable=True)
    live_access_key = Column(String(64), nullable=False, default=lambda: generate_key("LIVE_"))
    live_secret_key = Column(String(64), nullable=True)

    # Integration URLs - Test Mode
    test_callback_url = Column(String(512), nullable=True)
    test_status_page_mode = Column(String(32), default="swiftpay", server_default="swiftpay", nullable=False)
    test_external_status_url = Column(String(512), nullable=True)
    test_success_url = Column(String(512), nullable=True)
    test_cancel_url = Column(String(512), nullable=True)
    test_failure_url = Column(String(512), nullable=True)

    # Integration URLs - Live Mode
    live_callback_url = Column(String(512), nullable=True)
    live_status_page_mode = Column(String(32), default="swiftpay", server_default="swiftpay", nullable=False)
    live_external_status_url = Column(String(512), nullable=True)
    live_success_url = Column(String(512), nullable=True)
    live_cancel_url = Column(String(512), nullable=True)
    live_failure_url = Column(String(512), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
