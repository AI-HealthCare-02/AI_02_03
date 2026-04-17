"""add_food_logs_table

Revision ID: 267e6f8394b9
Revises: 8d13160b4511
Create Date: 2026-04-17 13:39:33.931996

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "267e6f8394b9"
down_revision: Union[str, None] = "8d13160b4511"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "food_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("food_name", sa.String(length=200), nullable=False),
        sa.Column("calories", sa.Integer(), nullable=False),
        sa.Column("fat", sa.Integer(), nullable=False),
        sa.Column("sugar", sa.Integer(), nullable=False),
        sa.Column("liver_impact", sa.String(length=500), nullable=False),
        sa.Column("recommendation", sa.String(length=500), nullable=False),
        sa.Column("analyzed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("food_logs")
