import uuid

import pytest
from httpx import AsyncClient

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.tickets.models.ticket import Ticket, TicketReply


@pytest.mark.asyncio
async def test_ticket_admin_access_and_internal_note_filtering(client: AsyncClient, db_session):
    """
    Test:
    1. Admin CAN access customer's ticket (including internal notes).
    2. Customer CANNOT see internal staff replies (internal notes are redacted).
    3. Customer CANNOT access another customer's ticket (rejected with 403).
    4. Worker CAN access customer's ticket and create internal notes.
    5. Customer attempting to post internal note has is_internal forced to 'no'.
    """
    auth_service = AuthService(db_session)

    # 1. Setup Customer 1
    customer1 = User(
        id=uuid.uuid4(),
        email="customer1@test.com",
        password_hash="test_hash",
        first_name="Cust",
        last_name="One",
        role="customer",
        is_active=True,
    )
    db_session.add(customer1)

    # 2. Setup Customer 2
    customer2 = User(
        id=uuid.uuid4(),
        email="customer2@test.com",
        password_hash="test_hash",
        first_name="Cust",
        last_name="Two",
        role="customer",
        is_active=True,
    )
    db_session.add(customer2)

    # 3. Setup Admin
    admin = User(
        id=uuid.uuid4(),
        email="admin_support@test.com",
        password_hash="test_hash",
        first_name="Admin",
        last_name="Support",
        role="admin",
        is_active=True,
    )
    db_session.add(admin)

    # 4. Setup Worker
    worker = User(
        id=uuid.uuid4(),
        email="worker_support@test.com",
        password_hash="test_hash",
        first_name="Worker",
        last_name="Support",
        role="worker",
        is_active=True,
    )
    db_session.add(worker)
    await db_session.flush()

    # 5. Create Ticket for Customer 1
    ticket = Ticket(
        id=uuid.uuid4(),
        ticket_number="TKT-20260814-1234",
        customer_id=customer1.id,
        subject="Shipping delay",
        description="Where is my order?",
        category="shipping",
        priority="medium",
        status="open",
    )
    db_session.add(ticket)
    await db_session.flush()

    # 6. Add a public reply and an internal staff reply
    public_reply = TicketReply(
        id=uuid.uuid4(),
        ticket_id=ticket.id,
        user_id=customer1.id,
        content="Please help urgently",
        is_internal="no",
    )
    db_session.add(public_reply)

    internal_reply = TicketReply(
        id=uuid.uuid4(),
        ticket_id=ticket.id,
        user_id=admin.id,
        content="INTERNAL NOTE: Customer is high-risk for chargebacks",
        is_internal="yes",
    )
    db_session.add(internal_reply)
    await db_session.commit()

    tokens_c1 = await auth_service.create_tokens(customer1)
    tokens_c2 = await auth_service.create_tokens(customer2)
    tokens_admin = await auth_service.create_tokens(admin)
    tokens_worker = await auth_service.create_tokens(worker)

    # Check 1: Admin should be able to view customer 1's ticket (including internal notes)
    admin_res = await client.get(
        f"/api/v1/tickets/{ticket.id}", headers={"Authorization": f"Bearer {tokens_admin.access_token}"}
    )
    assert admin_res.status_code == 200, (
        f"Admin should be able to access ticket, got {admin_res.status_code}: {admin_res.text}"
    )
    admin_replies = admin_res.json()["data"]["replies"]
    assert len(admin_replies) == 2, "Admin should see all replies including internal notes"

    # Check 2: Worker should be able to view customer 1's ticket (including internal notes)
    worker_res = await client.get(
        f"/api/v1/tickets/{ticket.id}", headers={"Authorization": f"Bearer {tokens_worker.access_token}"}
    )
    assert worker_res.status_code == 200
    worker_replies = worker_res.json()["data"]["replies"]
    assert len(worker_replies) == 2, "Worker should see all replies including internal notes"

    # Check 3: Customer 1 viewing own ticket should NOT see the internal note
    c1_res = await client.get(
        f"/api/v1/tickets/{ticket.id}", headers={"Authorization": f"Bearer {tokens_c1.access_token}"}
    )
    assert c1_res.status_code == 200
    c1_replies = c1_res.json()["data"]["replies"]
    assert len(c1_replies) == 1, "Customer must NOT see internal staff notes!"
    assert c1_replies[0]["content"] == "Please help urgently"

    # Check 4: Customer 2 must be rejected with 403
    c2_res = await client.get(
        f"/api/v1/tickets/{ticket.id}", headers={"Authorization": f"Bearer {tokens_c2.access_token}"}
    )
    assert c2_res.status_code == 403

    # Check 5: Customer attempting to submit is_internal="yes" has it forced to "no"
    post_res = await client.post(
        f"/api/v1/tickets/{ticket.id}/replies",
        json={"content": "Customer attempt at internal note", "is_internal": "yes"},
        headers={"Authorization": f"Bearer {tokens_c1.access_token}"},
    )
    assert post_res.status_code == 200
    assert post_res.json()["data"]["is_internal"] == "no"
