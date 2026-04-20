"""cleanup_legacy_tables_and_columns

Revision ID: 96c4b2aa2382
Revises: c30315c8f98f
Create Date: 2026-04-17

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "96c4b2aa2382"
down_revision: Union[str, None] = "c30315c8f98f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # user_goals 테이블 삭제
    op.execute("DROP TABLE IF EXISTS user_goals")

    # notification_settings 레거시 컬럼 삭제
    conn = op.get_bind()
    existing_cols = {
        row[0]
        for row in conn.execute(
            sa.text("SELECT column_name FROM information_schema.columns WHERE table_name='notification_settings'")
        )
    }
    legacy_cols = [
        "appointment_reminder",
        "challenge_reminder",
        "daily_action_reminder",
        "goal_achievement_alert",
        "push_enabled",
        "weekly_report",
    ]
    for col in legacy_cols:
        if col in existing_cols:
            op.drop_column("notification_settings", col)

    # user_badges 레거시 인덱스 삭제
    existing_indexes = {
        row[0] for row in conn.execute(sa.text("SELECT indexname FROM pg_indexes WHERE tablename='user_badges'"))
    }
    if "ix_user_badges_user_id" in existing_indexes:
        op.drop_index("ix_user_badges_user_id", table_name="user_badges")

    # notification_time nullable 정합성 맞추기
    op.alter_column("notification_settings", "notification_time", existing_type=postgresql.TIME(), nullable=True)


def downgrade() -> None:
    op.alter_column("notification_settings", "notification_time", existing_type=postgresql.TIME(), nullable=False)

    op.create_index("ix_user_badges_user_id", "user_badges", ["user_id"], unique=False)

    op.add_column(
        "notification_settings", sa.Column("weekly_report", sa.Boolean(), nullable=False, server_default="false")
    )
    op.add_column(
        "notification_settings", sa.Column("push_enabled", sa.Boolean(), nullable=False, server_default="false")
    )
    op.add_column(
        "notification_settings",
        sa.Column("goal_achievement_alert", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "notification_settings",
        sa.Column("daily_action_reminder", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "notification_settings", sa.Column("challenge_reminder", sa.Boolean(), nullable=False, server_default="false")
    )
    op.add_column(
        "notification_settings", sa.Column("appointment_reminder", sa.Boolean(), nullable=False, server_default="false")
    )

    op.create_table(
        "user_goals",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_achieved", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
