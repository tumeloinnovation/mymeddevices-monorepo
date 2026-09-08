import enum
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.catalog.models.category import Category
    from app.domains.catalog.models.product_variant import ProductVariant


class AttributeDataType(str, enum.Enum):
    STRING = "STRING"
    NUMBER = "NUMBER"
    BOOLEAN = "BOOLEAN"
    ENUM = "ENUM"
    MULTI_SELECT = "MULTI_SELECT"


class CategoryAttributeDefinition(Base, IDMixin, AuditMixin):
    """
    Platform-controlled attribute definition for medical device specifications.
    Enforces category-aware schemas for technical attributes and variant-defining dimensions.
    """

    __tablename__ = "category_attribute_definitions"
    __table_args__ = (
        UniqueConstraint("category_id", "code", name="uq_category_attribute_code"),
    )

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. 'folds', 'actuation', 'glove_size'
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Number of Folds", "Actuation Type"
    data_type: Mapped[AttributeDataType] = mapped_column(
        Enum(AttributeDataType), nullable=False, default=AttributeDataType.STRING
    )
    unit: Mapped[str | None] = mapped_column(String(30), nullable=True)  # 'kg', 'mm', 'V', 'Hz'
    is_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_variant_defining: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_filterable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_searchable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="attribute_definitions")
    allowed_values: Mapped[list["AttributeAllowedValue"]] = relationship(
        "AttributeAllowedValue", back_populates="attribute_definition", cascade="all, delete-orphan", lazy="selectin"
    )
    variant_values: Mapped[list["VariantAttributeValue"]] = relationship(
        "VariantAttributeValue", back_populates="attribute_definition", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<CategoryAttributeDefinition(id={self.id}, code='{self.code}', data_type={self.data_type})>"


class AttributeAllowedValue(Base, IDMixin):
    """
    Platform-approved allowed values for ENUM / MULTI_SELECT attributes.
    Prevents vendor value divergence.
    """

    __tablename__ = "attribute_allowed_values"
    __table_args__ = (
        UniqueConstraint("attribute_id", "value", name="uq_attribute_allowed_value"),
    )

    attribute_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("category_attribute_definitions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    display_label: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    attribute_definition: Mapped["CategoryAttributeDefinition"] = relationship(
        "CategoryAttributeDefinition", back_populates="allowed_values"
    )

    def __repr__(self) -> str:
        return f"<AttributeAllowedValue(id={self.id}, value='{self.value}')>"


class VariantAttributeValue(Base, IDMixin):
    """
    Relational assignment of a defined category attribute value to a specific ProductVariant.
    """

    __tablename__ = "variant_attribute_values"
    __table_args__ = (
        UniqueConstraint("product_variant_id", "attribute_id", name="uq_variant_attribute"),
    )

    product_variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attribute_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("category_attribute_definitions.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    value_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    value_number: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)
    value_boolean: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    allowed_value_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("attribute_allowed_values.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    product_variant: Mapped["ProductVariant"] = relationship("ProductVariant", back_populates="attribute_values")
    attribute_definition: Mapped["CategoryAttributeDefinition"] = relationship(
        "CategoryAttributeDefinition", back_populates="variant_values"
    )
    allowed_value: Mapped[Optional["AttributeAllowedValue"]] = relationship("AttributeAllowedValue", lazy="selectin")

    def __repr__(self) -> str:
        return f"<VariantAttributeValue(id={self.id}, variant_id={self.product_variant_id}, attribute_id={self.attribute_id})>"
