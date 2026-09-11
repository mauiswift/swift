"""Safe, deterministic first responses for common live-chat questions."""

from __future__ import annotations

import re
from typing import Optional


AUTO_RESPONDER_NAME = "SwiftPay Assistant"

_KNOWLEDGE: tuple[tuple[tuple[str, ...], str], ...] = (
    (
        ("payment link", "pay link", "invoice", "checkout"),
        "Payment links and invoices stay pending until a super admin reviews and approves them. After approval, the checkout owner receives the customer amount minus the applicable collection fees.",
    ),
    (
        ("pending", "not credited", "not received", "waiting"),
        "A payment can remain pending while it is being reviewed or while a bank transfer is being confirmed. Please send the payment reference and receipt in this chat so the support team can check it.",
    ),
    (
        ("fee", "fees", "commission", "charge"),
        "Collection fees are deducted from the checkout owner's wallet credit. The configured base fee goes to the system commission wallet, and eligible active uplines receive their configured commission share.",
    ),
    (
        ("krw", "korean", "toss", "korea", "won"),
        "KRW payments use the manual Korean bank-transfer flow. Enter the amount, review the Toss Bank account instructions, transfer the exact amount, and include the order reference in the transfer note.",
    ),
    (
        ("cny", "yuan", "alipay", "wechat"),
        "CNY payments can use the configured Alipay or WeChat Pay channels when enabled for the account. If a channel is unavailable, please share the payment reference and our team will check the configuration.",
    ),
    (
        ("php", "peso", "philippine", "bank transfer"),
        "PHP payments use the enabled bank or wallet channels shown on the checkout page. Follow the exact amount and account instructions, then keep the order reference with your transfer proof.",
    ),
    (
        ("withdraw", "withdrawal", "cash out"),
        "To withdraw, open Wallet, choose the currency, select Withdraw, enter the destination details, and submit the request. Withdrawals are reviewed before they are processed.",
    ),
    (
        ("usdt", "trc-20", "crypto"),
        "USDT wallet transfers use the TRC-20 network. Confirm the destination address and network carefully before submitting because blockchain transfers cannot normally be reversed.",
    ),
    (
        ("login", "sign in", "password", "account"),
        "For login help, verify the account email and password first. If access is still blocked, tell us the account email and the exact error message—never send your password or private keys.",
    ),
    (
        ("vip", "vip gold"),
        "VIP access is assigned by an administrator. If your VIP label is missing, share your account email or user ID and the support team can verify the account status.",
    ),
)


def get_auto_response(message: str) -> Optional[str]:
    """Return a helpful answer only when the message matches a known topic."""
    normalized = re.sub(r"\s+", " ", message.strip().lower())
    if not normalized:
        return None

    for keywords, response in _KNOWLEDGE:
        if any(keyword in normalized for keyword in keywords):
            return response + "\n\nIf this does not answer your question, reply with your payment reference or describe what you need and a super admin will follow up."
    return None

