"""Backend services package

Core services for payment processing, authentication, and data management.
"""
# Payment services
from .payment_gateway import PaymentGateway
from .payment_processing import PaymentProcessor
from .transactions import TransactionsService
from .swiftpay_service import SwiftPayService

# Note: Only SwiftPay and Magpie are used
# - SwiftPay: Local Philippine payments (GCash, Maya, Bank, QR)
# - Magpie: International payments (Alipay, WeChat)

__all__ = [
    "PaymentGateway",
    "PaymentProcessor",
    "TransactionsService",
    "SwiftPayService",
]
