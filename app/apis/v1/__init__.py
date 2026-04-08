from fastapi import APIRouter

from app.apis.v1.activity_routers import activity_router
from app.apis.v1.appointment_routers import router as appointment_router
from app.apis.v1.auth_routers import auth_router
from app.apis.v1.challenge_routers import challenge_router
from app.apis.v1.goal_routers import goal_router
from app.apis.v1.medication_routers import medication_router
from app.apis.v1.notification_routers import notification_router
from app.apis.v1.prediction_routers import prediction_router
from app.apis.v1.survey_routers import survey_router
from app.apis.v1.user_routers import user_router

v1_routers = APIRouter(prefix="/api/v1")
v1_routers.include_router(auth_router)
v1_routers.include_router(appointment_router)
v1_routers.include_router(user_router)
v1_routers.include_router(survey_router)
v1_routers.include_router(prediction_router)
v1_routers.include_router(challenge_router)
v1_routers.include_router(goal_router)
v1_routers.include_router(activity_router)
v1_routers.include_router(notification_router)
v1_routers.include_router(medication_router)
from app.apis.v1.dashboard_routers import dashboard_router

v1_routers.include_router(dashboard_router)