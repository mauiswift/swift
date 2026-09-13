"""Service for generating user-facing wallet transaction labels.

Abstracts implementation details (manual vs automatic) to provide seamless user experience.
Manual operations appear integrated rather than exposing admin-level details.
"""

from typing import Optional


class WalletTransactionLabelingService:
    """Generate user-facing labels for wallet transactions that hide implementation details."""

    @staticmethod
    def generate_credit_note(
        gateway_label: str,
        gross_amount: float,
        description: str,
        transaction_type: str,
        reference_id: str,
        approval_note: Optional[str] = None,
    ) -> str:
        """
        Generate a user-facing credit transaction label.

        Hides whether the operation was manual (admin) or automatic (provider).
        Users see consistent branding regardless of approval method.

        Args:
            gateway_label: Payment gateway or "admin-manual" for manual approvals
            gross_amount: Transaction amount
            description: User-provided transaction description
            transaction_type: Type of transaction (payment_link, invoice, etc.)
            reference_id: External reference or transaction ID
            approval_note: Optional note from super admin approval

        Returns:
            User-facing transaction label/description
        """
        is_manual = gateway_label.strip().lower() == "admin-manual"

        # For manual operations, use a generic provider-neutral label
        # that makes it appear as an integrated gateway payment
        if is_manual:
            gateway_name = "Payment Processing"
        else:
            gateway_name = gateway_label

        credit_note = (
            f"{gateway_name} payment received (₱{gross_amount:,.2f}): "
            f"{description or transaction_type}"
        )

        if approval_note and approval_note.strip():
            credit_note += f" — {approval_note.strip()}"

        return credit_note

    @staticmethod
    def generate_fee_note(
        gateway_label: str,
        fee_amount: float,
        fee_rate: float,
    ) -> str:
        """
        Generate a user-facing fee deduction label.

        Hides manual vs. automatic distinction.

        Args:
            gateway_label: Payment gateway or "admin-manual"
            fee_amount: Fee amount deducted
            fee_rate: Fee percentage

        Returns:
            User-facing fee label
        """
        return (
            f"Payment processing fee ({fee_rate*100:.2f}%): "
            f"₱{fee_amount:,.2f}"
        )

    @staticmethod
    def generate_system_earnings_note(
        gateway_label: str,
        amount: float,
        fee_rate: float,
        commission_type: str = "collection",
    ) -> str:
        """
        Generate a note for system earnings (super admin commissions).

        Note: This is backend-only, not shown to users.

        Args:
            gateway_label: Payment gateway or "admin-manual"
            amount: Commission amount
            fee_rate: Fee percentage
            commission_type: Type of commission (collection, processing, etc.)

        Returns:
            System-facing earnings label
        """
        is_manual = gateway_label.strip().lower() == "admin-manual"

        if is_manual:
            return (
                f"Super admin {commission_type} commission "
                f"({fee_rate*100:.2f}%): ₱{amount:,.2f}"
            )
        else:
            return (
                f"Super admin {commission_type} commission via {gateway_label} "
                f"({fee_rate*100:.2f}%): ₱{amount:,.2f}"
            )

    @staticmethod
    def generate_upline_commission_note(
        gateway_label: str,
        amount: float,
        fee_rate: float,
        level: int,
    ) -> str:
        """
        Generate a note for upline commission records.

        Note: This is backend-only, not directly shown to users in wallet view.

        Args:
            gateway_label: Payment gateway or "admin-manual"
            amount: Commission amount
            fee_rate: Fee percentage
            level: Downline level

        Returns:
            Commission label
        """
        return (
            f"Upline commission (level {level}, {fee_rate*100:.2f}%): "
            f"₱{amount:,.2f}"
        )
