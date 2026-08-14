"""initial

Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2026-08-14 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('username', sa.String(length=150), nullable=False, unique=True),
        sa.Column('full_name', sa.String(length=250), nullable=True),
        sa.Column('email', sa.String(length=250), nullable=True, unique=True),
        sa.Column('hashed_password', sa.String(length=512), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_users_username', 'users', ['username'])

    op.create_table(
        'audits',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('audit_id', sa.String(length=128), nullable=False, unique=True),
        sa.Column('name', sa.String(length=250), nullable=True),
        sa.Column('date', sa.DateTime(), nullable=True),
        sa.Column('technician', sa.String(length=250), nullable=True),
        sa.Column('device', sa.String(length=250), nullable=True),
        sa.Column('audit_type', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('raw', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_audits_audit_id', 'audits', ['audit_id'])

    op.create_table(
        'tokens',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('service_name', sa.String(length=100), nullable=False),
        sa.Column('access_token', sa.Text(), nullable=False),
        sa.Column('refresh_token', sa.Text(), nullable=True),
        sa.Column('fetched_at', sa.Integer(), nullable=True),
    )
    op.create_index('ix_tokens_service_name', 'tokens', ['service_name'])

    op.create_table(
        'reports',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('audit_id', sa.String(length=128), nullable=False),
        sa.Column('path', sa.String(length=1024), nullable=False),
        sa.Column('generated_by', sa.String(length=150), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_reports_audit_id', 'reports', ['audit_id'])


def downgrade():
    op.drop_table('reports')
    op.drop_table('tokens')
    op.drop_table('audits')
    op.drop_table('users')
