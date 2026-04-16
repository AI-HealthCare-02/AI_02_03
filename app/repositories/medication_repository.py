from datetime import date

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.medications import Medication, MedicationCompletion


class MedicationRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, user_id: int, name: str, dosage: str, times: list[str]) -> Medication:
        medication = Medication(user_id=user_id, name=name, dosage=dosage, times=times)
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

    async def delete(self, medication: Medication) -> None:
        await self._session.delete(medication)
        await self._session.flush()

    async def get_completions_by_date(self, medication_ids: list[int], log_date: date) -> list[MedicationCompletion]:
        if not medication_ids:
            return []
        result = await self._session.execute(
            select(MedicationCompletion).where(
                MedicationCompletion.medication_id.in_(medication_ids),
                MedicationCompletion.log_date == log_date,
            )
        )
        return list(result.scalars().all())

    async def upsert_completion(
        self, medication_id: int, log_date: date, time_index: int, completed: bool
    ) -> MedicationCompletion:
        stmt = (
            pg_insert(MedicationCompletion)
            .values(medication_id=medication_id, log_date=log_date, time_index=time_index, completed=completed)
            .on_conflict_do_update(
                index_elements=["medication_id", "log_date", "time_index"],
                set_={"completed": completed},
            )
            .returning(MedicationCompletion)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        return result.scalar_one()
