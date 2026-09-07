"""Tests for driver matching service."""

from datetime import UTC, datetime

import pytest

from app.domains.logistics.utils.matching import (
    VEHICLE_TYPE_CONFIGS,
    DeliveryRequirements,
    EligibleDriver,
    get_compatible_vehicle_types,
    get_traffic_coefficient_for_time,
    get_vehicle_config,
    get_zone_center,
    is_vehicle_compatible,
)


class TestVehicleTypeConfig:
    """Tests for vehicle type configuration."""

    def test_all_vehicle_types_have_required_fields(self):
        """Verify all vehicle types have required configuration fields."""
        for vehicle_type, config in VEHICLE_TYPE_CONFIGS.items():
            assert config.vehicle_type == vehicle_type
            assert config.display_name
            assert config.max_weight_kg >= 0
            assert config.max_volume_m3 >= 0
            assert config.base_speed_kmh > 0
            assert config.max_concurrent_deliveries >= 1

    def test_bicycle_config(self):
        """Bicycle should have small capacity but high delivery count."""
        config = get_vehicle_config("bicycle")
        assert config is not None
        assert config.max_weight_kg == 3.0
        assert config.max_volume_m3 == 0.05
        assert config.max_distance_km == 5.0
        assert config.max_concurrent_deliveries == 5
        assert config.suitable_for_urgent is True

    def test_motorcycle_config(self):
        """Motorcycle should have medium capacity and be suitable for urgent."""
        config = get_vehicle_config("motorcycle")
        assert config is not None
        assert config.max_weight_kg == 5.0
        assert config.max_volume_m3 == 0.1
        assert config.max_distance_km == 15.0
        assert config.suitable_for_urgent is True

    def test_truck_config(self):
        """Truck should have large capacity but not suitable for pharma/fragile."""
        config = get_vehicle_config("truck")
        assert config is not None
        assert config.max_weight_kg == 1000.0
        assert config.max_volume_m3 == 15.0
        assert config.max_distance_km is None  # Unlimited
        assert config.supports_fragile is False
        assert config.supports_pharma is False
        assert config.suitable_for_urgent is False


class TestDeliveryRequirements:
    """Tests for delivery requirements and compatibility."""

    def test_small_parcel_compatible_with_multiple_vehicles(self):
        """Small parcel should be compatible with bicycle, motorcycle, car."""
        requirements = DeliveryRequirements(
            weight_kg=2.0,
            volume_m3=0.03,
        )

        compatible = get_compatible_vehicle_types(requirements)
        vehicle_types = [v.vehicle_type for v in compatible]

        assert "bicycle" in vehicle_types
        assert "motorcycle" in vehicle_types
        assert "car" in vehicle_types

    def test_large_parcel_only_larger_vehicles(self):
        """Large parcel should only be compatible with larger vehicles."""
        requirements = DeliveryRequirements(
            weight_kg=100.0,
            volume_m3=1.0,
        )

        compatible = get_compatible_vehicle_types(requirements)
        vehicle_types = [v.vehicle_type for v in compatible]

        assert "bicycle" not in vehicle_types
        assert "motorcycle" not in vehicle_types
        assert "van" in vehicle_types
        assert "truck" in vehicle_types

    def test_fragile_items_excludes_truck(self):
        """Fragile items should not be compatible with truck."""
        requirements = DeliveryRequirements(
            weight_kg=50.0,
            volume_m3=0.5,
            is_fragile=True,
        )

        compatible = get_compatible_vehicle_types(requirements)
        vehicle_types = [v.vehicle_type for v in compatible]

        assert "truck" not in vehicle_types

    def test_pharma_delivery_excludes_truck(self):
        """Pharma delivery should not be compatible with truck."""
        requirements = DeliveryRequirements(
            weight_kg=50.0,
            volume_m3=0.5,
            is_pharma=True,
        )

        compatible = get_compatible_vehicle_types(requirements)
        vehicle_types = [v.vehicle_type for v in compatible]

        assert "truck" not in vehicle_types

    def test_urgent_delivery_prioritizes_faster_vehicles(self):
        """Urgent delivery should prioritize faster vehicles."""
        requirements = DeliveryRequirements(
            weight_kg=2.0,
            volume_m3=0.03,
            is_urgent=True,
        )

        compatible = get_compatible_vehicle_types(requirements)

        # Should be sorted by speed (fastest first)
        if len(compatible) >= 2:
            assert compatible[0].base_speed_kmh >= compatible[1].base_speed_kmh

    def test_distance_filter(self):
        """Long distance should exclude vehicles with distance limits."""
        requirements = DeliveryRequirements(
            weight_kg=2.0,
            volume_m3=0.03,
            max_distance_km=50.0,
        )

        compatible = get_compatible_vehicle_types(requirements)
        vehicle_types = [v.vehicle_type for v in compatible]

        # Bicycle (5km) should be excluded
        assert "bicycle" not in vehicle_types
        # Motorcycle (15km) should be excluded
        assert "motorcycle" not in vehicle_types
        # Car (50km) should be included
        assert "car" in vehicle_types

    def test_is_vehicle_compatible(self):
        """Test individual vehicle compatibility check."""
        requirements = DeliveryRequirements(
            weight_kg=4.0,
            volume_m3=0.08,
        )

        assert is_vehicle_compatible("motorcycle", requirements) is True
        assert is_vehicle_compatible("bicycle", requirements) is False

    def test_multi_drop_requires_support(self):
        """Multi-drop should require vehicles with support."""
        requirements = DeliveryRequirements(
            weight_kg=2.0,
            volume_m3=0.03,
            requires_multi_drop=True,
        )

        compatible = get_compatible_vehicle_types(requirements)

        # All our vehicles support multi-drop, so this is more of a
        # documentation test. If we add a vehicle without support,
        # this test would catch it.
        assert all(v.supports_multi_drop for v in compatible)


