"""add cf_recovery_tokens

Revision ID: b81d4c6e7a21
Revises: 9b3e5a7c2f10
Create Date: 2026-11-02
"""
from alembic import op
import sqlalchemy as sa

revision = 'b81d4c6e7a21'
down_revision = '9b3e5a7c2f10'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'cf_recovery_tokens',
        sa.Column('token_hash', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('cf_users.user_id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=False), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=False), nullable=True),
    )
    op.create_index('idx_cf_recovery_tokens_user_id', 'cf_recovery_tokens', ['user_id'])


def downgrade() -> None:
    op.drop_index('idx_cf_recovery_tokens_user_id', table_name='cf_recovery_tokens')
    op.drop_table('cf_recovery_tokens')
