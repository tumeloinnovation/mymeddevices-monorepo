"""
Admin API for managing merchandising bundles.
Bundles are standalone products that group multiple items together with discounts.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.domains.auth.models.user import User
from app.domains.catalog.models.bundle import Bundle, BundleComponent
from app.domains.catalog.models.product import Product
from app.domains.catalog.schemas.bundle_schemas import (
    BundleComponentCreate,
    BundleComponentResponse,
    BundleCreate,
    BundleResponse,
    BundleUpdate,
)

router = APIRouter(prefix="/bundles", tags=["Admin Bundles"])


# ============================================================================
# Bundle CRUD
# ============================================================================


@router.post("/", response_model=BundleResponse, status_code=status.HTTP_201_CREATED)
async def create_bundle(
    data: BundleCreate,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new merchandising bundle with components."""
    # Verify bundle doesn't exist with same slug
    existing = await db.execute(
        select(Bundle).where(Bundle.slug == data.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bundle with slug '{data.slug}' already exists"
        )

    # Create bundle
    bundle = Bundle(
        name=data.name,
        slug=data.slug,
        description=data.description,
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        funding_source=data.funding_source,
        is_active=data.is_active,
    )

    # Add components
    for comp_data in data.components:
        # Verify product exists and is published
        product_result = await db.execute(
            select(Product).where(Product.id == comp_data.product_id)
        )
        product = product_result.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {comp_data.product_id} not found"
            )
        if product.status != "published":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' must be published to be included in a bundle"
            )

        component = BundleComponent(
            product_id=comp_data.product_id,
            quantity=comp_data.quantity,
            sort_order=comp_data.sort_order,
            allowed_vendor_ids=comp_data.allowed_vendor_ids,
        )
        bundle.components.append(component)

    db.add(bundle)
    await db.commit()
    await db.refresh(bundle)

    # Load with components for response
    result = await db.execute(
        select(Bundle)
        .options(selectinload(Bundle.components).selectinload(BundleComponent.product))
        .where(Bundle.id == bundle.id)
    )
    bundle = result.scalar_one()

    return _bundle_to_response(bundle)


@router.get("/", response_model=list[BundleResponse])
async def list_bundles(
    is_active: bool | None = Query(None, description="Filter by active status"),
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all bundles with optional filtering."""
    query = select(Bundle).options(selectinload(Bundle.components))

    if is_active is not None:
        query = query.where(Bundle.is_active == is_active)

    query = query.order_by(Bundle.created_at.desc())

    result = await db.execute(query)
    bundles = result.scalars().all()

    return [_bundle_to_response(b) for b in bundles]


@router.get("/{bundle_id}", response_model=BundleResponse)
async def get_bundle(
    bundle_id: uuid.UUID,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a bundle by ID."""
    result = await db.execute(
        select(Bundle)
        .options(selectinload(Bundle.components).selectinload(BundleComponent.product))
        .where(Bundle.id == bundle_id)
    )
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bundle with id {bundle_id} not found"
        )

    return _bundle_to_response(bundle)