class TestTrafficCoefficients:
    """Tests for traffic coefficient calculation."""

    def test_night_traffic(self):
        """Night hours should have low traffic coefficient."""
        night_time = datetime(2024, 1, 1, 3, 0, 0, tzinfo=UTC)
        coeff = get_traffic_coefficient_for_time(night_time)
        assert coeff == 1.0

    def test_morning_rush_hour(self):
        """Morning rush hour should have high traffic coefficient."""
        morning_rush = datetime(2024, 1, 1, 8, 0, 0, tzinfo=UTC)
        coeff = get_traffic_coefficient_for_time(morning_rush)
        assert coeff == 1.8

    def test_evening_rush_hour(self):
        """Evening rush hour should have high traffic coefficient."""
        evening_rush = datetime(2024, 1, 1, 18, 0, 0, tzinfo=UTC)
        coeff = get_traffic_coefficient_for_time(evening_rush)
        assert coeff == 1.8

    def test_daytime_traffic(self):
        """Daytime should have moderate traffic coefficient."""
        daytime = datetime(2024, 1, 1, 14, 0, 0, tzinfo=UTC)
        coeff = get_traffic_coefficient_for_time(daytime)
        assert coeff == 1.3

    def test_weekend_traffic(self):
        """Weekend traffic should be lighter."""
        weekend = datetime(2024, 1, 6, 14, 0, 0, tzinfo=UTC)  # Saturday
        coeff = get_traffic_coefficient_for_time(weekend)
        assert coeff == 1.1  # Weekend base is lighter

    def test_zone_modifier(self):
        """Zone modifier should be applied."""
        morning_rush = datetime(2024, 1, 1, 8, 0, 0, tzinfo=UTC)
        # CBD has 1.3 modifier
        coeff = get_traffic_coefficient_for_time(morning_rush, zone_traffic_coefficient=1.3)
        assert coeff > 1.8  # Should be higher due to zone modifier


class TestZoneCenters:
    """Tests for zone center lookup."""

    def test_cbd_zone_center(self):
        """CBD zone should have defined coordinates."""
        center = get_zone_center("CBD")
        assert center is not None
        assert len(center) == 2
        assert -90 <= center[0] <= 90  # Valid latitude
        assert -180 <= center[1] <= 180  # Valid longitude

    def test_unknown_zone_center(self):
        """Unknown zone should return None."""
        center = get_zone_center("UNKNOWN_ZONE")
        assert center is None

    def test_zone_center_case_insensitive(self):
        """Zone lookup should be case insensitive."""
        center_lower = get_zone_center("cbd")
        center_upper = get_zone_center("CBD")
        assert center_lower == center_upper


class TestEligibleDriver:
    """Tests for EligibleDriver dataclass."""

    def test_eligible_driver_creation(self):
        """EligibleDriver should be creatable with all fields."""
        import uuid

        driver = EligibleDriver(
            driver_id=uuid.uuid4(),
            driver_profile_id=uuid.uuid4(),
            vehicle_type="motorcycle",
            status="available",
            match_score=85.5,
            distance_km=2.5,
            capacity_utilization=0.33,
            estimated_pickup_minutes=8,
        )

        assert driver.driver_id
        assert driver.vehicle_type == "motorcycle"
        assert driver.match_score == 85.5
        assert driver.distance_km == 2.5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
