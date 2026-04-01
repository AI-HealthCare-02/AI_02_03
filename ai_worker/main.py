from celery import Celery

from ai_worker.core.config import config

app = Celery(
    "ai_worker",
    broker=config.redis_url,
    backend=config.redis_url,
    include=["ai_worker.tasks.predict"],
)

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Seoul",
    enable_utc=True,
)
