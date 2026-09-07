"""Authenticated in-app notification endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.domains.auth.models.user import User
from app.domains.notifications.schemas.notification_schemas import (
    NotificationResponse,
)
from app.domains.notifications.services.notification_service import NotificationService

router = APIRouter(tags=["Notifications"])
DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.get("/my")
async def list_my_notifications(
    db: DbDep,
    current_user: CurrentUserDep,
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    notifications = await NotificationService(db).list_for_user(
        current_user.id,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )
    return {
        "success": True,
        "data": [NotificationResponse.model_validate(item) for item in notifications],
    }


@router.get("/unread-count")
async def get_unread_count(db: DbDep, current_user: CurrentUserDep) -> dict:
    count = await NotificationService(db).count_unread(current_user.id)
    return {"success": True, "data": {"count": count}}


@router.post("/read", status_code=status.HTTP_200_OK)
async def mark_notifications_read(
    db: DbDep,
    current_user: CurrentUserDep,
    notification_ids: list[uuid.UUID] | None = None,
) -> dict:
    updated = await NotificationService(db).mark_read(current_user.id, notification_ids)
    return {"success": True, "data": {"updated": updated}}
