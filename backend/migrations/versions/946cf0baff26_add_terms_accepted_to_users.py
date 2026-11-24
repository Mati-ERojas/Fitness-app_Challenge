"""add terms_accepted to users

Revision ID: 946cf0baff26
Revises: ad62b034217c
Create Date: 2026-11-23 23:09:29.346405

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '946cf0baff26'
down_revision: Union[str, Sequence[str], None] = 'ad62b034217c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # This migration was a duplicate/empty revision generated during development.
    # No schema changes are needed here as terms_accepted was added in ad62b034217c.
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
