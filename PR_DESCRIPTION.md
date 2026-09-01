## Fix: avoid SQLAlchemy reserved attribute name 'metadata'

This PR renames the SQLAlchemy model attribute `metadata` to `metadata_json` on
ManualDepositReceipt while preserving the underlying database column name
as `metadata`. A compatibility property `metadata` with a setter is provided to
avoid breaking existing call sites.

No database migration is necessary: the DB column name remains `metadata`.

Closes: N/A
