"""add custom challenges

Revision ID: f1a2b3c4d5e6
Revises: 3eeb171ec77f
Create Date: 2026-04-15 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "3eeb171ec77f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("challenges", sa.Column("is_custom", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("challenges", sa.Column("created_by", sa.BigInteger(), nullable=True))
    op.create_foreign_key("fk_challenges_created_by", "challenges", "users", ["created_by"], ["id"], ondelete="CASCADE")


def downgrade() -> None:
    op.drop_constraint("fk_challenges_created_by", "challenges", type_="foreignkey")
    op.drop_column("challenges", "created_by")
    op.drop_column("challenges", "is_custom")
