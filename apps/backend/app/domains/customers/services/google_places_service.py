import httpx
from typing import Tuple, Optional, Any, Dict
from app.core.config import settings
from app.core.logging import logger

class GooglePlacesService:
    """Service for interacting with Google Places API to validate addresses."""

    def __init__(self):
        self.api_key = settings.GOOGLE_MAPS_API_KEY
        self.base_url = "https://maps.googleapis.com/maps/api/place/details/json"

    async def validate_place(
        self, place_id: str, latitude: float, longitude: float
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Validate that a place_id exists and corresponds roughly to the provided coordinates.
        Returns (is_valid, place_details).
        """
        if not self.api_key:
            logger.warning("Google Maps API key not configured, skipping validation.")
            # Return dummy success in dev if key is missing
            return True, {"country": "Kenya", "formatted_address": "Mock Kenya Address"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "place_id": place_id,
                        "fields": "geometry,address_components,formatted_address",
                        "key": self.api_key
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Google Places API error: {response.status_code} - {response.text}")
                    return False, None
                
                data = response.json()
                if data.get("status") != "OK":
                    logger.error(f"Google Places API returned status: {data.get('status')}")
                    return False, None
                
                result = data.get("result", {})
                location = result.get("geometry", {}).get("location", {})
                
                # Simple distance check (within ~500m)
                # This is a very rough approximation
                lat_diff = abs(location.get("lat", 0) - latitude)
                lng_diff = abs(location.get("lng", 0) - longitude)
                
                # 0.005 degrees is roughly 500m
                if lat_diff > 0.005 or lng_diff > 0.005:
                    logger.warning(f"Coordinate mismatch for place_id {place_id}")
                    return False, result
                
                return True, result

        except Exception as e:
            logger.error(f"Error validating Google Place: {e}")
            return False, None

    def is_kenya_address(self, place_details: Dict[str, Any]) -> bool:
        """Check if the place is located in Kenya."""
        if not place_details:
            return False
            
        address_components = place_details.get("address_components", [])
        for component in address_components:
            if "country" in component.get("types", []):
                return component.get("short_name") == "KE" or component.get("long_name") == "Kenya"
                
        # Fallback to formatted address check
        formatted_address = place_details.get("formatted_address", "")
        return "Kenya" in formatted_address
