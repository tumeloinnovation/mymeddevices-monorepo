"""Assignment lifecycle schemas."""

from pydantic import BaseModel, Field


class AssignmentDecision(BaseModel):
    decision: str = Field(pattern="^(accepted|rejected)$")
    reason: str | None = Field(default=None, max_length=500)


class FailedAttempt(BaseModel):
    reason: str = Field(min_length=3, max_length=500)
