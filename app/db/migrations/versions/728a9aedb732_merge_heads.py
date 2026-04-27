"""merge heads

Revision ID: 728a9aedb732
Revises: ae700cd4eb74, b2c3d4e5f6a7
Create Date: 2026-04-21 18:11:43.645153

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "728a9aedb732"
down_revision: Union[str, None] = ("ae700cd4eb74", "b2c3d4e5f6a7")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
