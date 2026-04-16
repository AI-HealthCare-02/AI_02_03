"""add social login columns to users

Revision ID: d5e6f7a8b9c0
Revises: a2b3c4d5e6f7
Create Date: 2026-04-16 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("social_provider", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("social_id", sa.String(length=100), nullable=True))
    # 소셜 로그인 사용자는 이메일 없이 가입 가능 → nullable 허용
    op.alter_column("users", "email", existing_type=sa.String(length=40), nullable=True)


def downgrade() -> None:
    op.alter_column("users", "email", existing_type=sa.String(length=40), nullable=False)
    op.drop_column("users", "social_id")
    op.drop_column("users", "social_provider")
