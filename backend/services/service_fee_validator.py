"""
EMERGENCY HOTFIX: Service Fee Validation and Safety Checks
Prevents crashes from invalid service fee operations
"""

from typing import Optional
from fastapi import HTTPException, status
import logging
from core.constants import FEES_ENABLED

logger = logging.getLogger(__name__)


class ServiceFeeValidator:
    """Validates and safely handles service fee operations"""
    
    MIN_FEE = 0.0
    MAX_FEE = 100.0
    DEFAULT_FEE = 0.4
    
    @staticmethod
    def validate_fee_percent(fee_value: Optional[float]) -> float:
        """
        Safely validate and return service fee percentage
        
        Args:
            fee_value: The fee value to validate
            
        Returns:
            Valid fee percentage, or default if invalid
            
        Raises:
            HTTPException: If fee is out of valid range
        """
        if not FEES_ENABLED:
            return 0.0

        try:
            # Handle None - return default
            if fee_value is None:
                logger.debug(f"Fee is None, using default: {ServiceFeeValidator.DEFAULT_FEE}")
                return ServiceFeeValidator.DEFAULT_FEE
            
            # Convert to float if string
            if isinstance(fee_value, str):
                try:
                    fee_value = float(fee_value)
                except ValueError:
                    logger.error(f"Cannot convert fee '{fee_value}' to float")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Service fee must be a valid number, got '{fee_value}'"
                    )
            
            # Check range
            if not isinstance(fee_value, (int, float)):
                logger.error(f"Invalid fee type: {type(fee_value)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Service fee must be a number"
                )
            
            if fee_value < ServiceFeeValidator.MIN_FEE or fee_value > ServiceFeeValidator.MAX_FEE:
                logger.error(f"Fee {fee_value} out of range [{ServiceFeeValidator.MIN_FEE}, {ServiceFeeValidator.MAX_FEE}]")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Service fee must be between {ServiceFeeValidator.MIN_FEE} and {ServiceFeeValidator.MAX_FEE}, got {fee_value}"
                )
            
            logger.debug(f"Fee validated successfully: {fee_value}%")
            return float(fee_value)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error validating fee: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error validating service fee"
            )
    
    @staticmethod
    def safe_get_fee(user_data: dict, user_id: Optional[str] = None) -> float:
        """
        Safely extract service fee from user data with fallback
        
        Args:
            user_data: Dictionary containing user data
            user_id: Optional user ID for logging
            
        Returns:
            Valid service fee percentage
        """
        if not FEES_ENABLED:
            return 0.0

        try:
            if not user_data:
                logger.warning(f"No user data provided for user {user_id}")
                return ServiceFeeValidator.DEFAULT_FEE
            
            # Try multiple possible field names
            fee_value = (
                user_data.get('service_fee_percent') or
                user_data.get('service_fee') or
                user_data.get('fee_percent')
            )
            
            return ServiceFeeValidator.validate_fee_percent(fee_value)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error safely getting fee for user {user_id}: {str(e)}")
            return ServiceFeeValidator.DEFAULT_FEE
    
    @staticmethod
    def apply_fee(amount: float, fee_percent: Optional[float]) -> dict:
        """
        Safely apply service fee to an amount
        
        Args:
            amount: The base amount
            fee_percent: Fee percentage to apply
            
        Returns:
            Dictionary with gross, fee, and net amounts
        """
        try:
            if amount < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Amount cannot be negative"
                )
            
            fee_percent = ServiceFeeValidator.validate_fee_percent(fee_percent)
            
            gross_amount = float(amount)
            fee_amount = gross_amount * (fee_percent / 100.0)
            net_amount = gross_amount - fee_amount
            
            logger.debug(f"Fee applied: gross={gross_amount}, fee={fee_amount}, net={net_amount}")
            
            return {
                "gross_amount": round(gross_amount, 2),
                "fee_percent": fee_percent,
                "fee_amount": round(fee_amount, 2),
                "net_amount": round(net_amount, 2)
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error applying fee: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error calculating service fee"
            )


# Helper functions for easy access
def validate_service_fee(fee_value: Optional[float]) -> float:
    """Quick validation wrapper"""
    return ServiceFeeValidator.validate_fee_percent(fee_value)


def get_safe_fee(user_data: dict, user_id: Optional[str] = None) -> float:
    """Quick safe getter wrapper"""
    return ServiceFeeValidator.safe_get_fee(user_data, user_id)


def calculate_with_fee(amount: float, fee_percent: Optional[float]) -> dict:
    """Quick fee calculation wrapper"""
    return ServiceFeeValidator.apply_fee(amount, fee_percent)
