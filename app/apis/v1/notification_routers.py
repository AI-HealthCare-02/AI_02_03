from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.notifications import NotificationSettingResponse, NotificationSettingUpdateRequest
from app.models.users import User
from app.services.notifications import NotificationService

notification_router = APIRouter(prefix="/notifications", tags=["notifications"])


def get_notification_service(db: Annotated[AsyncSession, Depends(get_db)]) -> NotificationService:
    return NotificationService(db)


@notification_router.get("/settings", response_model=NotificationSettingResponse, status_code=status.HTTP_200_OK)
async def get_notification_settings(
    user: Annotated[User, Depends(get_request_user)],
    notification_service: Annotated[NotificationService, Depends(get_notification_service)],
) -> Response:
    setting = await notification_service.get_or_create_settings(user.id)
    return Response(NotificationSettingResponse.model_validate(setting).model_dump(), status_code=status.HTTP_200_OK)


@notification_router.put("/settings", status_code=status.HTTP_200_OK)
async def update_notification_settings(
    request: NotificationSettingUpdateRequest,
    user: Annotated[User, Depends(get_request_user)],
    notification_service: Annotated[NotificationService, Depends(get_notification_service)],
) -> Response:
    await notification_service.update_settings(user.id, request)
    return Response({"detail": "알림 설정이 변경되었습니다."}, status_code=status.HTTP_200_OK)
