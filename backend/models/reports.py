from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from models.base import BaseModel


class Report(BaseModel):
    """Model for user reports (reconciliation, daily disbursement, etc.)"""
    __tablename__ = "reports"

    user_id = Column(String(255), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)  # e.g., "Reconciliation", "Daily disbursement"
    report_type = Column(String, nullable=False, index=True)  # For filtering/categorization
    report_date = Column(DateTime(timezone=True), nullable=False, index=True)  # The date the report covers
    available = Column(Boolean, default=False)  # Whether report data is ready
    file_url = Column(String, nullable=True)  # URL or path to report file
    summary = Column(String, nullable=True)  # Brief summary of report contents

    def __repr__(self):
        return f"<Report(id={self.id}, user_id={self.user_id}, name={self.name}, report_date={self.report_date})>"
