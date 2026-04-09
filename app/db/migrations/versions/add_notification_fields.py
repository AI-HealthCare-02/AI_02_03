"""add notification setting extended fields

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: str | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "notification_settings", sa.Column("notification_time", sa.String(5), nullable=False, server_default="09:00")
    )
    op.add_column(
        "notification_settings",
        sa.Column("night_mode_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "notification_settings",
        sa.Column("daily_action_reminder", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "notification_settings", sa.Column("streak_reminder", sa.Boolean(), nullable=False, server_default=sa.true())
    )
    op.add_column(
        "notification_settings", sa.Column("risk_change_alert", sa.Boolean(), nullable=False, server_default=sa.true())
    )
    op.add_column(
        "notification_settings",
        sa.Column("goal_achievement_alert", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "notification_settings", sa.Column("meal_reminder", sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.add_column(
        "notification_settings", sa.Column("water_reminder", sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.add_column(
        "notification_settings", sa.Column("alcohol_warning", sa.Boolean(), nullable=False, server_default=sa.true())
    )
    op.add_column(
        "notification_settings",
        sa.Column("immediate_risk_alert", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "notification_settings",
        sa.Column("challenge_fail_warning", sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_column("notification_settings", "challenge_fail_warning")
    op.drop_column("notification_settings", "immediate_risk_alert")
    op.drop_column("notification_settings", "alcohol_warning")
    op.drop_column("notification_settings", "water_reminder")
    op.drop_column("notification_settings", "meal_reminder")
    op.drop_column("notification_settings", "goal_achievement_alert")
    op.drop_column("notification_settings", "risk_change_alert")
    op.drop_column("notification_settings", "streak_reminder")
    op.drop_column("notification_settings", "daily_action_reminder")
    op.drop_column("notification_settings", "night_mode_enabled")
    op.drop_column("notification_settings", "notification_time")
