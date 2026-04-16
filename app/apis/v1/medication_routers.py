from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.medications import (
    MedicationCompletionRequest,
    MedicationCompletionsByDate,
    MedicationCreateRequest,
    MedicationResponse,
)
from app.models.users import User
from app.services.medications import MedicationService

medication_router = APIRouter(prefix="/medications", tags=["medications"])


def get_medication_service(db: Annotated[AsyncSession, Depends(get_db)]) -> MedicationService:
    return MedicationService(db)


@medication_router.post("", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def create_medication(
    request: MedicationCreateRequest,
    user: Annotated[User, Depends(get_request_user)],
    medication_service: Annotated[MedicationService, Depends(get_medication_service)],
) -> Response:
    medication = await medication_service.create_medication(user.id, request)
    return Response(MedicationResponse.model_validate(medication).model_dump(), status_code=status.HTTP_201_CREATED)


@medication_router.get("/me", response_model=list[MedicationResponse], status_code=status.HTTP_200_OK)
async def get_my_medications(
    user: Annotated[User, Depends(get_request_user)],
    medication_service: Annotated[MedicationService, Depends(get_medication_service)],
) -> Response:
    medications = await medication_service.get_my_medications(user.id)
    return Response(
        [MedicationResponse.model_validate(m).model_dump() for m in medications], status_code=status.HTTP_200_OK
    )


@medication_router.get("/me/completions", response_model=MedicationCompletionsByDate, status_code=status.HTTP_200_OK)
async def get_completions(
    user: Annotated[User, Depends(get_request_user)],
    medication_service: Annotated[MedicationService, Depends(get_medication_service)],
    log_date: Annotated[date, Query()] = None,
) -> Response:
    result = await medication_service.get_completions(user.id, log_date or date.today())
    return Response(result.model_dump(), status_code=status.HTTP_200_OK)


@medication_router.patch("/{medication_id}/completions", status_code=status.HTTP_200_OK)
async def update_completion(
    medication_id: int,
    body: MedicationCompletionRequest,
    user: Annotated[User, Depends(get_request_user)],
    medication_service: Annotated[MedicationService, Depends(get_medication_service)],
) -> Response:
    await medication_service.update_completion(medication_id, user.id, body.date, body.time_index, body.completed)
    return Response({"detail": "복약 완료 여부가 업데이트되었습니다."}, status_code=status.HTTP_200_OK)


@medication_router.delete("/{medication_id}", status_code=status.HTTP_200_OK)
async def delete_medication(
    medication_id: int,
    user: Annotated[User, Depends(get_request_user)],
    medication_service: Annotated[MedicationService, Depends(get_medication_service)],
) -> Response:
    await medication_service.delete_medication(medication_id, user.id)
    return Response({"detail": "복약 정보가 삭제되었습니다."}, status_code=status.HTTP_200_OK)
