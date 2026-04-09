"""add daily_health_logs table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: str | None = "b2c3d4e5f6a7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "daily_health_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("log_date", sa.Date(), nullable=False),
        sa.Column("weight", sa.Float(), nullable=True),
        sa.Column("exercise_done", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("exercise_duration", sa.Integer(), nullable=True),
        sa.Column("alcohol_consumed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("alcohol_amount", sa.Float(), nullable=True),
        sa.Column("smoking_done", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("smoking_amount", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "log_date", name="uq_user_log_date"),
    )


def downgrade() -> None:
    op.drop_table("daily_health_logs")
