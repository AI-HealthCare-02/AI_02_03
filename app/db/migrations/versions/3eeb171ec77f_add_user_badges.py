"""add user_badges

Revision ID: 3eeb171ec77f
Revises: a9edf6cc6636
Create Date: 2026-04-14 18:34:38.877135

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3eeb171ec77f"
down_revision: Union[str, None] = "79d74d37ccad"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_badges (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            badge_key VARCHAR(50) NOT NULL,
            earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)


def downgrade() -> None:
    op.drop_table("user_badges")
