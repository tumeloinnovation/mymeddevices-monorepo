import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin


class CartMergeLog(Base, IDMixin, AuditMixin):
    """Log entry for guest cart to customer cart merges."""

    __tablename__ = "cart_merge_logs"

    # Source and target carts
    source_cart_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("carts.id", ondelete="SET NULL"), nullable=True
    )  # Guest cart being merged

    target_cart_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("carts.id", ondelete="SET NULL"), nullable=True
    )  # Customer cart receiving items

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Merge method
    merge_method: Mapped[str] = mapped_column(String(50), nullable=False)  # 'replace', 'merge', 'keep_both'

    # Statistics
    source_item_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # Number of items in source cart

    target_item_count_before: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Number of items in target before merge

    target_item_count_after: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Number of items in target after merge

    # Optional notes
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    def __repr__(self) -> str:
        return f"<CartMergeLog(id={self.id}, method={self.merge_method}, source={self.source_cart_id}, target={self.target_cart_id})>"
