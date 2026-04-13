"""add user_badges table

Revision ID: d1e2f3a4b5c6
Revises: 16831bce556a
Create Date: 2026-04-13

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d1e2f3a4b5c6"
down_revision: str | None = "16831bce556a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_badges",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("badge_key", sa.String(50), nullable=False),
        sa.Column("earned_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_badges_user_id", "user_badges", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_user_badges_user_id", table_name="user_badges")
    op.drop_table("user_badges")
