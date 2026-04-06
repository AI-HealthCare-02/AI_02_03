from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.medications import Medication


class MedicationRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, user_id: int, name: str, dosage: str, schedule: str) -> Medication:
        medication = Medication(user_id=user_id, name=name, dosage=dosage, schedule=schedule)
        self._session.add(medication)
        await self._session.flush()
        await self._session.refresh(medication)
        return medication

    async def get_all_by_user(self, user_id: int) -> list[Medication]:
        result = await self._session.execute(
            select(Medication).where(Medication.user_id == user_id).order_by(Medication.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, medication_id: int, user_id: int) -> Medication | None:
        result = await self._session.execute(
            select(Medication).where(Medication.id == medication_id, Medication.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def update_taken(self, medication: Medication, taken_today: bool) -> Medication:
        medication.taken_today = taken_today
        await self._session.flush()
        await self._session.refresh(medication)
        return medication

    async def delete(self, medication: Medication) -> None:
        await self._session.delete(medication)
        await self._session.flush()