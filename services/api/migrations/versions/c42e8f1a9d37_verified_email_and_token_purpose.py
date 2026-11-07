"""verified email + recovery token purpose

Revision ID: c42e8f1a9d37
Revises: b81d4c6e7a21
Create Date: 2026-11-07
"""
from alembic import op
import sqlalchemy as sa

revision = 'c42e8f1a9d37'
down_revision = 'b81d4c6e7a21'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('cf_users', sa.Column('email_verified_at', sa.DateTime(timezone=False), nullable=True))
    op.add_column('cf_recovery_tokens', sa.Column('purpose', sa.String(), nullable=False, server_default='restore'))
    op.add_column('cf_recovery_tokens', sa.Column('email', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('cf_recovery_tokens', 'email')
    op.drop_column('cf_recovery_tokens', 'purpose')
    op.drop_column('cf_users', 'email_verified_at')
