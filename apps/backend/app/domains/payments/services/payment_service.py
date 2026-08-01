import uuid
import asyncio
import random
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func, update
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.domains.payments.models import (
    PaymentMethod,
    Transaction,
    PaymentCallback,
    Refund,
    TransactionStatus,
    TransactionType,
    RefundStatus,
    RefundReason,
    PaymentProvider,
)
from app.domains.payments.schemas import (
    STKPushRequest,
    STKPushResponse,
    STKPushStatusResponse,
    RefundCreate,
    RefundResponse,
    PaymentAnalyticsResponse,
    PaymentSummaryResponse,
    TransactionStatus as StatusEnum,
    RefundStatus as RefundStatusEnum,
)
from app.domains.shopping.models.order import Order


class MPesaDarajaSimulator:
    """
    Simulates M-Pesa Daraja API behavior for development/testing.

    This simulator mimics the real Daraja API flow:
    1. STK Push initiation
    2. Customer receives prompt on phone
    3. Customer enters PIN
    4. Callback with result

    In simulation mode, it automatically completes payments after a delay.
    Can be configured to simulate various scenarios (success, failure, timeout).
    """

    # Daraja API response codes
    SUCCESS = "0"
    INVALID_CREDENTIALS = "1"
    INVALID_REQUEST = "2"
    SYSTEM_ERROR = "3"
    ACCOUNT_BALANCE = "4"
    INVALID_PHONE = "5"

    # Result codes for callbacks
    RESULT_SUCCESS = 0
    RESULT_INSUFFICIENT_FUNDS = 1
    RESULT_CANCELLED_BY_USER = 2
    RESULT_INVALID_REQUEST = 3
    RESULT_TIMEOUT = 4
    RESULT_INTERNAL_ERROR = 5

    def __init__(self):
        self._pending_requests: Dict[str, dict] = {}
        self._auto_complete = True  # Auto-complete payments in simulation
        self._success_rate = 0.85  # 85% success rate in simulation
        self._processing_delay = 5  # Seconds before callback (simulated)

    async def initiate_stk_push(
        self,
        phone_number: str,
        amount: float,
        account_reference: str,
        transaction_desc: str,
        shortcode: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Simulate STK Push initiation (Daraja: /mpesa/stkpush/v1/processrequest)

        Returns response matching Daraja API format.
        """
        # Generate request IDs
        merchant_request_id = self._generate_merchant_request_id()
        checkout_request_id = self._generate_checkout_request_id()

        # Store pending request
        self._pending_requests[merchant_request_id] = {
            "phone_number": phone_number,
            "amount": amount,
            "account_reference": account_reference,
            "transaction_desc": transaction_desc,
            "checkout_request_id": checkout_request_id,
            "shortcode": shortcode or "174379",
            "created_at": datetime.utcnow(),
            "status": "pending",
        }

        # Schedule automatic completion if enabled
        if self._auto_complete:
            asyncio.create_task(
                self._auto_complete_payment(merchant_request_id)
            )

        return {
            "MerchantRequestID": merchant_request_id,
            "CheckoutRequestID": checkout_request_id,
            "ResponseCode": self.SUCCESS,
            "ResponseDescription": "Success. Request accepted for processing",
            "CustomerMessage": f"Use M-Pesa PIN to complete your payment of KES {amount:.2f}",
        }

    async def check_stk_push_status(
        self,
        merchant_request_id: str,
    ) -> Dict[str, Any]:
        """
        Simulate STK Push status query (Daraja: /mpesa/stkpushquery/v1/query)

        Returns response matching Daraja API format.
        """
        if merchant_request_id not in self._pending_requests:
            return {
                "ResponseCode": self.INVALID_REQUEST,
                "ResponseDescription": "Request not found",
                "MerchantRequestID": merchant_request_id,
            }

        request_data = self._pending_requests[merchant_request_id]
        status = request_data.get("status", "pending")

        if status == "pending":
            return {
                "ResponseCode": self.SUCCESS,
                "ResponseDescription": "Request is being processed",
                "MerchantRequestID": merchant_request_id,
                "CheckoutRequestID": request_data["checkout_request_id"],
                "ResultCode": None,  # No result yet
            }
        elif status == "completed":
            return {
                "ResponseCode": self.SUCCESS,
                "ResponseDescription": "Transaction completed successfully",
                "MerchantRequestID": merchant_request_id,
                "CheckoutRequestID": request_data["checkout_request_id"],
                "ResultCode": self.RESULT_SUCCESS,
                "ResultDesc": "The service request is processed successfully.",
            }
        elif status == "failed":
            result_code = request_data.get("result_code", self.RESULT_INTERNAL_ERROR)
            return {
                "ResponseCode": self.SUCCESS,
                "ResponseDescription": "Transaction failed",
                "MerchantRequestID": merchant_request_id,
                "CheckoutRequestID": request_data["checkout_request_id"],
                "ResultCode": result_code,
                "ResultDesc": request_data.get("result_desc", "Transaction failed"),
            }

    async def process_reversal(
        self,
        original_receipt: str,
        amount: float,
        phone_number: str,
        remark: str,
    ) -> Dict[str, Any]:
        """
        Simulate reversal request (Daraja: /mpesa/reversal/v1/request)

        Returns response matching Daraja API format.
        """
        reversal_id = self._generate_reversal_id()

        # In simulation, most reversals succeed
        return {
            "ResponseCode": self.SUCCESS,
            "ResponseDescription": "Reversal accepted for processing",
            "OriginatorConversationID": reversal_id,
            "ConversationID": self._generate_conversation_id(),
            "ResponseDescription": "Success. Reversal request accepted.",
        }

    async def _auto_complete_payment(self, merchant_request_id: str):
        """
        Automatically complete payment after delay (simulation).

        Simulates the user receiving the prompt and entering PIN.
        Can succeed or fail based on success_rate.
        """
        await asyncio.sleep(self._processing_delay)

        if merchant_request_id not in self._pending_requests:
            return

        request_data = self._pending_requests[merchant_request_id]

        # Determine outcome based on success rate
        if random.random() < self._success_rate:
            request_data["status"] = "completed"
            request_data["result_code"] = self.RESULT_SUCCESS
            request_data["result_desc"] = "The service request is processed successfully."
            request_data["mpesa_receipt"] = self._generate_mpesa_receipt()
            request_data["transaction_date"] = datetime.utcnow()
            request_data["balance"] = random.randint(1000, 50000)  # Simulated balance
        else:
            # Simulate various failure scenarios
            failure_scenarios = [
                (self.RESULT_CANCELLED_BY_USER, "Request cancelled by user"),
                (self.RESULT_INSUFFICIENT_FUNDS, "Insufficient funds"),
                (self.RESULT_TIMEOUT, "Request timed out"),
            ]
            result_code, result_desc = random.choice(failure_scenarios)

            request_data["status"] = "failed"
            request_data["result_code"] = result_code
            request_data["result_desc"] = result_desc

    def _generate_merchant_request_id(self) -> str:
        """Generate unique merchant request ID"""
        return f"MERCH-{uuid.uuid4().hex[:16].upper()}"

    def _generate_checkout_request_id(self) -> str:
        """Generate unique checkout request ID"""
        return f"CO-{uuid.uuid4().hex[:8].upper()}"

    def _generate_mpesa_receipt(self) -> str:
        """Generate M-Pesa receipt number"""
        return f"SAF{random.randint(1000000000, 9999999999)}"

    def _generate_reversal_id(self) -> str:
        """Generate reversal ID"""
        return f"REV-{uuid.uuid4().hex[:16].upper()}"

    def _generate_conversation_id(self) -> str:
        """Generate conversation ID"""
        return f"CONV-{uuid.uuid4().hex[:16].upper()}"

    def get_pending_request(self, merchant_request_id: str) -> Optional[dict]:
        """Get pending request data for callback processing"""
        return self._pending_requests.get(merchant_request_id)

    def update_request_status(self, merchant_request_id: str, status: str):
        """Manually update request status (for testing)"""
        if merchant_request_id in self._pending_requests:
            self._pending_requests[merchant_request_id]["status"] = status

    def set_success_rate(self, rate: float):
        """Set simulation success rate (0.0 to 1.0)"""
        self._success_rate = max(0.0, min(1.0, rate))

    def set_processing_delay(self, delay_seconds: int):
        """Set auto-complete delay"""
        self._processing_delay = max(1, delay_seconds)


# Global simulator instance
daraja_simulator = MPesaDarajaSimulator()


class PaymentService:
    """
    Payment service for transaction processing.

    Handles:
    - Payment method management
    - STK Push initiation (via simulated Daraja)
    - Transaction status tracking
    - Callback processing
    - Refund processing
    - Analytics
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.simulator = daraja_simulator

    # ============================================================================
    # PAYMENT METHODS
    # ============================================================================

    async def get_payment_methods(
        self,
        skip: int = 0,
        limit: int = 100,
        is_enabled: Optional[bool] = None,
    ) -> tuple[List[PaymentMethod], int]:
        """Get payment methods with filtering"""
        query = select(PaymentMethod).where(PaymentMethod.is_deleted == False)

        if is_enabled is not None:
            query = query.where(PaymentMethod.is_enabled == is_enabled)

        # Order by display order
        query = query.order_by(PaymentMethod.display_order, PaymentMethod.name)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        payment_methods = result.scalars().all()

        return list(payment_methods), total

    async def get_payment_method(self, method_id: uuid.UUID) -> Optional[PaymentMethod]:
        """Get payment method by ID"""
        query = select(PaymentMethod).where(
            and_(
                PaymentMethod.id == method_id,
                PaymentMethod.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_default_payment_method(self) -> Optional[PaymentMethod]:
        """Get default payment method (usually M-Pesa)"""
        query = select(PaymentMethod).where(
            and_(
                PaymentMethod.is_default == True,
                PaymentMethod.is_enabled == True,
                PaymentMethod.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_payment_method(
        self,
        name: str,
        provider: str,
        **kwargs
    ) -> PaymentMethod:
        """Create payment method"""
        payment_method = PaymentMethod(
            name=name,
            provider=provider,
            **kwargs
        )
        self.db.add(payment_method)
        await self.db.commit()
        await self.db.refresh(payment_method)
        return payment_method

    async def update_payment_method(
        self,
        method_id: uuid.UUID,
        **kwargs
    ) -> Optional[PaymentMethod]:
        """Update payment method"""
        payment_method = await self.get_payment_method(method_id)
        if not payment_method:
            return None

        for key, value in kwargs.items():
            if hasattr(payment_method, key) and value is not None:
                setattr(payment_method, key, value)

        await self.db.commit()
        await self.db.refresh(payment_method)
        return payment_method

    async def calculate_fee(
        self,
        method_id: uuid.UUID,
        amount: float
    ) -> float:
        """Calculate payment method fee"""
        payment_method = await self.get_payment_method(method_id)
        if not payment_method:
            return 0.0

        if payment_method.fee_type == "percentage":
            fee = amount * (payment_method.fee_value / 100)
            return max(
                payment_method.fee_min or 0.0,
                min(fee, payment_method.fee_max or fee)
            )
        elif payment_method.fee_type == "fixed":
            return payment_method.fee_value or 0.0

        return 0.0

    # ============================================================================
    # STK PUSH (M-Pesa)
    # ============================================================================

    async def initiate_stk_push(
        self,
        request: STKPushRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> STKPushResponse:
        """
        Initiate M-Pesa STK Push payment.

        Creates transaction record and calls Daraja simulator.
        """
        # Get payment method (default to M-Pesa if not specified)
        if request.payment_method_id:
            payment_method = await self.get_payment_method(request.payment_method_id)
        else:
            payment_method = await self.get_default_payment_method()

        if not payment_method:
            return STKPushResponse(
                success=False,
                message="Payment method not found or not available",
            )

        # Validate amount
        if request.amount < payment_method.min_amount or request.amount > payment_method.max_amount:
            return STKPushResponse(
                success=False,
                message=f"Amount must be between {payment_method.min_amount} and {payment_method.max_amount}",
            )

        # Calculate fee
        fee = await self.calculate_fee(payment_method.id, request.amount)
        total_amount = request.amount + fee

        # Call Daraja simulator
        daraja_response = await self.simulator.initiate_stk_push(
            phone_number=request.phone_number,
            amount=request.amount,
            account_reference=request.account_reference,
            transaction_desc=request.transaction_desc,
            shortcode=payment_method.mpesa_shortcode,
        )

        # Create transaction record
        transaction = Transaction(
            payment_method_id=payment_method.id,
            order_id=request.order_id,
            transaction_type=TransactionType.PAYMENT.value,
            status=TransactionStatus.PENDING.value,
            amount=request.amount,
            currency=request.currency,
            fee=fee,
            total_amount=total_amount,
            merchant_request_id=daraja_response.get("MerchantRequestID"),
            checkout_request_id=daraja_response.get("CheckoutRequestID"),
            phone_number=request.phone_number,
            response_description=daraja_response.get("ResponseDescription"),
            response_code=daraja_response.get("ResponseCode"),
            customer_message=daraja_response.get("CustomerMessage"),
            ip_address=ip_address,
            user_agent=user_agent,
            transaction_metadata=request.metadata or {},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)

        return STKPushResponse(
            success=daraja_response.get("ResponseCode") == self.simulator.SUCCESS,
            message=daraja_response.get("ResponseDescription", ""),
            merchant_request_id=daraja_response.get("MerchantRequestID"),
            checkout_request_id=daraja_response.get("CheckoutRequestID"),
            response_code=daraja_response.get("ResponseCode"),
            response_description=daraja_response.get("ResponseDescription"),
            customer_message=daraja_response.get("CustomerMessage"),
            transaction_id=transaction.id,
        )

    async def check_transaction_status(
        self,
        merchant_request_id: str
    ) -> STKPushStatusResponse:
        """Check STK Push transaction status"""
        # First, query our database
        query = select(Transaction).where(
            Transaction.merchant_request_id == merchant_request_id
        )
        result = await self.db.execute(query)
        transaction = result.scalar_one_or_none()

        if not transaction:
            return STKPushStatusResponse(
                success=False,
                status=StatusEnum.PENDING,
                data={"error": "Transaction not found"},
            )

        # Query simulator for latest status
        daraja_response = await self.simulator.check_stk_push_status(merchant_request_id)

        # Update transaction based on Daraja response
        if daraja_response.get("ResultCode") is not None:
            result_code = daraja_response["ResultCode"]

            if result_code == self.simulator.RESULT_SUCCESS:
                # Get callback metadata from simulator
                pending_request = self.simulator.get_pending_request(merchant_request_id)
                if pending_request:
                    transaction.status = TransactionStatus.COMPLETED.value
                    transaction.mpesa_receipt = pending_request.get("mpesa_receipt")
                    transaction.transaction_date = pending_request.get("transaction_date")
                    transaction.balance = pending_request.get("balance")

                    # Update Order status if linked
                    if transaction.order_id:
                        order_stmt = update(Order).where(Order.id == transaction.order_id).values(status="paid")
                        await self.db.execute(order_stmt)
                        logger.info(f"Order {transaction.order_id} updated to 'paid' via status check")
            else:
                transaction.status = TransactionStatus.FAILED.value
                transaction.failure_reason = daraja_response.get("ResultDesc", "Unknown error")

                # Update Order status if linked
                if transaction.order_id:
                    order_stmt = update(Order).where(Order.id == transaction.order_id).values(status="cancelled")
                    await self.db.execute(order_stmt)
                    logger.info(f"Order {transaction.order_id} updated to 'cancelled' via status check")

            await self.db.commit()

        return STKPushStatusResponse(
            success=True,
            status=StatusEnum(transaction.status),
            data={
                "transaction_id": str(transaction.id),
                "amount": float(transaction.amount),
                "currency": transaction.currency,
                "phone_number": transaction.phone_number,
                "mpesa_receipt": transaction.mpesa_receipt,
            },
        )

    # ============================================================================
    # CALLBACKS
    # ============================================================================

    async def process_callback(
        self,
        merchant_request_id: str,
        callback_data: dict,
        ip_address: Optional[str] = None,
    ) -> bool:
        """
        Process M-Pesa payment callback.

        Updates transaction status based on callback result.
        """
        # Find transaction
        query = select(Transaction).where(
            Transaction.merchant_request_id == merchant_request_id
        )
        result = await self.db.execute(query)
        transaction = result.scalar_one_or_none()

        if not transaction:
            return False

        # Create callback record
        callback = PaymentCallback(
            transaction_id=transaction.id,
            merchant_request_id=merchant_request_id,
            checkout_request_id=callback_data.get("CheckoutRequestID"),
            status="success" if callback_data.get("ResultCode") == 0 else "failed",
            result_code=callback_data.get("ResultCode"),
            result_description=callback_data.get("ResultDesc"),
            raw_callback=callback_data,
            ip_address=ip_address,
        )
        self.db.add(callback)

        # Update transaction based on result
        result_code = callback_data.get("ResultCode")

        if result_code == self.simulator.RESULT_SUCCESS:
            transaction.status = TransactionStatus.COMPLETED.value

            # Extract metadata
            metadata_items = callback_data.get("CallbackMetadata", {}).get("MetadataItem", [])
            metadata_dict = {item["Key"]: item["Value"] for item in metadata_items}

            transaction.mpesa_receipt = metadata_dict.get("M-PesaReceiptNumber")
            transaction.transaction_date = metadata_dict.get("TransactionDate")
            transaction.balance = metadata_dict.get("Balance")

            # Update Order status if linked
            if transaction.order_id:
                try:
                    from app.domains.shopping.services.order_service import OrderService
                    from app.domains.shared.events.publisher import publish_order_paid
                    from app.domains.shared.events.events import OrderPaidEvent, SubOrderEvent, OrderItemEvent
                    from app.domains.shopping.models import Order, SubOrder
                    from sqlalchemy.orm import selectinload

                    order_service = OrderService(self.db)
                    await order_service.update_order_status(transaction.order_id, "paid")
                    logger.info(f"Order {transaction.order_id} updated to 'paid' via callback using OrderService")

                    # Fetch order with sub_orders and items for event publishing
                    order_stmt = select(Order).where(Order.id == transaction.order_id).options(
                        selectinload(Order.sub_orders).selectinload(SubOrder.items)
                    )
                    order_result = await self.db.execute(order_stmt)
                    order = order_result.scalar_one_or_none()

                    # Publish OrderPaidEvent to RabbitMQ
                    if order and order.sub_orders:
                        try:
                            event = OrderPaidEvent(
                                order_id=order.id,
                                customer_id=order.user_id,
                                total_amount=float(order.total_amount),
                                mpesa_receipt=transaction.mpesa_receipt,
                                sub_orders=[
                                    SubOrderEvent(
                                        sub_order_id=so.id,
                                        vendor_id=so.vendor_id,
                                        subtotal_amount=float(so.subtotal_amount),
                                        items=[
                                            OrderItemEvent(
                                                product_id=oi.product_id,
                                                vendor_id=oi.vendor_id,
                                                quantity=int(oi.quantity),
                                                unit_price=float(oi.unit_price)
                                            )
                                            for oi in so.items
                                        ]
                                    )
                                    for so in order.sub_orders
                                ],
                                created_at=datetime.utcnow()
                            )
                            await publish_order_paid(event)
                            logger.info(f"Published OrderPaid event for order {transaction.order_id}")
                        except Exception as event_error:
                            logger.error(f"Failed to publish OrderPaid event: {event_error}")
                            # Event will be retried via outbox pattern

                except Exception as e:
                    logger.error(f"Failed to update order status to paid via OrderService: {e}")
                    order_stmt = update(Order).where(Order.id == transaction.order_id).values(status="paid")
                    await self.db.execute(order_stmt)
                    logger.info(f"Order {transaction.order_id} updated to 'paid' directly via callback fallback")
        else:
            transaction.status = TransactionStatus.FAILED.value
            transaction.failure_reason = callback_data.get("ResultDesc", "Unknown error")

            # Optional: Update Order status to cancelled if linked
            if transaction.order_id:
                try:
                    from app.domains.shopping.services.order_service import OrderService
                    order_service = OrderService(self.db)
                    await order_service.update_order_status(transaction.order_id, "cancelled")
                    logger.info(f"Order {transaction.order_id} updated to 'cancelled' via callback using OrderService")
                except Exception as e:
                    logger.error(f"Failed to update order status to cancelled via OrderService: {e}")
                    order_stmt = update(Order).where(Order.id == transaction.order_id).values(status="cancelled")
                    await self.db.execute(order_stmt)
                    logger.info(f"Order {transaction.order_id} updated to 'cancelled' directly via callback fallback")

        await self.db.commit()
        return True

    # ============================================================================
    # TRANSACTIONS
    # ============================================================================

    async def get_transactions(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        payment_method_id: Optional[uuid.UUID] = None,
        phone_number: Optional[str] = None,
        order_id: Optional[uuid.UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple[List[Transaction], int]:
        """Get transactions with filtering"""
        query = select(Transaction).where(Transaction.is_deleted == False)

        if status:
            query = query.where(Transaction.status == status)
        if payment_method_id:
            query = query.where(Transaction.payment_method_id == payment_method_id)
        if phone_number:
            query = query.where(Transaction.phone_number == phone_number)
        if order_id:
            query = query.where(Transaction.order_id == order_id)
        if date_from:
            query = query.where(Transaction.created_at >= date_from)
        if date_to:
            query = query.where(Transaction.created_at <= date_to)

        # Order by created_at descending
        query = query.order_by(desc(Transaction.created_at))

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        transactions = result.scalars().all()

        return list(transactions), total

    async def get_transaction(self, transaction_id: uuid.UUID) -> Optional[Transaction]:
        """Get transaction by ID with related data"""
        query = select(Transaction).options(
            selectinload(Transaction.payment_method),
            selectinload(Transaction.refunds),
        ).where(
            and_(
                Transaction.id == transaction_id,
                Transaction.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    # ============================================================================
    # REFUNDS
    # ============================================================================

    async def create_refund(
        self,
        refund_data: RefundCreate,
        initiated_by: Optional[uuid.UUID] = None,
    ) -> Optional[Refund]:
        """
        Create refund request.

        Validates that transaction can be refunded and creates refund record.
        """
        # Get transaction
        transaction = await self.get_transaction(refund_data.transaction_id)
        if not transaction:
            return None

        # Validate transaction is completed
        if transaction.status != TransactionStatus.COMPLETED.value:
            return None

        # Check refund amount doesn't exceed transaction amount
        if refund_data.amount > float(transaction.amount):
            return None

        # Check if already fully refunded
        existing_refunds = [r for r in transaction.refunds if r.status == RefundStatus.COMPLETED.value]
        total_refunded = sum(float(r.amount) for r in existing_refunds)
        if total_refunded + refund_data.amount > float(transaction.amount):
            return None

        # Create refund
        refund = Refund(
            transaction_id=refund_data.transaction_id,
            order_id=refund_data.order_id,
            initiated_by=initiated_by,
            status=RefundStatus.PENDING.value,
            reason=refund_data.reason,
            reason_details=refund_data.reason_details,
            amount=refund_data.amount,
            currency=refund_data.currency,
            phone_number=refund_data.phone_number,
            mpesa_receipt=transaction.mpesa_receipt,
            refund_metadata=refund_data.refund_metadata or {},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        self.db.add(refund)
        await self.db.commit()
        await self.db.refresh(refund)

        return refund

    async def process_refund(self, refund_id: uuid.UUID) -> Optional[Refund]:
        """
        Process refund via M-Pesa reversal.

        Should be called after refund approval.
        """
        query = select(Refund).where(Refund.id == refund_id)
        result = await self.db.execute(query)
        refund = result.scalar_one_or_none()

        if not refund or refund.status != RefundStatus.PENDING.value:
            return None

        # Update status to processing
        refund.status = RefundStatus.PROCESSING.value
        await self.db.commit()

        # Get transaction
        transaction = await self.get_transaction(refund.transaction_id)
        if not transaction:
            refund.status = RefundStatus.FAILED.value
            refund.failure_reason = "Transaction not found"
            await self.db.commit()
            return refund

        # Call reversal API
        reversal_response = await self.simulator.process_reversal(
            original_receipt=transaction.mpesa_receipt or "",
            amount=float(refund.amount),
            phone_number=refund.phone_number,
            remark=refund.reason_details or refund.reason,
        )

        # Process reversal response
        if reversal_response.get("ResponseCode") == self.simulator.SUCCESS:
            refund.status = RefundStatus.COMPLETED.value
            refund.reversal_id = reversal_response.get("OriginatorConversationID")
            refund.response_description = reversal_response.get("ResponseDescription")
            refund.completed_at = datetime.utcnow()

            # Calculate fee (simulated: reversal fee is flat)
            refund.refund_fee = 50.0  # KES 50 reversal fee
            refund.net_refund = float(refund.amount) - refund.refund_fee

            # Update transaction status
            transaction.status = TransactionStatus.REFUNDED.value
        else:
            refund.status = RefundStatus.FAILED.value
            refund.failure_reason = reversal_response.get("ResponseDescription", "Reversal failed")

        refund.processed_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(refund)

        return refund

    async def get_refunds(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        transaction_id: Optional[uuid.UUID] = None,
    ) -> tuple[List[Refund], int]:
        """Get refunds with filtering"""
        query = select(Refund).where(Refund.is_deleted == False)

        if status:
            query = query.where(Refund.status == status)
        if transaction_id:
            query = query.where(Refund.transaction_id == transaction_id)

        # Order by created_at descending
        query = query.order_by(desc(Refund.created_at))

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        refunds = result.scalars().all()

        return list(refunds), total

    async def get_refund_by_id(self, refund_id: uuid.UUID) -> Optional[Refund]:
        """Get refund by ID"""
        query = select(Refund).where(
            and_(
                Refund.id == refund_id,
                Refund.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def approve_refund(
        self,
        refund_id: uuid.UUID,
        approved: bool,
        approved_by: uuid.UUID,
        notes: Optional[str] = None,
    ) -> Optional[Refund]:
        """Approve or reject refund"""
        query = select(Refund).where(Refund.id == refund_id)
        result = await self.db.execute(query)
        refund = result.scalar_one_or_none()

        if not refund or refund.status != RefundStatus.PENDING.value:
            return None

        if approved:
            refund.status = RefundStatus.PENDING.value  # Still pending processing
            refund.approved_by = approved_by
            refund.approved_at = datetime.utcnow()
            refund.approval_notes = notes

            # Auto-process if approved
            await self.db.commit()
            return await self.process_refund(refund_id)
        else:
            refund.status = RefundStatus.CANCELLED.value
            refund.approved_by = approved_by
            refund.approved_at = datetime.utcnow()
            refund.approval_notes = notes
            await self.db.commit()
            await self.db.refresh(refund)
            return refund

    # ============================================================================
    # ANALYTICS
    # ============================================================================

    async def get_payment_summary(
        self,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> PaymentSummaryResponse:
        """Get payment summary statistics"""
        base_query = select(Transaction).where(Transaction.is_deleted == False)

        if date_from:
            base_query = base_query.where(Transaction.created_at >= date_from)
        if date_to:
            base_query = base_query.where(Transaction.created_at <= date_to)

        # Total transactions
        total_result = await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total_transactions = total_result.scalar() or 0

        # Total amount
        amount_result = await self.db.execute(
            select(func.sum(Transaction.amount)).select_from(base_query.subquery())
        )
        total_amount = amount_result.scalar() or 0

        # Total fees
        fee_result = await self.db.execute(
            select(func.sum(Transaction.fee)).select_from(base_query.subquery())
        )
        total_fees = fee_result.scalar() or 0

        # Successful transactions
        success_query = base_query.where(Transaction.status == TransactionStatus.COMPLETED.value)
        success_result = await self.db.execute(
            select(func.count()).select_from(success_query.subquery())
        )
        successful_transactions = success_result.scalar() or 0

        success_amount_result = await self.db.execute(
            select(func.sum(Transaction.amount)).select_from(success_query.subquery())
        )
        successful_amount = success_amount_result.scalar() or 0

        # Failed transactions
        failed_query = base_query.where(Transaction.status == TransactionStatus.FAILED.value)
        failed_result = await self.db.execute(
            select(func.count()).select_from(failed_query.subquery())
        )
        failed_transactions = failed_result.scalar() or 0

        # Pending transactions
        pending_query = base_query.where(Transaction.status == TransactionStatus.PENDING.value)
        pending_result = await self.db.execute(
            select(func.count()).select_from(pending_query.subquery())
        )
        pending_transactions = pending_result.scalar() or 0

        # Today's stats
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_query = base_query.where(Transaction.created_at >= today)

        today_result = await self.db.execute(
            select(func.count()).select_from(today_query.subquery())
        )
        today_transactions = today_result.scalar() or 0

        today_amount_result = await self.db.execute(
            select(func.sum(Transaction.amount)).select_from(today_query.subquery())
        )
        today_amount = today_amount_result.scalar() or 0

        today_success_query = today_query.where(Transaction.status == TransactionStatus.COMPLETED.value)
        today_success_result = await self.db.execute(
            select(func.count()).select_from(today_success_query.subquery())
        )
        today_successful = today_success_result.scalar() or 0

        # Refunded amount
        refunded_query = select(Refund).where(
            and_(
                Refund.status == RefundStatus.COMPLETED.value,
                Refund.is_deleted == False
            )
        )
        if date_from:
            refunded_query = refunded_query.where(Refund.created_at >= date_from)
        if date_to:
            refunded_query = refunded_query.where(Refund.created_at <= date_to)

        refunded_result = await self.db.execute(
            select(func.sum(Refund.amount)).select_from(refunded_query.subquery())
        )
        refunded_amount = refunded_result.scalar() or 0

        # Calculate metrics
        success_rate = (successful_transactions / total_transactions * 100) if total_transactions > 0 else 0
        avg_transaction_value = (successful_amount / successful_transactions) if successful_transactions > 0 else 0

        return PaymentSummaryResponse(
            total_transactions=total_transactions,
            total_amount=float(total_amount),
            total_fees=float(total_fees),
            successful_transactions=successful_transactions,
            successful_amount=float(successful_amount),
            failed_transactions=failed_transactions,
            pending_transactions=pending_transactions,
            refunded_amount=float(refunded_amount),
            today_transactions=today_transactions,
            today_amount=float(today_amount),
            today_successful=today_successful,
            success_rate=round(success_rate, 2),
            average_transaction_value=round(avg_transaction_value, 2),
        )

    async def get_payment_analytics(
        self,
        days: int = 30,
    ) -> PaymentAnalyticsResponse:
        """Get detailed payment analytics"""
        date_from = datetime.utcnow() - timedelta(days=days)

        # Daily transaction counts
        daily_query = select(
            func.date(Transaction.created_at).label("date"),
            func.count().label("count"),
        ).where(
            and_(
                Transaction.created_at >= date_from,
                Transaction.is_deleted == False
            )
        ).group_by(func.date(Transaction.created_at))

        daily_result = await self.db.execute(daily_query)
        daily_transactions = [
            {"date": str(row[0]), "count": row[1]}
            for row in daily_result.all()
        ]

        # Payment method breakdown
        method_query = select(
            PaymentMethod.name.label("method"),
            func.count().label("count"),
            func.sum(Transaction.amount).label("total"),
        ).join(Transaction).where(
            and_(
                Transaction.created_at >= date_from,
                Transaction.is_deleted == False
            )
        ).group_by(PaymentMethod.name)

        method_result = await self.db.execute(method_query)
        payment_method_usage = [
            {"method": row[0], "count": row[1], "total": float(row[2] or 0)}
            for row in method_result.all()
        ]

        # Status breakdown
        status_query = select(
            Transaction.status.label("status"),
            func.count().label("count"),
        ).where(
            and_(
                Transaction.created_at >= date_from,
                Transaction.is_deleted == False
            )
        ).group_by(Transaction.status)

        status_result = await self.db.execute(status_query)
        status_breakdown = [
            {"status": row[0], "count": row[1]}
            for row in status_result.all()
        ]

        return PaymentAnalyticsResponse(
            daily_transactions=daily_transactions,
            daily_amounts=[],  # Would be similar to daily_transactions
            daily_success_rate=[],
            payment_method_usage=payment_method_usage,
            status_breakdown=status_breakdown,
            peak_hours=[],  # Hour-by-hour breakdown
            trend_7_days={},
            trend_30_days={},
        )

    # ============================================================================
    # DELETE OPERATIONS
    # ============================================================================

    async def delete_payment_method(
        self,
        method_id: uuid.UUID,
    ) -> Optional[PaymentMethod]:
        """Soft delete payment method"""
        payment_method = await self.get_payment_method(method_id)
        if not payment_method:
            return None

        # Check if method has any transactions
        from sqlalchemy import select, func
        transaction_count_query = select(func.count()).where(
            and_(
                Transaction.payment_method_id == method_id,
                Transaction.is_deleted == False
            )
        )
        result = await self.db.execute(transaction_count_query)
        transaction_count = result.scalar()

        # Don't allow deletion if transactions exist (soft delete only)
        if transaction_count and transaction_count > 0:
            payment_method.is_deleted = True
            payment_method.is_enabled = False  # Also disable
        else:
            # Hard delete if no transactions
            await self.db.delete(payment_method)

        await self.db.commit()
        return payment_method

    async def delete_refund(
        self,
        refund_id: uuid.UUID,
    ) -> Optional[Refund]:
        """Soft delete refund"""
        refund = await self.get_refund_by_id(refund_id)
        if not refund:
            return None

        # Only allow deletion of pending or cancelled refunds
        if refund.status not in [RefundStatus.PENDING.value, RefundStatus.CANCELLED.value, RefundStatus.FAILED.value]:
            return None

        refund.is_deleted = True
        await self.db.commit()
        await self.db.refresh(refund)
        return refund

    # ============================================================================
    # SIMPLE PAYMENT TRANSACTIONS (Card, Bank Transfer)
    # ============================================================================

    async def create_simple_transaction(
        self,
        payment_method_id: uuid.UUID,
        amount: float,
        currency: str,
        phone_number: Optional[str] = None,
        order_id: Optional[uuid.UUID] = None,
        vendor_id: Optional[uuid.UUID] = None,
        transaction_metadata: Optional[dict] = None,
        notes: Optional[str] = None,
    ) -> Optional[Transaction]:
        """
        Create a transaction directly for Card or Bank Transfer payments.

        This bypasses the M-Pesa STK Push flow and creates a transaction
        record that can be manually updated (e.g., mark as paid after card confirmation).
        """
        # Get payment method
        payment_method = await self.get_payment_method(payment_method_id)
        if not payment_method:
            return None

        # Validate provider type (only card or bank_transfer allowed)
        if payment_method.provider not in [PaymentProvider.CARD.value, PaymentProvider.BANK_TRANSFER.value]:
            return None

        # Validate amount
        if amount < payment_method.min_amount or amount > payment_method.max_amount:
            return None

        # Calculate fee
        fee = await self.calculate_fee(payment_method.id, amount)
        total_amount = amount + fee

        # Create transaction
        transaction = Transaction(
            payment_method_id=payment_method.id,
            order_id=order_id,
            vendor_id=vendor_id,
            transaction_type=TransactionType.PAYMENT.value,
            status=TransactionStatus.PENDING.value,
            amount=amount,
            currency=currency,
            fee=fee,
            total_amount=total_amount,
            phone_number=phone_number or "",  # Optional for card/bank
            transaction_metadata=transaction_metadata or {},
            notes=notes,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def update_simple_transaction(
        self,
        transaction_id: uuid.UUID,
        **kwargs
    ) -> Optional[Transaction]:
        """
        Update transaction for simple payment methods.

        Used for manual status updates (e.g., marking card payment as completed).
        Only allowed for card and bank_transfer payment methods.
        """
        # Get transaction with payment method
        query = select(Transaction).options(
            selectinload(Transaction.payment_method)
        ).where(
            and_(
                Transaction.id == transaction_id,
                Transaction.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        transaction = result.scalar_one_or_none()

        if not transaction:
            return None

        # Validate provider type
        if transaction.payment_method.provider not in [PaymentProvider.CARD.value, PaymentProvider.BANK_TRANSFER.value]:
            return None

        # Update allowed fields
        allowed_fields = {
            'status', 'amount', 'currency', 'fee', 'total_amount',
            'response_description', 'response_code', 'customer_message',
            'transaction_metadata', 'notes', 'failure_reason'
        }

        for key, value in kwargs.items():
            if key in allowed_fields and hasattr(transaction, key):
                setattr(transaction, key, value)

        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def delete_transaction(
        self,
        transaction_id: uuid.UUID,
    ) -> Optional[Transaction]:
        """
        Soft delete transaction for simple payment methods.

        Only allowed for card and bank_transfer payment methods in pending status.
        """
        # Get transaction with payment method
        query = select(Transaction).options(
            selectinload(Transaction.payment_method)
        ).where(
            and_(
                Transaction.id == transaction_id,
                Transaction.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        transaction = result.scalar_one_or_none()

        if not transaction:
            return None

        # Validate provider type
        if transaction.payment_method.provider not in [PaymentProvider.CARD.value, PaymentProvider.BANK_TRANSFER.value]:
            return None

        # Only allow deletion of pending transactions
        if transaction.status != TransactionStatus.PENDING.value:
            return None

        transaction.is_deleted = True
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction
