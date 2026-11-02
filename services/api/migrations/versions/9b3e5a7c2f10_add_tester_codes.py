"""add cf_tester_codes

Revision ID: 9b3e5a7c2f10
Revises: 4d2f18e9c111
Create Date: 2026-11-02
"""
from alembic import op
import sqlalchemy as sa

revision = '9b3e5a7c2f10'
down_revision = '4d2f18e9c111'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'cf_tester_codes',
        sa.Column('code', sa.String(), primary_key=True),
        sa.Column('note', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=True),
        sa.Column('redeemed_by', sa.String(), sa.ForeignKey('cf_users.user_id'), nullable=True),
        sa.Column('redeemed_at', sa.DateTime(timezone=False), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('cf_tester_codes')
