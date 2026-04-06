from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dtos.medications import MedicationCreateRequest
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
            schedule=data.schedule,
        )

    async def get_my_medications(self, user_id: int) -> list[Medication]:
        return await self.medication_repo.get_all_by_user(user_id)

    async def toggle_taken(self, medication_id: int, user_id: int, is_taken: bool) -> Medication:
        medication = await self.medication_repo.get_by_id(medication_id, user_id)
        if not medication:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="복약 정보를 찾을 수 없습니다")
        return await self.medication_repo.update_taken(medication, is_taken)

    async def delete_medication(self, medication_id: int, user_id: int) -> None:
        medication = await self.medication_repo.get_by_id(medication_id, user_id)
        if not medication:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="복약 정보를 찾을 수 없습니다")
        await self.medication_repo.delete(medication)