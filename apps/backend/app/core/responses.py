from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ApiSuccessResponse(BaseModel, Generic[T]):
    """Standard success response wrapper"""

    success: bool = True
    data: T

    model_config = ConfigDict(json_schema_extra={"example": {"success": True, "data": {}}})


class ApiErrorResponse(BaseModel):
    """Standard error response wrapper"""

    success: bool = False
    error: str
    error_code: str | None = None

    model_config = ConfigDict(
        json_schema_extra={"example": {"success": False, "error": "Error message", "error_code": "ERROR_CODE"}}
    )


def success_response(data: Any) -> dict[str, Any]:
    """Helper to create a success response"""
    return {"success": True, "data": data}


def error_response(error: str, error_code: str | None = None) -> dict[str, Any]:
    """Helper to create an error response"""
    response = {"success": False, "error": error}
    if error_code:
        response["error_code"] = error_code
    return response
