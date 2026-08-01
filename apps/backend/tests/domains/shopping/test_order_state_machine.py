"""
Unit tests for the order state machine.

Tests transition validation and rollup calculations for Order,
OrderItem, and SubOrder entities.
"""

import pytest
from app.domains.shopping.services.order_state_machine import (
    OrderStateMachine,
    InvalidStateTransitionError,
    ORDER_TRANSITIONS,
    ORDER_ITEM_TRANSITIONS,
    SUB_ORDER_TRANSITIONS,
    ORDER_ROLLUP_RULES,
    SUB_ORDER_ROLLUP_RULES
)
from app.domains.shopping.models.order import OrderStatus, OrderItemFulfillmentStatus
from app.domains.shopping.models.sub_order import SubOrderStatus


class TestOrderStateMachine:
    """Test order state machine transitions and calculations."""

    # ==================== Order Transition Tests ====================

    def test_valid_order_transitions(self):
        """Test valid order status transitions."""
        # Normal flow
        assert OrderStateMachine.validate_order_transition('pending', 'paid')
        assert OrderStateMachine.validate_order_transition('paid', 'processing')
        assert OrderStateMachine.validate_order_transition('processing', 'shipped')
        assert OrderStateMachine.validate_order_transition('shipped', 'delivered')

        # Cancellation from various states
        assert OrderStateMachine.validate_order_transition('pending', 'cancelled')
        assert OrderStateMachine.validate_order_transition('paid', 'cancelled')
        assert OrderStateMachine.validate_order_transition('processing', 'cancelled')

        # Refund from various states
        assert OrderStateMachine.validate_order_transition('paid', 'refunded')
        assert OrderStateMachine.validate_order_transition('processing', 'refunded')
        assert OrderStateMachine.validate_order_transition('shipped', 'refunded')
        assert OrderStateMachine.validate_order_transition('delivered', 'refunded')

    def test_invalid_order_transitions(self):
        """Test invalid order status transitions."""
        # Cannot skip steps
        assert not OrderStateMachine.validate_order_transition('pending', 'processing')
        assert not OrderStateMachine.validate_order_transition('pending', 'shipped')
        assert not OrderStateMachine.validate_order_transition('paid', 'delivered')

        # Cannot go backwards
        assert not OrderStateMachine.validate_order_transition('processing', 'paid')
        assert not OrderStateMachine.validate_order_transition('delivered', 'shipped')
        assert not OrderStateMachine.validate_order_transition('shipped', 'processing')

        # Cannot transition from terminal states
        assert not OrderStateMachine.validate_order_transition('cancelled', 'paid')
        assert not OrderStateMachine.validate_order_transition('refunded', 'processing')
        assert not OrderStateMachine.validate_order_transition('cancelled', 'processing')

    def test_order_transition_with_invalid_status(self):
        """Test transition with invalid status values."""
        assert not OrderStateMachine.validate_order_transition('invalid_status', 'paid')
        assert not OrderStateMachine.validate_order_transition('pending', 'invalid_status')
        assert not OrderStateMachine.validate_order_transition('refund_requested', 'refunded')

    # ==================== OrderItem Transition Tests ====================

    def test_valid_order_item_transitions(self):
        """Test valid order item status transitions."""
        # Normal flow
        assert OrderStateMachine.validate_order_item_transition('pending', 'processing')
        assert OrderStateMachine.validate_order_item_transition('processing', 'packed')
        assert OrderStateMachine.validate_order_item_transition('packed', 'shipped')
        assert OrderStateMachine.validate_order_item_transition('shipped', 'delivered')

        # Cancellation
        assert OrderStateMachine.validate_order_item_transition('pending', 'cancelled')
        assert OrderStateMachine.validate_order_item_transition('processing', 'cancelled')
        assert OrderStateMachine.validate_order_item_transition('packed', 'cancelled')

        # Refund
        assert OrderStateMachine.validate_order_item_transition('shipped', 'refunded')
        assert OrderStateMachine.validate_order_item_transition('delivered', 'refunded')

    def test_invalid_order_item_transitions(self):
        """Test invalid order item status transitions."""
        # Cannot skip steps
        assert not OrderStateMachine.validate_order_item_transition('pending', 'packed')
        assert not OrderStateMachine.validate_order_item_transition('pending', 'shipped')
        assert not OrderStateMachine.validate_order_item_transition('processing', 'shipped')

        # Cannot go backwards
        assert not OrderStateMachine.validate_order_item_transition('processing', 'pending')
        assert not OrderStateMachine.validate_order_item_transition('shipped', 'processing')
        assert not OrderStateMachine.validate_order_item_transition('packed', 'processing')

    # ==================== SubOrder Transition Tests ====================

    def test_valid_sub_order_transitions(self):
        """Test valid sub-order status transitions."""
        # Normal flow
        assert OrderStateMachine.validate_sub_order_transition('pending', 'processing')
        assert OrderStateMachine.validate_sub_order_transition('processing', 'shipped')
        assert OrderStateMachine.validate_sub_order_transition('shipped', 'delivered')

        # Cancellation
        assert OrderStateMachine.validate_sub_order_transition('pending', 'cancelled')
        assert OrderStateMachine.validate_sub_order_transition('processing', 'cancelled')

        # Refund
        assert OrderStateMachine.validate_sub_order_transition('shipped', 'refunded')
        assert OrderStateMachine.validate_sub_order_transition('delivered', 'refunded')

    def test_invalid_sub_order_transitions(self):
        """Test invalid sub-order status transitions."""
        # Cannot skip steps
        assert not OrderStateMachine.validate_sub_order_transition('pending', 'shipped')
        assert not OrderStateMachine.validate_sub_order_transition('pending', 'delivered')

        # Cannot go backwards
        assert not OrderStateMachine.validate_sub_order_transition('processing', 'pending')
        assert not OrderStateMachine.validate_sub_order_transition('delivered', 'shipped')

    # ==================== Order Rollup Tests ====================

    def test_order_rollup_all_delivered(self):
        """Test order status when all items are delivered."""
        statuses = ['delivered', 'delivered', 'delivered']
        result = OrderStateMachine.calculate_order_status(statuses)
        assert result == 'delivered'

    def test_order_rollup_50_percent_shipped(self):
        """Test order status when 50% of items are shipped."""
        statuses = ['shipped', 'shipped', 'pending', 'pending']
        assert OrderStateMachine.calculate_order_status(statuses, strict_lifecycle=False) == 'shipped'
        assert OrderStateMachine.calculate_order_status(statuses, strict_lifecycle=True) == 'processing'

    def test_order_rollup_50_percent_processing(self):
        """Test order status when 50% of items are processing."""
        statuses = ['processing', 'processing', 'pending', 'pending']
        assert OrderStateMachine.calculate_order_status(statuses, strict_lifecycle=False) == 'processing'
        assert OrderStateMachine.calculate_order_status(statuses, strict_lifecycle=True) == 'processing'

    def test_order_rollup_all_cancelled(self):
        """Test order status when all items are cancelled."""
        statuses = ['cancelled', 'cancelled', 'cancelled']
        result = OrderStateMachine.calculate_order_status(statuses)
        assert result == 'cancelled'

    def test_order_rollup_all_refunded(self):
        """Test order status when all items are refunded."""
        statuses = ['refunded', 'refunded']
        result = OrderStateMachine.calculate_order_status(statuses)
        assert result == 'refunded'

    def test_order_rollup_no_rule_match(self):
        """Test order status when no rule matches."""
        statuses = ['pending', 'pending', 'pending']
        result = OrderStateMachine.calculate_order_status(statuses)
        assert result is None  # No rule matches, should return None

    def test_order_rollup_empty_list(self):
        """Test order status with empty item list."""
        result = OrderStateMachine.calculate_order_status([])
        assert result is None

    def test_order_rollup_mixed_statuses(self):
        """Test order status with mixed statuses."""
        statuses = ['delivered', 'shipped', 'pending']
        assert OrderStateMachine.calculate_order_status(statuses, strict_lifecycle=False) is None
        assert OrderStateMachine.calculate_order_status(statuses, strict_lifecycle=True) == 'processing'

    # ==================== SubOrder Rollup Tests ====================

    def test_sub_order_rollup_all_delivered(self):
        """Test sub-order status when all items are delivered."""
        statuses = ['delivered', 'delivered', 'delivered']
        result = OrderStateMachine.calculate_sub_order_status(statuses)
        assert result == 'delivered'

    def test_sub_order_rollup_50_percent_shipped(self):
        """Test sub-order status when 50% of items are shipped (no processing)."""
        statuses = ['shipped', 'shipped', 'pending', 'pending']
        assert OrderStateMachine.calculate_sub_order_status(statuses, strict_lifecycle=False) == 'shipped'
        assert OrderStateMachine.calculate_sub_order_status(statuses, strict_lifecycle=True) == 'processing'

    def test_sub_order_rollup_50_percent_processing(self):
        """Test sub-order status when 50% of items are processing."""
        statuses = ['processing', 'processing', 'pending', 'pending']
        assert OrderStateMachine.calculate_sub_order_status(statuses, strict_lifecycle=False) == 'processing'
        assert OrderStateMachine.calculate_sub_order_status(statuses, strict_lifecycle=True) == 'processing'

    def test_sub_order_rollup_all_cancelled(self):
        """Test sub-order status when all items are cancelled."""
        statuses = ['cancelled', 'cancelled']
        result = OrderStateMachine.calculate_sub_order_status(statuses)
        assert result == 'cancelled'

    def test_sub_order_rollup_empty_list(self):
        """Test sub-order status with empty item list."""
        result = OrderStateMachine.calculate_sub_order_status([])
        assert result is None

    # ==================== Get Next Valid Statuses Tests ====================

    def test_get_next_valid_order_statuses(self):
        """Test getting next valid statuses for order."""
        # From pending
        next_statuses = OrderStateMachine.get_next_valid_statuses('order', 'pending')
        assert set(next_statuses) == {'paid', 'cancelled'}

        # From paid
        next_statuses = OrderStateMachine.get_next_valid_statuses('order', 'paid')
        assert set(next_statuses) == {'processing', 'refunded', 'cancelled'}

        # From delivered (terminal)
        next_statuses = OrderStateMachine.get_next_valid_statuses('order', 'delivered')
        assert set(next_statuses) == {'refunded'}

    def test_get_next_valid_order_item_statuses(self):
        """Test getting next valid statuses for order item."""
        # From pending
        next_statuses = OrderStateMachine.get_next_valid_statuses('order_item', 'pending')
        assert set(next_statuses) == {'processing', 'cancelled'}

        # From packed
        next_statuses = OrderStateMachine.get_next_valid_statuses('order_item', 'packed')
        assert set(next_statuses) == {'shipped', 'cancelled'}

        # From delivered (terminal)
        next_statuses = OrderStateMachine.get_next_valid_statuses('order_item', 'delivered')
        assert set(next_statuses) == {'refunded'}

    def test_get_next_valid_statuses_invalid_current(self):
        """Test getting next statuses with invalid current status."""
        next_statuses = OrderStateMachine.get_next_valid_statuses('order', 'invalid')
        assert next_statuses == []

    def test_get_next_valid_statuses_invalid_entity_type(self):
        """Test getting next statuses with invalid entity type."""
        next_statuses = OrderStateMachine.get_next_valid_statuses('invalid_entity', 'pending')
        assert next_statuses == []

    # ==================== InvalidStateTransitionError Tests ====================

    def test_invalid_state_transition_error(self):
        """Test InvalidStateTransitionError exception."""
        error = InvalidStateTransitionError('pending', 'delivered', 'Order')
        assert str(error) == "Cannot transition Order from pending to delivered"
        assert error.from_state == 'pending'
        assert error.to_state == 'delivered'
        assert error.entity_type == 'Order'

    # ==================== Transition Matrix Integrity Tests ====================

    def test_order_transition_matrix_completeness(self):
        """Test that all OrderStatus enum values have transitions defined."""
        for status in OrderStatus:
            assert status in ORDER_TRANSITIONS, f"No transitions defined for {status}"

    def test_order_item_transition_matrix_completeness(self):
        """Test that all OrderItemFulfillmentStatus enum values have transitions defined."""
        for status in OrderItemFulfillmentStatus:
            assert status in ORDER_ITEM_TRANSITIONS, f"No transitions defined for {status}"

    def test_sub_order_transition_matrix_completeness(self):
        """Test that all SubOrderStatus enum values have transitions defined."""
        for status in SubOrderStatus:
            assert status in SUB_ORDER_TRANSITIONS, f"No transitions defined for {status}"

    def test_rollup_rules_valid_statuses(self):
        """Test that rollup rules only reference valid statuses."""
        valid_order_statuses = {s.value for s in OrderStatus}
        valid_item_statuses = {s.value for s in OrderItemFulfillmentStatus}

        for rule in ORDER_ROLLUP_RULES:
            assert rule.parent_status in valid_order_statuses, \
                f"Invalid parent status in ORDER_ROLLUP_RULES: {rule.parent_status}"
            for status in rule.required_child_statuses:
                assert status in valid_item_statuses, \
                    f"Invalid child status in ORDER_ROLLUP_RULES: {status}"

        for rule in SUB_ORDER_ROLLUP_RULES:
            assert rule.parent_status in {s.value for s in SubOrderStatus}, \
                f"Invalid parent status in SUB_ORDER_ROLLUP_RULES: {rule.parent_status}"
            for status in rule.required_child_statuses:
                assert status in valid_item_statuses, \
                    f"Invalid child status in SUB_ORDER_ROLLUP_RULES: {status}"
