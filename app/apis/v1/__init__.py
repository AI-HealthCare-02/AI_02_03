from fastapi import APIRouter
from app.apis.v1.auth_routers import auth_router
from app.apis.v1.user_routers import user_router
from app.apis.v1.goal_routers import goal_router
from app.apis.v1.activity_routers import activity_router
from app.apis.v1.notification_routers import notification_router

v1_routers = APIRouter(prefix="/api/v1")
v1_routers.include_router(auth_router)
v1_routers.include_router(user_router)
v1_routers.include_router(goal_router)
v1_routers.include_router(activity_router)
v1_routers.include_router(notification_router)
