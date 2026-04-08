from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.dashboard import DashboardResponse
from app.models.users import User
from app.services.dashboard_service import DashboardService

dashboard_router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def get_dashboard_service(db: Annotated[AsyncSession, Depends(get_db)]) -> DashboardService:
    return DashboardService(db)


@dashboard_router.get("", response_model=DashboardResponse, status_code=status.HTTP_200_OK)
async def get_dashboard(
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[DashboardService, Depends(get_dashboard_service)],
) -> Response:
    result = await service.get_dashboard(user.id)
    return Response(result.model_dump(mode="json"), status_code=status.HTTP_200_OK)