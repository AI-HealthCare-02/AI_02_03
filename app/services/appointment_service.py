from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dtos.appointment_dto import AppointmentCreateRequest
from app.models.appointment import Appointment
from app.repositories.appointment_repository import AppointmentRepository


class AppointmentService:
    def __init__(self, session: AsyncSession):
        self.appointment_repo = AppointmentRepository(session)

    async def create_appointment(self, user_id: int, data: AppointmentCreateRequest) -> Appointment:
        return await self.appointment_repo.create(
            user_id=user_id,
            title=data.title,
            doctor_name=data.doctor_name,
            location=data.location,
            scheduled_at=data.scheduled_at,
            notes=data.notes,
        )

    async def get_my_appointments(self, user_id: int) -> list[Appointment]:
        return await self.appointment_repo.get_all_by_user(user_id)

    async def delete_appointment(self, appointment_id: int, user_id: int) -> None:
        appointment = await self.appointment_repo.get_by_id(appointment_id, user_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="진료 예약을 찾을 수 없습니다",
            )
        await self.appointment_repo.delete(appointment)