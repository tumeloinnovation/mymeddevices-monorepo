import uuid
from typing import List, Optional
from pydantic import BaseModel, Field


class WishlistToCartRequest(BaseModel):
    """Request to move/copy wishlist items to cart."""
    wishlist_item_ids: List[uuid.UUID] = Field(
        ...,
        description="List of wishlist item IDs to move to cart"
    )
    action: str = Field(
        default="move",
        description="Action: 'move' (remove from wishlist) or 'copy' (keep in wishlist)"
    )


class CartToWishlistRequest(BaseModel):
    """Request to move cart item to wishlist."""
    cart_item_id: uuid.UUID = Field(..., description="Cart item ID to move to wishlist")
    remove_from_cart: bool = Field(
        default=True,
        description="Whether to remove item from cart after adding to wishlist"
    )


class ComparisonToCartRequest(BaseModel):
    """Request to add comparison items to cart."""
    comparison_item_ids: List[uuid.UUID] = Field(
        ...,
        description="List of comparison item IDs to add to cart"
    )
    quantities: Optional[dict] = Field(
        default=None,
        description="Optional mapping of comparison_item_id to quantity"
    )


class WishlistCartResponse(BaseModel):
    """Response for wishlist to cart operations."""
    success: bool
    message: str
    added_count: int
    skipped_count: int = 0
    errors: List[dict] = []
    cart_id: uuid.UUID


class ComparisonCartResponse(BaseModel):
    """Response for comparison to cart operations."""
    success: bool
    message: str
    added_count: int
    errors: List[dict] = []
    cart_id: uuid.UUID
