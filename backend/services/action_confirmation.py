"""Service for generating and tracking action confirmation messages.

Provides consistent confirmation feedback for all user actions:
- Success confirmations
- Error messages
- Audit trail recording
- Action descriptions
"""

import logging
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class ActionType(str, Enum):
    """Types of actions that require confirmation."""
    APPROVE = "approve"
    REJECT = "reject"
    DELETE = "delete"
    CREATE = "create"
    UPDATE = "update"
    WITHDRAW = "withdraw"
    TRANSFER = "transfer"
    DISBURSE = "disburse"
    REFUND = "refund"
    RESET = "reset"


class ActionConfirmation:
    """Confirmation message for a completed action."""

    def __init__(
        self,
        action_type: ActionType,
        entity_type: str,
        entity_id: str,
        success: bool,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        performed_by: Optional[str] = None,
    ):
        self.action_type = action_type
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.success = success
        self.message = message
        self.details = details or {}
        self.performed_by = performed_by
        self.timestamp = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/response."""
        return {
            "action": self.action_type.value,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "success": self.success,
            "message": self.message,
            "details": self.details,
            "performed_by": self.performed_by,
            "timestamp": self.timestamp.isoformat(),
        }


class ActionConfirmationService:
    """Generate standardized confirmation messages for actions."""

    @staticmethod
    def approval_success(
        entity_type: str,
        entity_id: str,
        amount: Optional[float] = None,
        currency: str = "PHP",
        details: Optional[str] = None,
    ) -> ActionConfirmation:
        """Generate a neutral completion confirmation."""
        amount_str = f" ₱{amount:,.2f}" if amount else ""
        details_str = f" — {details}" if details else ""
        message = f"✅ {entity_type} #{entity_id}{amount_str} processed successfully{details_str}"

        return ActionConfirmation(
            action_type=ActionType.APPROVE,
            entity_type=entity_type,
            entity_id=str(entity_id),
            success=True,
            message=message,
            details={
                "amount": amount,
                "currency": currency,
                "notes": details,
            },
        )

    @staticmethod
    def rejection_success(
        entity_type: str,
        entity_id: str,
        reason: Optional[str] = None,
    ) -> ActionConfirmation:
        """Generate rejection success confirmation."""
        reason_str = f" — {reason}" if reason else ""
        message = f"❌ {entity_type} #{entity_id} rejected{reason_str}"

        return ActionConfirmation(
            action_type=ActionType.REJECT,
            entity_type=entity_type,
            entity_id=str(entity_id),
            success=True,
            message=message,
            details={"reason": reason},
        )

    @staticmethod
    def deletion_success(
        entity_type: str,
        entity_id: str,
        cascade_count: int = 0,
    ) -> ActionConfirmation:
        """Generate deletion success confirmation."""
        cascade_str = f" and {cascade_count} related records" if cascade_count > 0 else ""
        message = f"🗑️ {entity_type} #{entity_id} deleted successfully{cascade_str}"

        return ActionConfirmation(
            action_type=ActionType.DELETE,
            entity_type=entity_type,
            entity_id=str(entity_id),
            success=True,
            message=message,
            details={"cascade_count": cascade_count},
        )

    @staticmethod
    def creation_success(
        entity_type: str,
        entity_id: str,
        details: Optional[str] = None,
    ) -> ActionConfirmation:
        """Generate creation success confirmation."""
        details_str = f" — {details}" if details else ""
        message = f"✨ {entity_type} #{entity_id} created successfully{details_str}"

        return ActionConfirmation(
            action_type=ActionType.CREATE,
            entity_type=entity_type,
            entity_id=str(entity_id),
            success=True,
            message=message,
        )

    @staticmethod
    def update_success(
        entity_type: str,
        entity_id: str,
        changes: Optional[Dict[str, Any]] = None,
    ) -> ActionConfirmation:
        """Generate update success confirmation."""
        message = f"📝 {entity_type} #{entity_id} updated successfully"

        return ActionConfirmation(
            action_type=ActionType.UPDATE,
            entity_type=entity_type,
            entity_id=str(entity_id),
            success=True,
            message=message,
            details={"changes": changes or {}},
        )

    @staticmethod
    def withdrawal_success(
        amount: float,
        currency: str = "PHP",
        destination: Optional[str] = None,
    ) -> ActionConfirmation:
        """Generate withdrawal success confirmation."""
        destination_str = f" to {destination}" if destination else ""
        message = f"💸 Withdrawal of ₱{amount:,.2f} {currency} processed successfully{destination_str}"

        return ActionConfirmation(
            action_type=ActionType.WITHDRAW,
            entity_type="withdrawal",
            entity_id="",
            success=True,
            message=message,
            details={
                "amount": amount,
                "currency": currency,
                "destination": destination,
            },
        )

    @staticmethod
    def transfer_success(
        amount: float,
        from_account: str,
        to_account: str,
        currency: str = "PHP",
    ) -> ActionConfirmation:
        """Generate transfer success confirmation."""
        message = f"➡️ Transfer of ₱{amount:,.2f} {currency} from {from_account} to {to_account} completed"

        return ActionConfirmation(
            action_type=ActionType.TRANSFER,
            entity_type="transfer",
            entity_id="",
            success=True,
            message=message,
            details={
                "amount": amount,
                "from": from_account,
                "to": to_account,
                "currency": currency,
            },
        )

    @staticmethod
    def error_confirmation(
        action_type: ActionType,
        entity_type: str,
        entity_id: str,
        error_message: str,
    ) -> ActionConfirmation:
        """Generate error confirmation."""
        message = f"⚠️ {action_type.value.title()} {entity_type} #{entity_id} failed: {error_message}"

        return ActionConfirmation(
            action_type=action_type,
            entity_type=entity_type,
            entity_id=str(entity_id),
            success=False,
            message=message,
            details={"error": error_message},
        )

    @staticmethod
    def batch_action_success(
        action_type: ActionType,
        entity_type: str,
        count: int,
        succeeded: int,
        failed: int = 0,
    ) -> ActionConfirmation:
        """Generate batch action confirmation."""
        failed_str = f", {failed} failed" if failed > 0 else ""
        message = f"📦 Batch {action_type.value}: {succeeded}/{count} {entity_type}s processed{failed_str}"

        return ActionConfirmation(
            action_type=action_type,
            entity_type=f"batch_{entity_type}",
            entity_id=f"{count}",
            success=failed == 0,
            message=message,
            details={
                "total": count,
                "succeeded": succeeded,
                "failed": failed,
            },
        )

    @staticmethod
    def confirmation_prompt(
        action_type: ActionType,
        entity_type: str,
        entity_id: str,
        details: Optional[str] = None,
    ) -> str:
        """Generate a confirmation prompt message for user approval."""
        details_str = f"\n\n{details}" if details else ""
        action_verb = {
            ActionType.APPROVE: "approve",
            ActionType.REJECT: "reject",
            ActionType.DELETE: "delete",
            ActionType.WITHDRAW: "process withdrawal for",
            ActionType.TRANSFER: "transfer",
        }.get(action_type, action_type.value)

        return (
            f"Are you sure you want to {action_verb} "
            f"{entity_type} #{entity_id}?{details_str}\n\n"
            f"This action cannot be undone."
        )
