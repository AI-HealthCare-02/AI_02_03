"""add_rating_image_to_food_logs

Revision ID: c30315c8f98f
Revises: 267e6f8394b9
Create Date: 2026-04-17 13:46:04.265722

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c30315c8f98f"
down_revision: Union[str, None] = "267e6f8394b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("food_logs", sa.Column("rating", sa.String(length=20), nullable=False, server_default="보통"))
    op.add_column("food_logs", sa.Column("image_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("food_logs", "image_url")
    op.drop_column("food_logs", "rating")
