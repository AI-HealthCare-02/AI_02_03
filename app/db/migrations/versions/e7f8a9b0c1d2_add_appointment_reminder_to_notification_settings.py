"""add appointment_reminder to notification_settings

Revision ID: e7f8a9b0c1d2
Revises: 43ce25b33b2b
Create Date: 2026-04-28 00:00:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, None] = "43ce25b33b2b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notification_settings",
        sa.Column("appointment_reminder", sa.Boolean(), nullable=False, server_default="true"),
    )


def downgrade() -> None:
    op.drop_column("notification_settings", "appointment_reminder")
