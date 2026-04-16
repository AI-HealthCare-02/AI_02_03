"""add nickname to users

Revision ID: 561f979d7636
Revises: 698ae63f53f9
Create Date: 2026-04-01

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "561f979d7636"
down_revision: Union[str, None] = "68bc0f975eca"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(20)")
    op.execute("UPDATE users SET nickname = email WHERE nickname IS NULL")
    op.execute("ALTER TABLE users ALTER COLUMN nickname SET NOT NULL")


def downgrade() -> None:
    op.drop_column("users", "nickname")
