"""cleanup columns: rename shap_factors, drop shap_feature

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-04-15 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "a2b3c4d5e6f7"
down_revision: Union[str, None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("predictions", "shap_factors", new_column_name="improvement_factors")
    op.drop_column("challenges", "shap_feature")


def downgrade() -> None:
    import sqlalchemy as sa

    op.add_column("challenges", sa.Column("shap_feature", sa.String(length=50), nullable=True))
    op.alter_column("predictions", "improvement_factors", new_column_name="shap_factors")
