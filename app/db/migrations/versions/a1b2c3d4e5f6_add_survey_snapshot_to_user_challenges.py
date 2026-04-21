"""add survey_snapshot to user_challenges

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-04-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "a1b2c3d4e5f6"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_challenges", sa.Column("survey_snapshot", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("user_challenges", "survey_snapshot")
