import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from schemas.reports import ReportResponse, ReportsListResponse
from services.reports_service import ReportsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("", response_model=ReportsListResponse)
async def list_reports(
    days: int = Query(7, description="Number of days back to fetch reports for"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of reports to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get reports for the current user.
    
    Supports date range filtering and pagination.
    """
    try:
        service = ReportsService(db)
        reports, total_count = await service.get_reports(
            user_id=str(current_user.id),
            days=days,
            limit=limit,
            offset=offset,
        )

        return ReportsListResponse(
            success=True,
            total_count=total_count,
            limit=limit,
            offset=offset,
            data=[ReportResponse.from_orm(r) for r in reports],
        )
    except Exception as e:
        logger.error(f"Error listing reports: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch reports",
        )


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific report by ID"""
    try:
        service = ReportsService(db)
        report = await service.get_report_by_id(report_id, str(current_user.id))

        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found",
            )

        return ReportResponse.from_orm(report)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching report {report_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch report",
        )


@router.get("/{report_id}/download")
async def download_report(
    report_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get download URL for a report.
    Returns the file_url if available.
    """
    try:
        service = ReportsService(db)
        report = await service.get_report_by_id(report_id, str(current_user.id))

        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found",
            )

        if not report.available or not report.file_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Report is not available for download",
            )

        return {
            "success": True,
            "download_url": report.file_url,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading report {report_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download report",
        )
