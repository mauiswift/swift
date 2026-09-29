import json
import time

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse

from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from services.event_bus import payment_event_bus

router = APIRouter(prefix="/api/v1/events", tags=["events"])


@router.get("/stream")
async def event_stream(
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
):
    """SSE endpoint for real-time payment status updates"""

    async def generate():
        last_ts = time.time()
        # Send initial keepalive
        yield f"data: {json.dumps({'type': 'connected', 'message': 'SSE connected'})}\n\n"

        while True:
            # Check if client disconnected
            if await request.is_disconnected():
                break

            # Wait for new events or timeout
            has_event = await payment_event_bus.wait_for_event(timeout=15.0)

            if has_event:
                events = payment_event_bus.get_events_since(last_ts)
                for event in events:
                    event_data = {
                        "type": event.get("event_type", "status_change"),
                        "transaction_id": event.get("transaction_id"),
                        "external_id": event.get("external_id"),
                        "old_status": event.get("old_status"),
                        "new_status": event.get("new_status"),
                        "amount": event.get("amount"),
                        "description": event.get("description"),
                        "transaction_type": event.get("transaction_type"),
                        "timestamp": event.get("timestamp"),
                    }
                    yield f"data: {json.dumps(event_data)}\n\n"
                    last_ts = event["timestamp"]
            else:
                # Send keepalive ping
                yield f"data: {json.dumps({'type': 'ping'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/recent")
async def get_recent_events(
    since: float = Query(0, description="Timestamp to get events since"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Polling endpoint: get recent payment events since a timestamp, user-scoped"""
    # Filter events by user unless super admin
    is_super = current_user.permissions and current_user.permissions.is_super_admin

    all_events = payment_event_bus.get_events_since(since) if since > 0 else payment_event_bus.get_recent_events(20)

    # User-scoping
    user_id = str(current_user.id)
    # We also check for "tg-" prefix since many events use it internally
    tg_user_id = f"tg-{user_id}"

    filtered_events = []
    for event in all_events:
        event_user_id = event.get("user_id")
        event_organization_id = event.get("organization_id")
        same_organization = (
            current_user.organization_id is not None
            and event_organization_id == current_user.organization_id
        )
        if (
            is_super
            or same_organization
            or not event_user_id
            or event_user_id == user_id
            or event_user_id == tg_user_id
        ):
            filtered_events.append(event)

    return {
        "events": filtered_events,
        "server_time": time.time(),
    }
