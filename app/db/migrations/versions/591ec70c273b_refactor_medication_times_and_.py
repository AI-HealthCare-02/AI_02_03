"""refactor_medication_times_and_completions

Revision ID: 591ec70c273b
Revises: 561f979d7636
Create Date: 2026-04-16 19:15:16.218975

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '591ec70c273b'
down_revision: Union[str, None] = '561f979d7636'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "medication_completions",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("medication_id", sa.BigInteger(), nullable=False),
        sa.Column("log_date", sa.Date(), nullable=False),
        sa.Column("time_index", sa.Integer(), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["medication_id"], ["medications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("medication_id", "log_date", "time_index"),
    )
    op.add_column("medications", sa.Column("times", sa.JSON(), nullable=True))
    op.execute("UPDATE medications SET times = json_build_array(schedule) WHERE times IS NULL")
    op.alter_column("medications", "times", nullable=False)
    op.drop_column("medications", "taken_today")
    op.drop_column("medications", "schedule")


def downgrade() -> None:
    op.add_column("medications", sa.Column("schedule", sa.VARCHAR(length=50), autoincrement=False, nullable=True))
    op.add_column("medications", sa.Column("taken_today", sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.execute("UPDATE medications SET schedule = times->0, taken_today = false")
    op.alter_column("medications", "schedule", nullable=False)
    op.alter_column("medications", "taken_today", nullable=False)
    op.drop_column("medications", "times")
    op.drop_table("medication_completions")