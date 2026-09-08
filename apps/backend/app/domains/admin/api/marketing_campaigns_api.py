import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.admin.models import CampaignStatus, EmailCampaign, SmsCampaign
from app.domains.auth.models.user import User

router = APIRouter(prefix="/admin/marketing", tags=["Admin Marketing Campaigns"])


# --- Schemas ---
class SmsCampaignCreate(BaseModel):
    title: str = Field(..., max_length=255)
    message: str = Field(..., min_length=1)
    sender_id: str = Field(default="MYMEDDEVICE", max_length=50)
    target_audience: str = Field(default="all", max_length=50)
    scheduled_at: datetime | None = None


class SmsCampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    message: str
    sender_id: str
    target_audience: str
    recipient_count: int
    status: CampaignStatus
    scheduled_at: datetime | None = None
    sent_at: datetime | None = None
    cost_kes: Decimal
    created_at: datetime
    updated_at: datetime


class EmailCampaignCreate(BaseModel):
    title: str = Field(..., max_length=255)
    subject: str = Field(..., max_length=255)
    preview_text: str | None = None
    html_content: str = Field(...)
    target_audience: str = Field(default="all", max_length=50)
    scheduled_at: datetime | None = None


class EmailCampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    subject: str
    preview_text: str | None = None
    html_content: str
    target_audience: str
    recipient_count: int
    open_count: int
    click_count: int
    status: CampaignStatus
    scheduled_at: datetime | None = None
    sent_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


# --- SMS Endpoints ---

@router.get("/sms-campaigns", response_model=ApiSuccessResponse[list[SmsCampaignResponse]])
async def list_sms_campaigns(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    count_res = await db.execute(select(func.count(SmsCampaign.id)))
    count_res.scalar() or 0

    stmt = select(SmsCampaign).order_by(desc(SmsCampaign.created_at)).offset(offset).limit(page_size)
    res = await db.execute(stmt)
    campaigns = list(res.scalars().all())

    return success_response(campaigns)


@router.post("/sms-campaigns", response_model=ApiSuccessResponse[SmsCampaignResponse], status_code=status.HTTP_201_CREATED)
async def create_sms_campaign(
    data: SmsCampaignCreate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    # Calculate recipient estimate based on target audience
    audience_query = select(func.count(User.id)).where(User.phone.isnot(None))
    if data.target_audience == "customers":
        audience_query = audience_query.where(User.role == "customer")
    elif data.target_audience == "vendors":
        audience_query = audience_query.where(User.role == "vendor")

    recipients_res = await db.execute(audience_query)
    recipients = recipients_res.scalar() or 0
    estimated_cost = Decimal(str(recipients * 0.80))  # KES 0.80 per SMS rate

    campaign = SmsCampaign(
        id=uuid.uuid4(),
        title=data.title,
        message=data.message,
        sender_id=data.sender_id,
        target_audience=data.target_audience,
        recipient_count=recipients,
        status=CampaignStatus.SCHEDULED if data.scheduled_at else CampaignStatus.DRAFT,
        scheduled_at=data.scheduled_at,
        cost_kes=estimated_cost,
        created_by_id=current_user.id,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return success_response(campaign)


@router.post("/sms-campaigns/{campaign_id}/send", response_model=ApiSuccessResponse[SmsCampaignResponse])
async def send_sms_campaign(
    campaign_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SmsCampaign).where(SmsCampaign.id == campaign_id)
    res = await db.execute(stmt)
    campaign = res.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SMS Campaign not found")

    campaign.status = CampaignStatus.SENT
    campaign.sent_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(campaign)
    return success_response(campaign)


@router.delete("/sms-campaigns/{campaign_id}", status_code=status.HTTP_200_OK)
async def delete_sms_campaign(
    campaign_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SmsCampaign).where(SmsCampaign.id == campaign_id)
    res = await db.execute(stmt)
    campaign = res.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SMS Campaign not found")

    await db.delete(campaign)
    await db.commit()
    return success_response({"message": "SMS Campaign deleted successfully"})


# --- Email Endpoints ---

@router.get("/email-campaigns", response_model=ApiSuccessResponse[list[EmailCampaignResponse]])
async def list_email_campaigns(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    count_res = await db.execute(select(func.count(EmailCampaign.id)))
    count_res.scalar() or 0

    stmt = select(EmailCampaign).order_by(desc(EmailCampaign.created_at)).offset(offset).limit(page_size)
    res = await db.execute(stmt)
    campaigns = list(res.scalars().all())

    return success_response(campaigns)


@router.post("/email-campaigns", response_model=ApiSuccessResponse[EmailCampaignResponse], status_code=status.HTTP_201_CREATED)
async def create_email_campaign(
    data: EmailCampaignCreate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    audience_query = select(func.count(User.id)).where(User.email.isnot(None))
    if data.target_audience == "customers":
        audience_query = audience_query.where(User.role == "customer")
    elif data.target_audience == "vendors":
        audience_query = audience_query.where(User.role == "vendor")

    recipients_res = await db.execute(audience_query)
    recipients = recipients_res.scalar() or 0

    campaign = EmailCampaign(
        id=uuid.uuid4(),
        title=data.title,
        subject=data.subject,
        preview_text=data.preview_text,
        html_content=data.html_content,
        target_audience=data.target_audience,
        recipient_count=recipients,
        status=CampaignStatus.SCHEDULED if data.scheduled_at else CampaignStatus.DRAFT,
        scheduled_at=data.scheduled_at,
        created_by_id=current_user.id,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return success_response(campaign)


@router.post("/email-campaigns/{campaign_id}/send", response_model=ApiSuccessResponse[EmailCampaignResponse])
async def send_email_campaign(
    campaign_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    stmt = select(EmailCampaign).where(EmailCampaign.id == campaign_id)
    res = await db.execute(stmt)
    campaign = res.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email Campaign not found")

    campaign.status = CampaignStatus.SENT
    campaign.sent_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(campaign)
    return success_response(campaign)


@router.delete("/email-campaigns/{campaign_id}", status_code=status.HTTP_200_OK)
async def delete_email_campaign(
    campaign_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    stmt = select(EmailCampaign).where(EmailCampaign.id == campaign_id)
    res = await db.execute(stmt)
    campaign = res.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email Campaign not found")

    await db.delete(campaign)
    await db.commit()
    return success_response({"message": "Email Campaign deleted successfully"})
