"""add terms_accepted to users

Revision ID: ad62b034217c
Revises: d8e451ce2fba
Create Date: 2026-11-23 23:09:05.789953

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'ad62b034217c'
down_revision: str | Sequence[str] | None = 'd8e451ce2fba'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('terms_accepted', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'terms_accepted')
