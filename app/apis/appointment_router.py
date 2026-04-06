from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.appointment_dto import AppointmentCreateRequest, AppointmentResponse
from app.models.users import User
from app.services.appointment_service import AppointmentService

router = APIRouter(prefix="/appointments", tags=["appointments"])


def get_appointment_service(db: Annotated[AsyncSession, Depends(get_db)]) -> AppointmentService:
    return AppointmentService(db)


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    request: AppointmentCreateRequest,
    user: Annotated[User, Depends(get_request_user)],
    appointment_service: Annotated[AppointmentService, Depends(get_appointment_service)],
) -> Response:
    appointment = await appointment_service.create_appointment(user.id, request)
    return Response(
        AppointmentResponse.model_validate(appointment).model_dump(),
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/me", response_model=list[AppointmentResponse], status_code=status.HTTP_200_OK)
async def get_my_appointments(
    user: Annotated[User, Depends(get_request_user)],
    appointment_service: Annotated[AppointmentService, Depends(get_appointment_service)],
) -> Response:
    appointments = await appointment_service.get_my_appointments(user.id)
    return Response(
        [AppointmentResponse.model_validate(a).model_dump() for a in appointments],
        status_code=status.HTTP_200_OK,
    )


@router.delete("/{appointment_id}", status_code=status.HTTP_200_OK)
async def delete_appointment(
    appointment_id: int,
    user: Annotated[User, Depends(get_request_user)],
    appointment_service: Annotated[AppointmentService, Depends(get_appointment_service)],
) -> Response:
    await appointment_service.delete_appointment(appointment_id, user.id)
    return Response({"detail": "진료 예약이 삭제되었습니다."}, status_code=status.HTTP_200_OK)