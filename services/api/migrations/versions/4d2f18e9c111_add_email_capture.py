"""add email capture columns to cf_users

Revision ID: 4d2f18e9c111
Revises: c6574d5a4e92
Create Date: 2026-04-19
"""
from alembic import op
import sqlalchemy as sa

revision = '4d2f18e9c111'
down_revision = 'c6574d5a4e92'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('cf_users', sa.Column('email', sa.Text(), nullable=True))
    op.add_column('cf_users', sa.Column('newsletter_opt_in', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('cf_users', sa.Column('email_captured_at', sa.DateTime(timezone=False), nullable=True))
    op.create_index('idx_cf_users_email', 'cf_users', ['email'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_cf_users_email', table_name='cf_users')
    op.drop_column('cf_users', 'email_captured_at')
    op.drop_column('cf_users', 'newsletter_opt_in')
    op.drop_column('cf_users', 'email')
