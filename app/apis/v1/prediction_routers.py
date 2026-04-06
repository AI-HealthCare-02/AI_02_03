from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.predictions import PredictionListItem, PredictionResponse
from app.models.users import User
from app.services.predictions import PredictionService

prediction_router = APIRouter(prefix="/predictions", tags=["predictions"])


def get_prediction_service(db: Annotated[AsyncSession, Depends(get_db)]) -> PredictionService:
    return PredictionService(db)


@prediction_router.post("", status_code=status.HTTP_200_OK)
async def create_prediction(
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[PredictionService, Depends(get_prediction_service)],
) -> Response:
    prediction = await service.predict(user)
    return Response(
        PredictionResponse.model_validate(prediction).model_dump(mode="json"),
        status_code=status.HTTP_200_OK,
    )


@prediction_router.get("/me", response_model=list[PredictionListItem], status_code=status.HTTP_200_OK)
async def get_my_predictions(
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[PredictionService, Depends(get_prediction_service)],
) -> Response:
    predictions = await service.get_predictions(user)
    return Response(
        [PredictionListItem.model_validate(p).model_dump(mode="json") for p in predictions],
        status_code=status.HTTP_200_OK,
    )
