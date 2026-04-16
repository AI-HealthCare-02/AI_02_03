"""add notification fields

Revision ID: 43ce25b33b2b
Revises: a2b3c4d5e6f7
Create Date: 2026-04-16 12:29:37.285057
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "43ce25b33b2b"
down_revision: Union[str, None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notification_settings",
        sa.Column("challenge_notification", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "notification_settings",
        sa.Column("prediction_notification", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "notification_settings", sa.Column("goal_notification", sa.Boolean(), nullable=False, server_default="true")
    )
    op.add_column(
        "notification_settings", sa.Column("goal_achievement", sa.Boolean(), nullable=False, server_default="true")
    )
    op.execute(
        "ALTER TABLE notification_settings ALTER COLUMN notification_time TYPE TIME WITHOUT TIME ZONE USING notification_time::time without time zone"
    )


def downgrade() -> None:
    op.drop_column("notification_settings", "challenge_notification")
    op.drop_column("notification_settings", "prediction_notification")
    op.drop_column("notification_settings", "goal_notification")
    op.drop_column("notification_settings", "goal_achievement")
