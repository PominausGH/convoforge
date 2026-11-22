"""email sign-in: verified emails, login tokens, synced challenge progress

Revision ID: 8b3e1c7a2f40
Revises: 4d2f18e9c111
Create Date: 2026-11-22
"""
from alembic import op
import sqlalchemy as sa

revision = '8b3e1c7a2f40'
down_revision = '4d2f18e9c111'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('cf_users', sa.Column('email_verified_at', sa.DateTime(timezone=False), nullable=True))
    op.add_column('cf_users', sa.Column('friend_challenges', sa.JSON(), nullable=True))
    op.create_table(
        'cf_login_tokens',
        sa.Column('token_hash', sa.String(64), primary_key=True),
        sa.Column('email', sa.Text(), nullable=False),
        sa.Column('requested_by', sa.String(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=False), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=False), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_cf_login_tokens_email', 'cf_login_tokens', ['email'])


def downgrade() -> None:
    op.drop_index('idx_cf_login_tokens_email', table_name='cf_login_tokens')
    op.drop_table('cf_login_tokens')
    op.drop_column('cf_users', 'friend_challenges')
    op.drop_column('cf_users', 'email_verified_at')
