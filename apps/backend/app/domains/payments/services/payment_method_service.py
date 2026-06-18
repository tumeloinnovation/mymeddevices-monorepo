import uuid
from typing import Tuple, List, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.payments.models.saved_payment_method import SavedPaymentMethod
from app.domains.payments.schemas.payment_method_schemas import (
    MpesaPaymentMethodCreate,
    CardPaymentMethodCreate,
    BankPaymentMethodCreate,
)


class PaymentMethodService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_payment_methods(
        self, customer_id: uuid.UUID
    ) -> Tuple[List[SavedPaymentMethod], int]:
        """List all payment methods for a customer."""
        query = select(SavedPaymentMethod).where(
            and_(
                SavedPaymentMethod.customer_id == customer_id,
                SavedPaymentMethod.is_active == True,
            )
        )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get results
        query = query.order_by(SavedPaymentMethod.is_default.desc(), SavedPaymentMethod.created_at.desc())
        result = await self.db.execute(query)
        methods = result.scalars().all()

        return list(methods), total

    async def get_payment_method(
        self, method_id: uuid.UUID, customer_id: uuid.UUID
    ) -> Optional[SavedPaymentMethod]:
        """Get a payment method by ID."""
        result = await self.db.execute(
            select(SavedPaymentMethod).where(
                and_(
                    SavedPaymentMethod.id == method_id,
                    SavedPaymentMethod.customer_id == customer_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_default_payment_method(
        self, customer_id: uuid.UUID
    ) -> Optional[SavedPaymentMethod]:
        """Get the default payment method."""
        result = await self.db.execute(
            select(SavedPaymentMethod).where(
                and_(
                    SavedPaymentMethod.customer_id == customer_id,
                    SavedPaymentMethod.is_default == True,
                    SavedPaymentMethod.is_active == True,
                )
            )
        )
        return result.scalar_one_or_none()

    async def create_mpesa_method(
        self,
        customer_id: uuid.UUID,
        method_in: MpesaPaymentMethodCreate,
    ) -> SavedPaymentMethod:
        """Create an M-Pesa payment method."""
        # If setting as default, unset other defaults
        if method_in.is_default:
            await self._unset_default_methods(customer_id)

        method = SavedPaymentMethod(
            customer_id=customer_id,
            payment_type="mpesa",
            phone_number=method_in.phone_number,
            is_default=method_in.is_default,
            display_name=method_in.display_name or f"M-Pesa ({method_in.phone_number[-4:]})",
        )

        self.db.add(method)
        await self.db.commit()
        await self.db.refresh(method)

        return method

    async def create_card_method(
        self,
        customer_id: uuid.UUID,
        method_in: CardPaymentMethodCreate,
    ) -> SavedPaymentMethod:
        """Create a card payment method."""
        # If setting as default, unset other defaults
        if method_in.is_default:
            await self._unset_default_methods(customer_id)

        method = SavedPaymentMethod(
            customer_id=customer_id,
            payment_type="card",
            card_token=method_in.card_token,
            card_last4=method_in.card_last4,
            card_brand=method_in.card_brand,
            card_expiry_month=method_in.card_expiry_month,
            card_expiry_year=method_in.card_expiry_year,
            cardholder_name=method_in.cardholder_name,
            is_default=method_in.is_default,
            display_name=method_in.display_name or f"{method_in.card_brand} •••• {method_in.card_last4}",
        )

        self.db.add(method)
        await self.db.commit()
        await self.db.refresh(method)

        return method

    async def create_bank_method(
        self,
        customer_id: uuid.UUID,
        method_in: BankPaymentMethodCreate,
    ) -> SavedPaymentMethod:
        """Create a bank transfer payment method."""
        # If setting as default, unset other defaults
        if method_in.is_default:
            await self._unset_default_methods(customer_id)

        method = SavedPaymentMethod(
            customer_id=customer_id,
            payment_type="bank_transfer",
            bank_name=method_in.bank_name,
            bank_account_number=method_in.bank_account_number,  # Should be encrypted
            bank_account_name=method_in.bank_account_name,
            is_default=method_in.is_default,
            display_name=method_in.display_name or f"{method_in.bank_name} •••• {method_in.bank_account_number[-4:]}",
        )

        self.db.add(method)
        await self.db.commit()
        await self.db.refresh(method)

        return method

    async def update_payment_method(
        self,
        method_id: uuid.UUID,
        customer_id: uuid.UUID,
        is_default: bool = None,
        display_name: str = None,
        is_active: bool = None,
    ) -> Optional[SavedPaymentMethod]:
        """Update a payment method."""
        method = await self.get_payment_method(method_id, customer_id)
        if not method:
            return None

        if is_default is not None:
            if is_default:
                await self._unset_default_methods(customer_id)
            method.is_default = is_default

        if display_name is not None:
            method.display_name = display_name

        if is_active is not None:
            method.is_active = is_active

        await self.db.commit()
        await self.db.refresh(method)

        return method

    async def delete_payment_method(
        self, method_id: uuid.UUID, customer_id: uuid.UUID
    ) -> bool:
        """Delete (deactivate) a payment method."""
        method = await self.get_payment_method(method_id, customer_id)
        if not method:
            return False

        method.is_active = False
        await self.db.commit()

        return True

    async def _unset_default_methods(self, customer_id: uuid.UUID):
        """Unset all default payment methods for a customer."""
        result = await self.db.execute(
            select(SavedPaymentMethod).where(
                and_(
                    SavedPaymentMethod.customer_id == customer_id,
                    SavedPaymentMethod.is_default == True,
                )
            )
        )
        methods = result.scalars().all()

        for method in methods:
            method.is_default = False

        await self.db.commit()
