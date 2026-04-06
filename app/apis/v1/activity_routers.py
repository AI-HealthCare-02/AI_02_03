import csv
import io
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import ORJSONResponse as Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.activity import ActivityResponse
from app.models.users import User
from app.services.activity import ActivityService

activity_router = APIRouter(prefix="/activity", tags=["activity"])


def get_activity_service(db: Annotated[AsyncSession, Depends(get_db)]) -> ActivityService:
    return ActivityService(db)


@activity_router.get("/me", response_model=ActivityResponse, status_code=status.HTTP_200_OK)
async def get_my_activity(
    user: Annotated[User, Depends(get_request_user)],
    activity_service: Annotated[ActivityService, Depends(get_activity_service)],
    limit: int = Query(default=20, le=100),
) -> Response:
    result = await activity_service.get_my_activity(user.id, limit)
    return Response(result.model_dump(), status_code=status.HTTP_200_OK)


@activity_router.get("/report", status_code=status.HTTP_200_OK)
async def download_activity_report(
    user: Annotated[User, Depends(get_request_user)],
    activity_service: Annotated[ActivityService, Depends(get_activity_service)],
    format: str = Query(default="csv", pattern="^(csv)$"),
) -> StreamingResponse:
    result = await activity_service.get_my_activity(user.id, limit=1000)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["구분", "항목", "값", "일시"])
    for p in result.predictions:
        writer.writerow(["예측", f"점수: {p.score} / 등급: {p.grade}", "", p.created_at.strftime("%Y-%m-%d %H:%M:%S")])
    for c in result.challenges:
        writer.writerow(["챌린지", c.challenge_name, c.status, c.joined_at.strftime("%Y-%m-%d %H:%M:%S")])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=\"health_report.csv\""},
    )
