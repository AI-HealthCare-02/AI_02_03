from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.health_surveys import (
    SurveyCreateRequest,
    SurveyCreateResponse,
    SurveyInfoResponse,
    SurveyUpdateRequest,
    SurveyUpdateResponse,
)
from app.models.users import User
from app.services.health_surveys import HealthSurveyService

survey_router = APIRouter(prefix="/surveys", tags=["surveys"])


def get_survey_service(db: Annotated[AsyncSession, Depends(get_db)]) -> HealthSurveyService:
    return HealthSurveyService(db)


@survey_router.post("", status_code=status.HTTP_201_CREATED)
async def create_survey(
    data: SurveyCreateRequest,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[HealthSurveyService, Depends(get_survey_service)],
) -> Response:
    survey = await service.create_survey(user, data)
    return Response(
        SurveyCreateResponse(detail="설문이 완료됐습니다.", bmi=survey.bmi).model_dump(),
        status_code=status.HTTP_201_CREATED,
    )


@survey_router.get("/me", response_model=SurveyInfoResponse, status_code=status.HTTP_200_OK)
async def get_my_survey(
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[HealthSurveyService, Depends(get_survey_service)],
) -> Response:
    survey = await service.get_survey(user)
    return Response(
        SurveyInfoResponse.model_validate(survey).model_dump(),
        status_code=status.HTTP_200_OK,
    )


@survey_router.put("/me", status_code=status.HTTP_200_OK)
async def update_my_survey(
    data: SurveyUpdateRequest,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[HealthSurveyService, Depends(get_survey_service)],
) -> Response:
    result = await service.update_survey(user, data)
    return Response(
        result.model_dump(),
        status_code=status.HTTP_200_OK,
    )
