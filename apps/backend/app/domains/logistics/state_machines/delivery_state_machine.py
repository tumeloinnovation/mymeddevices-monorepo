"""Delivery status state machine with transition validation.

Following the pattern from OrderStateMachine in shopping domain.
"""

from app.domains.logistics.models.delivery import DeliveryStatus


class InvalidDeliveryTransitionError(ValueError):
    """Raised when an invalid delivery status transition is attempted."""

    def __init__(self, from_status: str, to_status: str):
        self.from_status = from_status
        self.to_status = to_status
        super().__init__(f"Cannot transition delivery from {from_status} to {to_status}")


# Canonical transition matrix for delivery statuses
DELIVERY_TRANSITIONS: dict[DeliveryStatus, list[DeliveryStatus]] = {
    # Pre-delivery states
    DeliveryStatus.CREATED: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED],
    DeliveryStatus.ASSIGNED: [DeliveryStatus.ROUTED, DeliveryStatus.CANCELLED],
    DeliveryStatus.ROUTED: [
        DeliveryStatus.AT_VENDOR,
        DeliveryStatus.IN_TRANSIT,
        DeliveryStatus.CANCELLED,
    ],
    # In-progress states
    DeliveryStatus.AT_VENDOR: [
        DeliveryStatus.IN_TRANSIT,
        DeliveryStatus.EXCEPTION,
    ],
    DeliveryStatus.IN_TRANSIT: [
        DeliveryStatus.NEARBY,
        DeliveryStatus.DELIVERED,
        DeliveryStatus.FAILED_ATTEMPT,
        DeliveryStatus.EXCEPTION,
    ],
    DeliveryStatus.NEARBY: [
        DeliveryStatus.DELIVERED,
        DeliveryStatus.FAILED_ATTEMPT,
    ],
    # Completion states
    DeliveryStatus.FAILED_ATTEMPT: [
        DeliveryStatus.IN_TRANSIT,
        DeliveryStatus.EXCEPTION,
    ],
    DeliveryStatus.DELIVERED: [],  # Terminal state
    DeliveryStatus.CANCELLED: [],  # Terminal state
    DeliveryStatus.EXCEPTION: [
        DeliveryStatus.IN_TRANSIT,
        DeliveryStatus.CANCELLED,
    ],
}


class DeliveryStateMachine:
    """Delivery status state machine with transition validation."""

    @staticmethod
    def validate_transition(from_status: str, to_status: str) -> bool:
        """
        Validate delivery status transition.

        Args:
            from_status: Current delivery status
            to_status: Desired delivery status

        Returns:
            True if transition is valid, False otherwise

        Raises:
            InvalidDeliveryTransitionError: If transition is invalid
        """
        try:
            from_enum = DeliveryStatus(from_status)
            to_enum = DeliveryStatus(to_status)
        except ValueError as e:
            raise InvalidDeliveryTransitionError(from_status, to_status) from e

        if to_enum not in DELIVERY_TRANSITIONS.get(from_enum, []):
            raise InvalidDeliveryTransitionError(from_status, to_status)

        return True

    @staticmethod
    def get_next_valid_statuses(current_status: str) -> list[str]:
        """
        Get list of valid next statuses for a given current status.

        Useful for UI dropdowns to only show valid transitions.

        Args:
            current_status: Current status value

        Returns:
            List of valid next status values
        """
        try:
            current_enum = DeliveryStatus(current_status)
            return [s.value for s in DELIVERY_TRANSITIONS.get(current_enum, [])]
        except ValueError:
            return []
