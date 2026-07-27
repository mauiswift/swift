from core.database import Base
from sqlalchemy import Column, DateTime, Float, Index, Integer, String, func
from sqlalchemy.ext.hybrid import hybrid_property


class ExchangeRateHistory(Base):
    """Track exchange rate history for analytics and reporting."""
    __tablename__ = "exchange_rate_history"
    __table_args__ = (
        # Index for querying rates by currency pair
        Index("idx_xrate_history_pair", "currency_pair"),
        # Index for querying rates by date (for analytics)
        Index("idx_xrate_history_recorded", "recorded_at"),
        # Composite index for efficient range queries
        Index("idx_xrate_history_pair_date", "currency_pair", "recorded_at"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    currency_pair = Column(String, nullable=False)  # e.g., "USDT_PHP", "USD_EUR"
    rate = Column(Float, nullable=False)  # Exchange rate (e.g., 56.75 for USDT→PHP)
    provider = Column(String, nullable=False)  # Source: "coingecko", "yahoo_finance", "manual"
    source = Column(String, nullable=True)  # Additional context (e.g., API endpoint, override reason)
    
    # Metadata
    recorded_at = Column(DateTime(timezone=True), nullable=False)  # When this rate was recorded
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    # Backwards-compatible hybrid properties used by older tests/code
    @hybrid_property
    def from_currency(self) -> str:
        try:
            return self.currency_pair.split("_")[0]
        except Exception:
            return ""

    @from_currency.expression
    def from_currency(cls):
        # SQLite: substr(currency_pair, 1, instr(currency_pair, '_')-1)
        return func.substr(cls.currency_pair, 1, func.instr(cls.currency_pair, "_") - 1)

    @hybrid_property
    def to_currency(self) -> str:
        try:
            return self.currency_pair.split("_")[1]
        except Exception:
            return ""

    @to_currency.expression
    def to_currency(cls):
        # SQLite: substr(currency_pair, instr(currency_pair, '_')+1)
        return func.substr(cls.currency_pair, func.instr(cls.currency_pair, "_") + 1)
