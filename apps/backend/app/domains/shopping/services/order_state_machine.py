"""
Canonical order state machine with transition validation and automatic rollups.

This module provides centralized state management for Order, OrderItem, and SubOrder entities,
ensuring consistent status transitions across the entire system.
"""

from dataclasses import dataclass
from typing import Dict, List, Set, Optional

from app.domains.shopping.models.order import OrderStatus, OrderItemFulfillmentStatus
from app.domains.shopping.models.sub_order import SubOrderStatus


class InvalidStateTransitionError(ValueError):
    """Raised when an invalid state transition is attempted."""
    def __init__(self, from_state: str, to_state: str, entity_type: str):
        self.from_state = from_state
        self.to_state = to_state
        self.entity_type = entity_type
        super().__init__(
            f"Cannot transition {entity_type} from {from_state} to {to_state}"
        )


# Canonical transition matrices
# These define all valid state transitions for each entity type
ORDER_TRANSITIONS: Dict[OrderStatus, List[OrderStatus]] = {
    OrderStatus.PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
    OrderStatus.PAID: [OrderStatus.PROCESSING, OrderStatus.REFUNDED, OrderStatus.CANCELLED],
    OrderStatus.PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
    OrderStatus.SHIPPED: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
    OrderStatus.DELIVERED: [OrderStatus.REFUNDED],
    OrderStatus.CANCELLED: [],
    OrderStatus.REFUNDED: []
}

ORDER_ITEM_TRANSITIONS: Dict[OrderItemFulfillmentStatus, List[OrderItemFulfillmentStatus]] = {
    OrderItemFulfillmentStatus.PENDING: [
        OrderItemFulfillmentStatus.PROCESSING,
        OrderItemFulfillmentStatus.CANCELLED
    ],
    OrderItemFulfillmentStatus.PROCESSING: [
        OrderItemFulfillmentStatus.PACKED,
        OrderItemFulfillmentStatus.CANCELLED
    ],
    OrderItemFulfillmentStatus.PACKED: [
        OrderItemFulfillmentStatus.SHIPPED,
        OrderItemFulfillmentStatus.CANCELLED
    ],
    OrderItemFulfillmentStatus.SHIPPED: [
        OrderItemFulfillmentStatus.DELIVERED,
        OrderItemFulfillmentStatus.REFUNDED
    ],
    OrderItemFulfillmentStatus.DELIVERED: [
        OrderItemFulfillmentStatus.REFUNDED
    ],
    OrderItemFulfillmentStatus.CANCELLED: [],
    OrderItemFulfillmentStatus.REFUNDED: []
}

SUB_ORDER_TRANSITIONS: Dict[SubOrderStatus, List[SubOrderStatus]] = {
    SubOrderStatus.PENDING: [
        SubOrderStatus.PROCESSING,
        SubOrderStatus.CANCELLED
    ],
    SubOrderStatus.PROCESSING: [
        SubOrderStatus.SHIPPED,
        SubOrderStatus.CANCELLED
    ],
    SubOrderStatus.SHIPPED: [
        SubOrderStatus.DELIVERED,
        SubOrderStatus.REFUNDED
    ],
    SubOrderStatus.DELIVERED: [
        SubOrderStatus.REFUNDED
    ],
    SubOrderStatus.CANCELLED: [],
    SubOrderStatus.REFUNDED: []
}


# Rollup rules for automatic parent status updates
# These define how child statuses determine parent status
@dataclass
class RollupRule:
    """Defines how child statuses determine parent status."""
    parent_status: str
    required_child_statuses: Set[str]
    min_percentage: float = 1.0  # Percentage of items that must have the status


ORDER_ROLLUP_RULES: List[RollupRule] = [
    # Processing: at least 50% of items in processing
    RollupRule(
        parent_status=OrderStatus.PROCESSING.value,
        required_child_statuses={OrderItemFulfillmentStatus.PROCESSING.value},
        min_percentage=0.5
    ),
    # Shipped: at least 50% of items shipped
    RollupRule(
        parent_status=OrderStatus.SHIPPED.value,
        required_child_statuses={OrderItemFulfillmentStatus.SHIPPED.value},
        min_percentage=0.5
    ),
    # Delivered: 100% of items delivered
    RollupRule(
        parent_status=OrderStatus.DELIVERED.value,
        required_child_statuses={OrderItemFulfillmentStatus.DELIVERED.value},
        min_percentage=1.0
    ),
    # Cancelled: 100% of items cancelled
    RollupRule(
        parent_status=OrderStatus.CANCELLED.value,
        required_child_statuses={OrderItemFulfillmentStatus.CANCELLED.value},
        min_percentage=1.0
    ),
    # Refunded: 100% of items refunded
    RollupRule(
        parent_status=OrderStatus.REFUNDED.value,
        required_child_statuses={OrderItemFulfillmentStatus.REFUNDED.value},
        min_percentage=1.0
    ),
]

