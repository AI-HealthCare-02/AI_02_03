"""add_ai_badge_columns_and_dynamic_badge_trigger

Revision ID: a1b2c3d4e5f6
Revises: 96c4b2aa2382
Create Date: 2026-04-17

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "96c4b2aa2382"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("user_badges", "badge_key", existing_type=sa.String(length=50), type_=sa.String(length=100))
    op.add_column("user_badges", sa.Column("badge_name", sa.String(length=100), nullable=True))
    op.add_column("user_badges", sa.Column("badge_description", sa.String(length=300), nullable=True))
    op.add_column("user_badges", sa.Column("badge_emoji", sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column("user_badges", "badge_emoji")
    op.drop_column("user_badges", "badge_description")
    op.drop_column("user_badges", "badge_name")
    op.alter_column("user_badges", "badge_key", existing_type=sa.String(length=100), type_=sa.String(length=50))
