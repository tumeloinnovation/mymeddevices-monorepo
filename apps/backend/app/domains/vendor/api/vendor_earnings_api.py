import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.responses import success_response
from app.domains.auth.models.user import User
from app.domains.shopping.models.vendor_ledger import LedgerTransaction, LedgerTransactionType, VendorLedger
from app.domains.vendor.models.vendor_profile import VendorProfile

router = APIRouter(prefix="/vendor/earnings", tags=["Vendor Earnings"])


async def get_vendor_profile(db: AsyncSession, user_id: uuid.UUID) -> VendorProfile:
    stmt = select(VendorProfile).where(VendorProfile.user_id == user_id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return profile


@router.get("/summary")
async def get_earnings_summary(
    current_user: Annotated[User, Depends(require_role("vendor"))], db: AsyncSession = Depends(get_db)
):
    """Get vendor's earnings summary details from ledger"""
    profile = await get_vendor_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    # Get vendor ledger
    ledger = await db.get(VendorLedger, profile.id)
    available_balance = ledger.balance if ledger else Decimal("0")

    # Calculate total earnings (sum of all credit transactions)
    total_earnings_stmt = select(func.sum(LedgerTransaction.net_amount)).where(
        and_(
            LedgerTransaction.vendor_id == profile.id,
            LedgerTransaction.transaction_type == LedgerTransactionType.CREDIT,
        )
    )
    total_result = await db.execute(total_earnings_stmt)
    total_earnings = total_result.scalar() or Decimal("0")

    # Calculate current month earnings
    now = datetime.now(UTC)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    current_month_stmt = select(func.sum(LedgerTransaction.net_amount)).where(
        and_(
            LedgerTransaction.vendor_id == profile.id,
            LedgerTransaction.transaction_type == LedgerTransactionType.CREDIT,
            LedgerTransaction.created_at >= month_start,
        )
    )
    current_month_result = await db.execute(current_month_stmt)
    current_month_earnings = current_month_result.scalar() or Decimal("0")

    # Calculate last month earnings
    last_month_start = (month_start - timedelta(days=32)).replace(day=1)
    last_month_end = month_start

    last_month_stmt = select(func.sum(LedgerTransaction.net_amount)).where(
        and_(
            LedgerTransaction.vendor_id == profile.id,
            LedgerTransaction.transaction_type == LedgerTransactionType.CREDIT,
            LedgerTransaction.created_at >= last_month_start,
            LedgerTransaction.created_at < last_month_end,
        )
    )
    last_month_result = await db.execute(last_month_stmt)
    last_month_earnings = last_month_result.scalar() or Decimal("0")

    # Calculate pending payouts (debit_payout transactions in pending state)
    # For now, we'll estimate this as 0 since we don't have a full payout tracking system
    pending_payouts = Decimal("0")

    # Count sales (credit transactions)
    sales_count_stmt = select(func.count(LedgerTransaction.id)).where(
        and_(
            LedgerTransaction.vendor_id == profile.id,
            LedgerTransaction.transaction_type == LedgerTransactionType.CREDIT,
        )
    )
    sales_count_result = await db.execute(sales_count_stmt)
    sales_count = sales_count_result.scalar() or 0

    # Calculate platform fees earned by platform
    platform_fees_stmt = select(func.sum(LedgerTransaction.platform_fee_amount)).where(
        and_(
            LedgerTransaction.vendor_id == profile.id,
            LedgerTransaction.transaction_type == LedgerTransactionType.CREDIT,
        )
    )
    platform_fees_result = await db.execute(platform_fees_stmt)
    platform_fees_total = platform_fees_result.scalar() or Decimal("0")

    return success_response(
        {
            "total_earnings": float(total_earnings),
            "current_month_earnings": float(current_month_earnings),
            "last_month_earnings": float(last_month_earnings),
            "available_for_payout": float(available_balance),
            "pending_payouts": float(pending_payouts),
            "sales_count": sales_count,
            "platform_fee_total": float(platform_fees_total),
        }
    )


@router.get("/transactions")
async def get_ledger_transactions(
    current_user: Annotated[User, Depends(require_role("vendor"))],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    transaction_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Get ledger transactions for the vendor"""
    profile = await get_vendor_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    # Build query
    stmt = select(LedgerTransaction).where(LedgerTransaction.vendor_id == profile.id)

    if transaction_type:
        stmt = stmt.where(LedgerTransaction.transaction_type == transaction_type)

    # Order by created_at descending
    stmt = stmt.order_by(LedgerTransaction.created_at.desc())

    # Get total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    # Apply pagination
    stmt = stmt.offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    transactions = result.scalars().all()

    return success_response(
        {
            "items": [
                {
                    "id": str(txn.id),
                    "gross_amount": float(txn.gross_amount),
                    "platform_fee_amount": float(txn.platform_fee_amount) if txn.platform_fee_amount else 0,
                    "net_amount": float(txn.net_amount),
                    "transaction_type": txn.transaction_type,
                    "reference_id": txn.reference_id,
                    "reference_type": txn.reference_type,
                    "notes": txn.notes,
                    "created_at": txn.created_at.isoformat(),
                }
                for txn in transactions
            ],
            "total": total,
            "page": page,
            "limit": limit,
        }
    )


@router.get("/payouts")
async def get_payouts(
    current_user: Annotated[User, Depends(require_role("vendor"))],
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get list of payout requests for the vendor (debit transactions)"""
    profile = await get_vendor_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    # Get debit transactions (payouts and refunds)
    stmt = (
        select(LedgerTransaction)
        .where(
            and_(
                LedgerTransaction.vendor_id == profile.id,
                LedgerTransaction.transaction_type.in_(
                    [LedgerTransactionType.DEBIT_PAYOUT, LedgerTransactionType.DEBIT_REFUND]
                ),
            )
        )
        .order_by(LedgerTransaction.created_at.desc())
    )

    # Get total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    # Apply pagination
    stmt = stmt.offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    transactions = result.scalars().all()

    # Format payout method details
    mpesa_method = f"M-Pesa Phone: {profile.mpesa_phone}" if profile.mpesa_phone else "M-Pesa Till: 543210"
    bank_method = f"{profile.bank_name or 'Bank'} Acc: ****{profile.bank_account_number[-4:] if profile.bank_account_number else '4321'}"

    payouts = []
    for txn in transactions:
        # Determine method from reference_type or notes
        method = "mpesa" if txn.notes and "mpesa" in txn.notes.lower() else "bank"
        method_details = mpesa_method if method == "mpesa" else bank_method

        payouts.append(
            {
                "id": str(txn.id),
                "amount": float(txn.gross_amount),
                "status": "completed" if txn.transaction_type == LedgerTransactionType.DEBIT_PAYOUT else "refund",
                "method": method,
                "method_details": method_details,
                "created_at": txn.created_at.isoformat(),
                "processed_at": txn.created_at.isoformat(),  # For ledger transactions, created_at is when it was processed
            }
        )

    return success_response({"items": payouts, "total": total, "page": page, "limit": limit})


@router.post("/payouts/request")
async def request_payout(
    payload: dict, current_user: Annotated[User, Depends(require_role("vendor"))], db: AsyncSession = Depends(get_db)
):
    """Submit a request for payout"""
    profile = await get_vendor_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    if profile.approval_status != "approved":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor account is not approved for payouts")

    amount = Decimal(str(payload.get("amount", 0)))
    method = payload.get("type", "mpesa")

    if amount < 5000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Minimum payout amount is KES 5,000")

    # Get or create ledger with row lock to prevent concurrent double-payouts
    ledger_stmt = select(VendorLedger).where(VendorLedger.vendor_id == profile.id).with_for_update()
    ledger_result = await db.execute(ledger_stmt)
    ledger = ledger_result.scalar_one_or_none()
    if not ledger:
        ledger = VendorLedger(vendor_id=profile.id, balance=Decimal("0"))
        db.add(ledger)
        await db.flush()

    # Check sufficient balance
    if ledger.balance < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Available: KES {ledger.balance:.2f}, Requested: KES {amount:.2f}",
        )

    # Create debit transaction for the payout
    payout_txn = LedgerTransaction(
        id=uuid.uuid4(),
        vendor_id=profile.id,
        gross_amount=amount,
        platform_fee_rate=Decimal("0"),
        platform_fee_amount=Decimal("0"),
        net_amount=amount,
        transaction_type=LedgerTransactionType.DEBIT_PAYOUT,
        reference_id=str(uuid.uuid4()),
        reference_type="payout",
        notes=f"Payout requested via {method}",
        processed_by=current_user.id,
    )
    db.add(payout_txn)

    # Deduct from ledger
    ledger.balance -= amount
    ledger.last_updated_at = datetime.now(UTC)

    await db.commit()

    mpesa_method = f"M-Pesa Phone: {profile.mpesa_phone}" if profile.mpesa_phone else "M-Pesa Till: 543210"
    bank_method = f"{profile.bank_name or 'Bank'} Acc: ****{profile.bank_account_number[-4:] if profile.bank_account_number else '4321'}"

    created_at_str = payout_txn.created_at.isoformat() if payout_txn.created_at else datetime.now(UTC).isoformat()

    return success_response(
        {
            "id": str(payout_txn.id),
            "amount": float(amount),
            "status": "pending",
            "method": method,
            "method_details": mpesa_method if method == "mpesa" else bank_method,
            "created_at": created_at_str,
            "processed_at": None,
        }
    )
