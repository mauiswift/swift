import logging
import random
import string
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.transactions import Transactions

logger = logging.getLogger(__name__)

# Use base36 alphabet for compact URLs (lowercase + digits, no confusing chars)
SHORT_URL_ALPHABET = string.ascii_lowercase + string.digits  # a-z0-9
SHORT_URL_LENGTH = 8  # 36^8 = ~2.8 trillion combinations


class URLShortenerService:
    """Service for generating and managing short payment URLs."""

    @staticmethod
    def generate_short_slug() -> str:
        """Generate a random short URL slug (8 characters, lowercase alphanumeric)."""
        return ''.join(random.choices(SHORT_URL_ALPHABET, k=SHORT_URL_LENGTH))

    @staticmethod
    async def create_short_url(db: AsyncSession, transaction_id: int) -> str:
        """
        Create a unique short URL slug for a transaction.
        Retries up to 5 times if slug collision occurs (extremely unlikely).
        """
        for attempt in range(5):
            slug = URLShortenerService.generate_short_slug()

            # Check if slug already exists
            existing = await db.execute(
                select(Transactions).where(Transactions.short_url_slug == slug).limit(1)
            )
            if existing.scalars().first():
                # Collision, retry
                continue

            # Found unique slug, update transaction
            txn = await db.get(Transactions, transaction_id)
            if txn:
                txn.short_url_slug = slug
                await db.commit()
                logger.info(f"Created short URL slug '{slug}' for transaction {transaction_id}")
                return slug

        # Should never happen (5 collision retries = ~35 quadrillion to 1 odds)
        raise RuntimeError(f"Could not generate unique short URL after 5 attempts for txn {transaction_id}")

    @staticmethod
    async def get_short_url_target(db: AsyncSession, slug: str) -> str | None:
        """
        Look up the full checkout URL for a short URL slug.
        Returns the checkout path (e.g., "/checkout/reference-123") or None if not found.
        """
        result = await db.execute(
            select(Transactions).where(Transactions.short_url_slug == slug).limit(1)
        )
        txn = result.scalars().first()
        if txn and txn.payment_url:
            return txn.payment_url
        return None
