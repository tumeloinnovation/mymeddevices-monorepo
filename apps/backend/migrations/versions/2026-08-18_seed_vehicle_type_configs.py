"""seed vehicle type configs

Revision ID: e5f6g7h8i9j0
Revises: d4e5f6g7h8i9
Create Date: 2026-08-18 17:04:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e5f6g7h8i9j0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6g7h8i9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Seed vehicle type configurations
    op.execute("""
        INSERT INTO vehicle_type_configs (id, vehicle_type, max_weight_kg, max_volume_m3, max_concurrent_deliveries, base_speed_kmh, traffic_factor, suitable_for_fridge, min_radius_km, max_radius_km, is_active)
        VALUES
            (gen_random_uuid(), 'motorcycle', 20.0, 0.05, 5, 35.0, 1.3, false, 0.0, 30.0, true),
            (gen_random_uuid(), 'bicycle', 15.0, 0.03, 3, 20.0, 1.1, false, 0.0, 15.0, true),
            (gen_random_uuid(), 'car', 100.0, 0.5, 3, 30.0, 1.5, true, 0.0, 50.0, true),
            (gen_random_uuid(), 'van', 500.0, 2.0, 2, 25.0, 1.6, true, 5.0, 100.0, true),
            (gen_random_uuid(), 'truck', 2000.0, 10.0, 1, 15.0, 1.8, true, 10.0, 200.0, true)
        ON CONFLICT (vehicle_type) DO NOTHING
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM vehicle_type_configs WHERE vehicle_type IN ('motorcycle', 'bicycle', 'car', 'van', 'truck')")
