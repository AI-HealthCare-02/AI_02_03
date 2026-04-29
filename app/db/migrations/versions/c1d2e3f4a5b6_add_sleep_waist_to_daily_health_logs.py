"""add sleep_hours and waist to daily_health_logs

Revision ID: c1d2e3f4a5b6
Revises: b2c3d4e5f6a7, e7f8a9b0c1d2
Create Date: 2026-04-29 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str]] = ("b2c3d4e5f6a7", "e7f8a9b0c1d2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("daily_health_logs", sa.Column("sleep_hours", sa.Float(), nullable=True))
    op.add_column("daily_health_logs", sa.Column("waist", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("daily_health_logs", "waist")
    op.drop_column("daily_health_logs", "sleep_hours")
