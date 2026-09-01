--- a/backend/services/background_tasks.py
+++ b/backend/services/background_tasks.py
@@
 from models.transactions import Transactions
 from models.wallets import Wallets
 from services.transactions import TransactionsService
+try:
+    from services.manual_deposits import ManualDepositService
+except Exception:
+    ManualDepositService = None
@@
     async def start_worker(self):
@@
-                # Run sync every 10 minutes
-                await self.sync_pending_transactions()
-
-                # Run clearing cycle once an hour (or check daily window)
-                # In production, this would be more precisely scheduled.
-                await self.run_clearing_cycle()
-
-                await asyncio.sleep(600) # Sleep for 10 minutes
+                # Run sync every 10 minutes
+                await self.sync_pending_transactions()
+
+                # Run clearing cycle once an hour (or check daily window)
+                # In production, this would be more precisely scheduled.
+                await self.run_clearing_cycle()
+
+                # Run receipt matching cycle (if service present)
+                try:
+                    if ManualDepositService is not None:
+                        await self.run_receipt_matching_cycle()
+                except Exception as e:
+                    logger.exception("Receipt matching loop error: %s", e)
+
+                await asyncio.sleep(600) # Sleep for 10 minutes
@@
 # Global instance
 background_worker = BackgroundTasksService()
+
+    async def run_receipt_matching_cycle(self):
+        """Attempt to re-run auto-matching for pending manual deposit receipts."""
+        if ManualDepositService is None:
+            return
+        logger.info("Running receipt matching cycle")
+        async with db_manager.async_session_maker() as db:
+            svc = ManualDepositService(db)
+            pending = await svc.list_pending(limit=100)
+            for rec in pending:
+                try:
+                    await svc.try_auto_match(rec.id)
+                except Exception:
+                    logger.exception("Failed to auto-match receipt %s", rec.id)
