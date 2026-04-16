from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment


class AppointmentRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(
        self,
        user_id: int,
        hospital_name: str,
        visit_date: datetime,
        memo: str | None,
    ) -> Appointment:
        appointment = Appointment(
            user_id=user_id,
            hospital_name=hospital_name,
            visit_date=visit_date,
            memo=memo,
        )
        self._session.add(appointment)
        await self._session.flush()
        await self._session.refresh(appointment)
        return appointment

    async def get_all_by_user(self, user_id: int) -> list[Appointment]:
        result = await self._session.execute(
            select(Appointment).where(Appointment.user_id == user_id).order_by(Appointment.visit_date.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, appointment_id: int, user_id: int) -> Appointment | None:
        result = await self._session.execute(
            select(Appointment).where(
                Appointment.id == appointment_id,
                Appointment.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def delete(self, appointment: Appointment) -> None:
        await self._session.delete(appointment)
        await self._session.flush()
