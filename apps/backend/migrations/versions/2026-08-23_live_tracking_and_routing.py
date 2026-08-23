"""live tracking and routing

Revision ID: c9d0e1f2a3b4
Revises: a7b8c9d0e1f2
Create Date: 2026-08-23 00:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c9d0e1f2a3b4"
down_revision: Union[str, Sequence[str], None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("deliveries", sa.Column("route_geometry", postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column("deliveries", sa.Column("remaining_distance_km", sa.Float(), nullable=True))
    op.add_column("deliveries", sa.Column("traveled_distance_km", sa.Float(), nullable=False, server_default="0"))
    op.add_column("deliveries", sa.Column("route_provider", sa.String(length=50), nullable=True))
    op.add_column("deliveries", sa.Column("assignment_status", sa.String(length=30), nullable=False, server_default="pending"))
    op.add_column("deliveries", sa.Column("assignment_responded_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("deliveries", sa.Column("failure_reason", sa.Text(), nullable=True))
    op.create_index("ix_deliveries_assignment_status", "deliveries", ["assignment_status"])

    op.create_table(
        "driver_location_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("driver_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("delivery_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("accuracy_m", sa.Float(), nullable=True),
        sa.Column("speed_kmh", sa.Float(), nullable=True),
        sa.Column("heading_degrees", sa.Float(), nullable=True),
        sa.Column("source", sa.String(length=20), nullable=False, server_default="gps"),
        sa.Column("client_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("point_index", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["driver_id"], ["users.id"], name=op.f("fk_driver_location_history_driver_id"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["delivery_id"], ["deliveries.id"], name=op.f("fk_driver_location_history_delivery_id"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_driver_location_history")),
    )
    op.create_index("ix_driver_location_history_driver_id", "driver_location_history", ["driver_id"])
    op.create_index("ix_driver_location_history_delivery_id", "driver_location_history", ["delivery_id"])
    op.create_index("ix_driver_location_history_recorded_at", "driver_location_history", ["recorded_at"])
    op.create_index("ix_driver_location_history_batch_id", "driver_location_history", ["batch_id"])

    op.create_table(
        "delivery_tracking_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("delivery_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("use_count", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["delivery_id"], ["deliveries.id"], name=op.f("fk_delivery_tracking_tokens_delivery_id"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], name=op.f("fk_delivery_tracking_tokens_created_by_user_id"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_delivery_tracking_tokens")),
        sa.UniqueConstraint("token_hash", name="uq_delivery_tracking_tokens_hash"),
    )
    op.create_index(
        "ix_delivery_tracking_tokens_delivery_active",
        "delivery_tracking_tokens",
        ["delivery_id", "revoked_at"],
    )


def downgrade() -> None:
    op.drop_table("delivery_tracking_tokens")
    op.drop_table("driver_location_history")
    op.drop_index("ix_deliveries_assignment_status", table_name="deliveries")
    op.drop_column("deliveries", "failure_reason")
    op.drop_column("deliveries", "assignment_responded_at")
    op.drop_column("deliveries", "assignment_status")
    op.drop_column("deliveries", "route_provider")
    op.drop_column("deliveries", "traveled_distance_km")
    op.drop_column("deliveries", "remaining_distance_km")
    op.drop_column("deliveries", "route_geometry")
