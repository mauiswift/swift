import logging
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from models.reports import Report

logger = logging.getLogger(__name__)


class ReportsService:
    """Service for managing user reports"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_reports(
        self,
        user_id: str,
        days: int = 7,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[List[Report], int]:
        """
        Get reports for a user within a date range.
        
        Args:
            user_id: The user ID
            days: Number of days back to fetch reports for (default 7)
            limit: Maximum number of reports to return
            offset: Offset for pagination
            
        Returns:
            Tuple of (reports list, total count)
        """
        try:
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)

            # Build query
            query = select(Report).where(
                and_(
                    Report.user_id == user_id,
                    Report.report_date >= start_date,
                    Report.report_date <= end_date,
                )
            ).order_by(Report.report_date.desc())

            # Get total count
            count_query = select(Report).where(
                and_(
                    Report.user_id == user_id,
                    Report.report_date >= start_date,
                    Report.report_date <= end_date,
                )
            )
            count_result = await self.db.execute(count_query)
            total_count = len(count_result.all())

            # Apply pagination
            paginated_query = query.offset(offset).limit(limit)
            result = await self.db.execute(paginated_query)
            reports = result.scalars().all()

            return list(reports), total_count
        except Exception as e:
            logger.error(f"Error fetching reports for user {user_id}: {e}")
            return [], 0

    async def create_report(
        self,
        user_id: str,
        name: str,
        report_type: str,
        report_date: datetime,
        available: bool = False,
        file_url: Optional[str] = None,
        summary: Optional[str] = None,
    ) -> Report:
        """Create a new report"""
        try:
            report = Report(
                user_id=user_id,
                name=name,
                report_type=report_type,
                report_date=report_date,
                available=available,
                file_url=file_url,
                summary=summary,
            )
            self.db.add(report)
            await self.db.commit()
            await self.db.refresh(report)
            return report
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating report: {e}")
            raise

    async def get_report_by_id(self, report_id: int, user_id: str) -> Optional[Report]:
        """Get a specific report (with user ownership check)"""
        try:
            query = select(Report).where(
                and_(Report.id == report_id, Report.user_id == user_id)
            )
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching report {report_id}: {e}")
            return None

    async def update_report(
        self,
        report_id: int,
        user_id: str,
        **kwargs
    ) -> Optional[Report]:
        """Update a report (with user ownership check)"""
        try:
            report = await self.get_report_by_id(report_id, user_id)
            if not report:
                return None

            for key, value in kwargs.items():
                if hasattr(report, key) and value is not None:
                    setattr(report, key, value)

            await self.db.commit()
            await self.db.refresh(report)
            return report
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating report {report_id}: {e}")
            raise

    async def delete_report(self, report_id: int, user_id: str) -> bool:
        """Delete a report (with user ownership check)"""
        try:
            report = await self.get_report_by_id(report_id, user_id)
            if not report:
                return False

            await self.db.delete(report)
            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting report {report_id}: {e}")
            raise
