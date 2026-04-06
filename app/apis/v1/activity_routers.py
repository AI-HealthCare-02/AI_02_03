from typing import Annotated
import csv
import io
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import ORJSONResponse as Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.activity import ActivityLogResponse
from app.models.users import User
from app.services.activity import ActivityService

activity_router = APIRouter(prefix="/activity", tags=["activity"])

def get_activity_service(db: Annotated[AsyncSession, Depends(get_db)]) -> ActivityService:
    return ActivityService(db)

@activity_router.get("/me", response_model=list[ActivityLogResponse], status_code=status.HTTP_200_OK)
async def get_my_activity(
    user: Annotated[User, Depends(get_request_user)],
    activity_service: Annotated[ActivityService, Depends(get_activity_service)],
    limit: int = Query(default=20, le=100),
) -> Response:
    logs = await activity_service.get_my_activity(user.id, limit)
    return Response(
        [ActivityLogResponse.model_validate(log).model_dump() for log in logs],
        status_code=status.HTTP_200_OK
    )

@activity_router.get("/report", status_code=status.HTTP_200_OK)
async def download_activity_report(
    user: Annotated[User, Depends(get_request_user)],
    activity_service: Annotated[ActivityService, Depends(get_activity_service)],
    format: str = Query(default="csv", pattern="^(csv)$"),
) -> StreamingResponse:
    logs = await activity_service.get_my_activity(user.id, limit=1000)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["ID", "활동 유형", "설명", "생성일시"])
    for log in logs:
        writer.writerow([
            log.id,
            log.activity_type,
            log.description or "",
            log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=activity_report_{user.id}.csv"}
    )