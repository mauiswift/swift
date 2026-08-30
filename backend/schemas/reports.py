from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ReportBase(BaseModel):
    name: str
    report_type: str
    report_date: datetime
    available: bool = False
    file_url: Optional[str] = None
    summary: Optional[str] = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    name: Optional[str] = None
    report_type: Optional[str] = None
    report_date: Optional[datetime] = None
    available: Optional[bool] = None
    file_url: Optional[str] = None
    summary: Optional[str] = None


class ReportResponse(ReportBase):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportsListResponse(BaseModel):
    success: bool
    total_count: int
    limit: int
    offset: int
    data: list[ReportResponse]
