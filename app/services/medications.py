from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dtos.medications import MedicationCompletionsByDate, MedicationCreateRequest
from app.models.medications import Medication
from app.repositories.medication_repository import MedicationRepository


class MedicationService:
    def __init__(self, session: AsyncSession):
        self.medication_repo = MedicationRepository(session)

    async def create_medication(self, user_id: int, data: MedicationCreateRequest) -> Medication:
        return await self.medication_repo.create(
            user_id=user_id,
            name=data.name,
            dosage=data.dosage,
            times=data.times,
        )

    async def get_my_medications(self, user_id: int) -> list[Medication]:
        return await self.medication_repo.get_all_by_user(user_id)

    async def get_completions(self, user_id: int, log_date: date) -> MedicationCompletionsByDate:
        medications = await self.medication_repo.get_all_by_user(user_id)
        med_ids = [m.id for m in medications]
        rows = await self.medication_repo.get_completions_by_date(med_ids, log_date)
        completions = {row.time_index: row.completed for row in rows}
        return MedicationCompletionsByDate(date=log_date, completions=completions)

    async def update_completion(
        self, medication_id: int, user_id: int, log_date: date, time_index: int, completed: bool
    ) -> None:
        medication = await self.medication_repo.get_by_id(medication_id, user_id)
        if not medication:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="복약 정보를 찾을 수 없습니다")
        await self.medication_repo.upsert_completion(medication_id, log_date, time_index, completed)

    async def delete_medication(self, medication_id: int, user_id: int) -> None:
        medication = await self.medication_repo.get_by_id(medication_id, user_id)
        if not medication:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="복약 정보를 찾을 수 없습니다")
        await self.medication_repo.delete(medication)
