from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.daily_health_logs import DailyHealthLogResponse, DailyHealthLogUpdateRequest, DailyHealthLogUpsertRequest
from app.models.users import User
from app.services.daily_health_logs import DailyHealthLogService

daily_health_log_router = APIRouter(prefix="/health-logs", tags=["health-logs"])


def get_service(db: Annotated[AsyncSession, Depends(get_db)]) -> DailyHealthLogService:
    return DailyHealthLogService(db)


@daily_health_log_router.get("/me", response_model=list[DailyHealthLogResponse], status_code=status.HTTP_200_OK)
async def get_my_logs(
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[DailyHealthLogService, Depends(get_service)],
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
) -> Response:
    logs = await service.get_by_month(user.id, year, month)
    return Response(
        [DailyHealthLogResponse.model_validate(log).model_dump(mode="json") for log in logs],
        status_code=status.HTTP_200_OK,
    )


@daily_health_log_router.post("", response_model=DailyHealthLogResponse, status_code=status.HTTP_200_OK)
async def upsert_log(
    data: DailyHealthLogUpsertRequest,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[DailyHealthLogService, Depends(get_service)],
) -> Response:
    log = await service.upsert(user.id, data)
    return Response(
        DailyHealthLogResponse.model_validate(log).model_dump(mode="json"),
        status_code=status.HTTP_200_OK,
    )


@daily_health_log_router.patch("/{log_id}", response_model=DailyHealthLogResponse, status_code=status.HTTP_200_OK)
async def update_log(
    log_id: int,
    data: DailyHealthLogUpdateRequest,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[DailyHealthLogService, Depends(get_service)],
) -> Response:
    log = await service.update(user.id, log_id, data)
    return Response(
        DailyHealthLogResponse.model_validate(log).model_dump(mode="json"),
        status_code=status.HTTP_200_OK,
    )
