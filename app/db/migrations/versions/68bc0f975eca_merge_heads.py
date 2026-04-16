"""merge heads

Revision ID: 68bc0f975eca
Revises: 43ce25b33b2b, d5e6f7a8b9c0
Create Date: 2026-04-16 15:48:56.145578

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "68bc0f975eca"
down_revision: Union[str, None] = ("43ce25b33b2b", "d5e6f7a8b9c0")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
