"""seed zone configs

Revision ID: f6g7h8i9j0k1
Revises: e5f6g7h8i9j0
Create Date: 2026-08-18 17:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f6g7h8i9j0k1'
down_revision: Union[str, Sequence[str], None] = 'e5f6g7h8i9j0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Seed Nairobi zone configurations
    op.execute("""
        INSERT INTO zone_configs (id, zone_code, zone_name, center_latitude, center_longitude, radius_km, traffic_coefficient, is_active)
        VALUES
            (gen_random_uuid(), 'nbi-cbd', 'Nairobi CBD', -1.286389, 36.817223, 3.0, 1.8, true),
            (gen_random_uuid(), 'nbi-west', 'Nairobi West', -1.301176, 36.800691, 15.0, 1.4, true),
            (gen_random_uuid(), 'nbi-east', 'Nairobi East', -1.286389, 36.937223, 15.0, 1.5, true),
            (gen_random_uuid(), 'nbi-north', 'Nairobi North', -1.220000, 36.850000, 20.0, 1.3, true)
        ON CONFLICT (zone_code) DO NOTHING
    """)

    # Update driver profiles with default max_concurrent_deliveries from vehicle type config
    op.execute("""
        UPDATE driver_profiles dp
        SET max_concurrent_deliveries = (
            SELECT max_concurrent_deliveries
            FROM vehicle_type_configs vtc
            WHERE vtc.vehicle_type = dp.vehicle_type
            AND vtc.is_active = true
            LIMIT 1
        )
        WHERE dp.vehicle_type IS NOT NULL
        AND dp.max_concurrent_deliveries = 3
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM zone_configs WHERE zone_code IN ('nbi-cbd', 'nbi-west', 'nbi-east', 'nbi-north')")
