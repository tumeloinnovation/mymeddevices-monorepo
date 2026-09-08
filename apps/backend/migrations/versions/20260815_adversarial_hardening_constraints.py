"""adversarial hardening constraints

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
Create Date: 2026-08-15 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e0f1a2b3c4d5'
down_revision: Union[str, None] = 'd9e0f1a2b3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add unique constraint on mobile_money_payments.transaction_id
    with op.batch_alter_table('mobile_money_payments', schema=None) as batch_op:
        batch_op.create_unique_constraint(
            'uq_mobile_money_payments_transaction_id',
            ['transaction_id'],
        )

    # 2. Add unique constraint on coupon_usages (coupon_id, order_id)
    with op.batch_alter_table('coupon_usages', schema=None) as batch_op:
        batch_op.create_unique_constraint(
            'uq_coupon_usages_coupon_order',
            ['coupon_id', 'order_id'],
        )

    # 3. Add check constraint on vendor_ledgers.balance >= 0
    with op.batch_alter_table('vendor_ledgers', schema=None) as batch_op:
        batch_op.create_check_constraint(
            'chk_vendor_ledger_balance_non_negative',
            'balance >= 0',
        )


def downgrade() -> None:
    with op.batch_alter_table('vendor_ledgers', schema=None) as batch_op:
        batch_op.drop_constraint('chk_vendor_ledger_balance_non_negative', type_='check')

    with op.batch_alter_table('coupon_usages', schema=None) as batch_op:
        batch_op.drop_constraint('uq_coupon_usages_coupon_order', type_='unique')

    with op.batch_alter_table('mobile_money_payments', schema=None) as batch_op:
        batch_op.drop_constraint('uq_mobile_money_payments_transaction_id', type_='unique')
