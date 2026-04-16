from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.reminders import ReminderCreateRequest, ReminderResponse, ReminderToggleRequest
from app.models.users import User
from app.services.reminders import ReminderService

reminder_router = APIRouter(prefix="/reminders", tags=["reminders"])


def get_reminder_service(db: Annotated[AsyncSession, Depends(get_db)]) -> ReminderService:
    return ReminderService(db)


@reminder_router.get("/me", response_model=list[ReminderResponse], status_code=status.HTTP_200_OK)
async def get_my_reminders(
    user: Annotated[User, Depends(get_request_user)],
    reminder_service: Annotated[ReminderService, Depends(get_reminder_service)],
) -> Response:
    reminders = await reminder_service.get_my_reminders(user.id)
    return Response(
        [ReminderResponse.model_validate(r).model_dump() for r in reminders], status_code=status.HTTP_200_OK
    )


@reminder_router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    request: ReminderCreateRequest,
    user: Annotated[User, Depends(get_request_user)],
    reminder_service: Annotated[ReminderService, Depends(get_reminder_service)],
) -> Response:
    reminder = await reminder_service.create_reminder(user.id, request)
    return Response(ReminderResponse.model_validate(reminder).model_dump(), status_code=status.HTTP_201_CREATED)


@reminder_router.patch("/{reminder_id}", response_model=ReminderResponse, status_code=status.HTTP_200_OK)
async def toggle_reminder(
    reminder_id: int,
    body: ReminderToggleRequest,
    user: Annotated[User, Depends(get_request_user)],
    reminder_service: Annotated[ReminderService, Depends(get_reminder_service)],
) -> Response:
    reminder = await reminder_service.toggle_reminder(reminder_id, user.id, body.enabled)
    return Response(ReminderResponse.model_validate(reminder).model_dump(), status_code=status.HTTP_200_OK)


@reminder_router.delete("/{reminder_id}", status_code=status.HTTP_200_OK)
async def delete_reminder(
    reminder_id: int,
    user: Annotated[User, Depends(get_request_user)],
    reminder_service: Annotated[ReminderService, Depends(get_reminder_service)],
) -> Response:
    await reminder_service.delete_reminder(reminder_id, user.id)
    return Response({"detail": "알림이 삭제되었습니다."}, status_code=status.HTTP_200_OK)
