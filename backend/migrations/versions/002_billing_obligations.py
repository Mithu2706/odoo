"""Phase 2: Billing obligations ledger and assurance.

Revision ID: 002
Revises: 001
Create Date: 2026-10-31
"""

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "billing_obligations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("workspace_id", sa.String(length=36), nullable=False),
        sa.Column("subscription_id", sa.String(length=36), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("invoice_id", sa.String(length=36), nullable=True),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("last_error", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.id"],
        ),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["subscriptions.id"],
        ),
        sa.ForeignKeyConstraint(
            ["invoice_id"],
            ["invoices.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "subscription_id",
            "period_start",
            "period_end",
            name="uq_obligation_period",
        ),
    )
    op.create_index(
        op.f("ix_billing_obligations_workspace_id"),
        "billing_obligations",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_billing_obligations_subscription_id"),
        "billing_obligations",
        ["subscription_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_billing_obligations_due_date"),
        "billing_obligations",
        ["due_date"],
        unique=False,
    )
    op.create_index(
        op.f("ix_billing_obligations_status"),
        "billing_obligations",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_billing_obligations_invoice_id"),
        "billing_obligations",
        ["invoice_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        op.f("ix_billing_obligations_invoice_id"), table_name="billing_obligations"
    )
    op.drop_index(
        op.f("ix_billing_obligations_status"), table_name="billing_obligations"
    )
    op.drop_index(
        op.f("ix_billing_obligations_due_date"), table_name="billing_obligations"
    )
    op.drop_index(
        op.f("ix_billing_obligations_subscription_id"), table_name="billing_obligations"
    )
    op.drop_index(
        op.f("ix_billing_obligations_workspace_id"), table_name="billing_obligations"
    )
    op.drop_table("billing_obligations")
