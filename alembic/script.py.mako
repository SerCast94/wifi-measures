"""
Macro template used to render a new migration script.
"""
from alembic import op
import sqlalchemy as sa

revision = '<% if autogenerate %>%(up_revision)s<% else %>%(rev)s<% endif %>'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    pass


def downgrade():
    pass