SUB_ORDER_ROLLUP_RULES: List[RollupRule] = [
    # Processing: at least 50% of items in processing
    RollupRule(
        parent_status=SubOrderStatus.PROCESSING.value,
        required_child_statuses={OrderItemFulfillmentStatus.PROCESSING.value},
        min_percentage=0.5
    ),
    # Shipped: at least 50% of items shipped
    RollupRule(
        parent_status=SubOrderStatus.SHIPPED.value,
        required_child_statuses={OrderItemFulfillmentStatus.SHIPPED.value},
        min_percentage=0.5
    ),
    # Delivered: 100% of items delivered
    RollupRule(
        parent_status=SubOrderStatus.DELIVERED.value,
        required_child_statuses={OrderItemFulfillmentStatus.DELIVERED.value},
        min_percentage=1.0
    ),
    # Cancelled: 100% of items cancelled
    RollupRule(
        parent_status=SubOrderStatus.CANCELLED.value,
        required_child_statuses={OrderItemFulfillmentStatus.CANCELLED.value},
        min_percentage=1.0
    ),
]


class OrderStateMachine:
    """Centralized state machine for order entities."""

    @staticmethod
    def validate_order_transition(from_status: str, to_status: str) -> bool:
        """
        Validate Order status transition.

        Args:
            from_status: Current order status
            to_status: Desired order status

        Returns:
            True if transition is valid, False otherwise
        """
        try:
            from_enum = OrderStatus(from_status)
            to_enum = OrderStatus(to_status)
        except ValueError:
            return False

        return to_enum in ORDER_TRANSITIONS.get(from_enum, [])

    @staticmethod
    def validate_order_item_transition(from_status: str, to_status: str) -> bool:
        """
        Validate OrderItem status transition.

        Args:
            from_status: Current order item status
            to_status: Desired order item status

        Returns:
            True if transition is valid, False otherwise
        """
        try:
            from_enum = OrderItemFulfillmentStatus(from_status)
            to_enum = OrderItemFulfillmentStatus(to_status)
        except ValueError:
            return False

        return to_enum in ORDER_ITEM_TRANSITIONS.get(from_enum, [])

    @staticmethod
    def validate_sub_order_transition(from_status: str, to_status: str) -> bool:
        """
        Validate SubOrder status transition.

        Args:
            from_status: Current sub-order status
            to_status: Desired sub-order status

        Returns:
            True if transition is valid, False otherwise
        """
        try:
            from_enum = SubOrderStatus(from_status)
            to_enum = SubOrderStatus(to_status)
        except ValueError:
            return False

        return to_enum in SUB_ORDER_TRANSITIONS.get(from_enum, [])

    @staticmethod
    def calculate_order_status(item_statuses: List[str]) -> Optional[str]:
        """
        Calculate Order status from OrderItem statuses.

        Applies rollup rules in priority order to determine the appropriate
        parent status based on child item statuses.

        Args:
            item_statuses: List of current order item statuses

        Returns:
            Calculated order status, or None if no rule matches
        """
        if not item_statuses:
            return None

        total_items = len(item_statuses)
        status_counts: Dict[str, int] = {}

        # Count occurrences of each status
        for status in item_statuses:
            status_counts[status] = status_counts.get(status, 0) + 1

        # Check rollup rules in priority order
        for rule in ORDER_ROLLUP_RULES:
            matching_count = sum(
                status_counts.get(s, 0)
                for s in rule.required_child_statuses
            )
            if matching_count / total_items >= rule.min_percentage:
                return rule.parent_status

        # Default: no change
        return None

    @staticmethod
    def calculate_sub_order_status(item_statuses: List[str]) -> Optional[str]:
        """
        Calculate SubOrder status from OrderItem statuses.

        Args:
            item_statuses: List of current order item statuses

        Returns:
            Calculated sub-order status, or None if no rule matches
        """
        if not item_statuses:
            return None

        total_items = len(item_statuses)
        status_counts: Dict[str, int] = {}

        # Count occurrences of each status
        for status in item_statuses:
            status_counts[status] = status_counts.get(status, 0) + 1

        # Check rollup rules in priority order
        for rule in SUB_ORDER_ROLLUP_RULES:
            matching_count = sum(
                status_counts.get(s, 0)
                for s in rule.required_child_statuses
            )
            if matching_count / total_items >= rule.min_percentage:
                return rule.parent_status

        # Default: no change
        return None

    @staticmethod
    def get_next_valid_statuses(entity_type: str, current_status: str) -> List[str]:
        """
        Get list of valid next statuses for a given current status.

        Useful for UI dropdowns to only show valid transitions.

        Args:
            entity_type: One of 'order', 'order_item', 'sub_order'
            current_status: Current status value

        Returns:
            List of valid next status values
        """
        if entity_type == "order":
            try:
                current_enum = OrderStatus(current_status)
                return [s.value for s in ORDER_TRANSITIONS.get(current_enum, [])]
            except ValueError:
                return []
        elif entity_type == "order_item":
            try:
                current_enum = OrderItemFulfillmentStatus(current_status)
                return [s.value for s in ORDER_ITEM_TRANSITIONS.get(current_enum, [])]
            except ValueError:
                return []
        elif entity_type == "sub_order":
            try:
                current_enum = SubOrderStatus(current_status)
                return [s.value for s in SUB_ORDER_TRANSITIONS.get(current_enum, [])]
            except ValueError:
                return []
        return []
