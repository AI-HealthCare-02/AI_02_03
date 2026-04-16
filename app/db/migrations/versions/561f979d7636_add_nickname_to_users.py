"""add nickname to users

Revision ID: 561f979d7636
Revises: 698ae63f53f9
Create Date: 2026-04-01

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "561f979d7636"
down_revision: Union[str, None] = "698ae63f53f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("nickname", sa.String(length=20), nullable=True))
    op.execute("UPDATE users SET nickname = email WHERE nickname IS NULL")
    op.alter_column("users", "nickname", nullable=False)


def downgrade() -> None:
    op.drop_column("users", "nickname")