@router.get("/slug/{slug}", response_model=BundleResponse)
async def get_bundle_by_slug(
    slug: str,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a bundle by slug."""
    result = await db.execute(
        select(Bundle)
        .options(selectinload(Bundle.components).selectinload(BundleComponent.product))
        .where(Bundle.slug == slug)
    )
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bundle with slug '{slug}' not found"
        )

    return _bundle_to_response(bundle)


@router.patch("/{bundle_id}", response_model=BundleResponse)
async def update_bundle(
    bundle_id: uuid.UUID,
    data: BundleUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update bundle details (not components)."""
    result = await db.execute(
        select(Bundle).where(Bundle.id == bundle_id)
    )
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bundle with id {bundle_id} not found"
        )

    # Update fields
    if data.name is not None:
        bundle.name = data.name
    if data.slug is not None:
        # Check slug uniqueness
        existing = await db.execute(
            select(Bundle).where(Bundle.slug == data.slug, Bundle.id != bundle_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bundle with slug '{data.slug}' already exists"
            )
        bundle.slug = data.slug
    if data.description is not None:
        bundle.description = data.description
    if data.discount_type is not None:
        bundle.discount_type = data.discount_type
    if data.discount_value is not None:
        bundle.discount_value = data.discount_value
    if data.funding_source is not None:
        bundle.funding_source = data.funding_source
    if data.is_active is not None:
        bundle.is_active = data.is_active

    await db.commit()
    await db.refresh(bundle)

    # Load with components for response
    result = await db.execute(
        select(Bundle)
        .options(selectinload(Bundle.components).selectinload(BundleComponent.product))
        .where(Bundle.id == bundle.id)
    )
    bundle = result.scalar_one()

    return _bundle_to_response(bundle)


@router.delete("/{bundle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bundle(
    bundle_id: uuid.UUID,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a bundle (cascades to components)."""
    result = await db.execute(
        select(Bundle).where(Bundle.id == bundle_id)
    )
    bundle = result.scalar_one_or_none()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bundle with id {bundle_id} not found"
        )

    await db.delete(bundle)
    await db.commit()


# ============================================================================
# Bundle Components Management
# ============================================================================


@router.post("/{bundle_id}/components", response_model=BundleComponentResponse, status_code=status.HTTP_201_CREATED)
async def add_bundle_component(
    bundle_id: uuid.UUID,
    data: BundleComponentCreate,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a component to a bundle."""
    # Verify bundle exists
    bundle_result = await db.execute(
        select(Bundle).where(Bundle.id == bundle_id)
    )
    bundle = bundle_result.scalar_one_or_none()
    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bundle with id {bundle_id} not found"
        )

    # Verify product exists and is published
    product_result = await db.execute(
        select(Product).where(Product.id == data.product_id)
    )
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {data.product_id} not found"
        )
    if product.status != "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product '{product.name}' must be published to be included in a bundle"
        )

    # Check if product already in bundle
    existing_result = await db.execute(
        select(BundleComponent).where(
            BundleComponent.bundle_id == bundle_id,
            BundleComponent.product_id == data.product_id
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product {data.product_id} is already a component of this bundle"
        )

    # Create component
    component = BundleComponent(
        bundle_id=bundle_id,
        product_id=data.product_id,
        quantity=data.quantity,
        sort_order=data.sort_order,
        allowed_vendor_ids=data.allowed_vendor_ids,
    )

    db.add(component)
    await db.commit()
    await db.refresh(component)

    # Load with product for response
    result = await db.execute(
        select(BundleComponent)
        .options(selectinload(BundleComponent.product))
        .where(BundleComponent.id == component.id)
    )
    component = result.scalar_one()

    return _component_to_response(component)


@router.patch("/{bundle_id}/components/{component_id}", response_model=BundleComponentResponse)
async def update_bundle_component(
    bundle_id: uuid.UUID,
    component_id: uuid.UUID,
    data: BundleComponentCreate,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a bundle component."""
    result = await db.execute(
        select(BundleComponent).where(
            BundleComponent.id == component_id,
            BundleComponent.bundle_id == bundle_id
        )
    )
    component = result.scalar_one_or_none()

    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Component {component_id} not found in bundle {bundle_id}"
        )

    # If changing product_id, verify new product exists
    if data.product_id != component.product_id:
        product_result = await db.execute(
            select(Product).where(Product.id == data.product_id)
        )
        product = product_result.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {data.product_id} not found"
            )
        if product.status != "published":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' must be published to be included in a bundle"
            )

    # Update fields
    component.product_id = data.product_id
    component.quantity = data.quantity
    component.sort_order = data.sort_order
    component.allowed_vendor_ids = data.allowed_vendor_ids

    await db.commit()
    await db.refresh(component)

    # Load with product for response
    result = await db.execute(
        select(BundleComponent)
        .options(selectinload(BundleComponent.product))
        .where(BundleComponent.id == component.id)
    )
    component = result.scalar_one()

    return _component_to_response(component)


@router.delete("/{bundle_id}/components/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bundle_component(
    bundle_id: uuid.UUID,
    component_id: uuid.UUID,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a component from a bundle."""
    result = await db.execute(
        select(BundleComponent).where(
            BundleComponent.id == component_id,
            BundleComponent.bundle_id == bundle_id
        )
    )
    component = result.scalar_one_or_none()

    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Component {component_id} not found in bundle {bundle_id}"
        )

    await db.delete(component)
    await db.commit()


# ============================================================================
# Helper Functions
# ============================================================================


def _bundle_to_response(bundle: Bundle) -> BundleResponse:
    """Convert Bundle model to BundleResponse schema."""
    components = [
        BundleComponentResponse(
            id=str(comp.id),
            product_id=str(comp.product_id),
            product_name=comp.product.name if comp.product else "Unknown",
            product_slug=comp.product.slug if comp.product else "",
            quantity=comp.quantity,
            sort_order=comp.sort_order,
            gross_unit_price=float(comp.gross_unit_price) if comp.gross_unit_price else None,
            allocated_discount=float(comp.allocated_discount) if comp.allocated_discount else None,
            net_unit_price=float(comp.net_unit_price) if comp.net_unit_price else None,
            winning_vendor_name=comp.winning_vendor_name,
        )
        for comp in bundle.components
    ]

    return BundleResponse(
        id=str(bundle.id),
        name=bundle.name,
        slug=bundle.slug,
        description=bundle.description,
        discount_type=bundle.discount_type,
        discount_value=float(bundle.discount_value),
        funding_source=bundle.funding_source,
        is_active=bundle.is_active,
        is_available=bundle.is_available,
        gross_customer_price=float(bundle.gross_customer_price) if bundle.gross_customer_price else None,
        discount_amount=float(bundle.discount_amount) if bundle.discount_amount else None,
        net_customer_price=float(bundle.net_customer_price) if bundle.net_customer_price else None,
        components=components,
        created_at=bundle.created_at,
        updated_at=bundle.updated_at,
    )


def _component_to_response(component: BundleComponent) -> BundleComponentResponse:
    """Convert BundleComponent model to BundleComponentResponse schema."""
    return BundleComponentResponse(
        id=str(component.id),
        product_id=str(component.product_id),
        product_name=component.product.name if component.product else "Unknown",
        product_slug=component.product.slug if component.product else "",
        quantity=component.quantity,
        sort_order=component.sort_order,
        gross_unit_price=float(component.gross_unit_price) if component.gross_unit_price else None,
        allocated_discount=float(component.allocated_discount) if component.allocated_discount else None,
        net_unit_price=float(component.net_unit_price) if component.net_unit_price else None,
        winning_vendor_name=component.winning_vendor_name,
    )
