"""add challenge maintenance fields (is_maintenance, last_checkin_at)

Revision ID: a1b2c3d4e5f6
Revises: 7fe1494e2f2d
Create Date: 2026-04-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '7fe1494e2f2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_challenges', sa.Column('is_maintenance', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('user_challenges', sa.Column('last_checkin_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('user_challenges', 'last_checkin_at')
    op.drop_column('user_challenges', 'is_maintenance')
