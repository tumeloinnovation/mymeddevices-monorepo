"""Domain exception hierarchy for business rule violations and domain errors."""

import uuid


class DomainError(Exception):
    """Base exception for all domain and business rule errors."""

    def __init__(self, message: str, code: str = "DOMAIN_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class NotFoundError(DomainError):
    """Raised when a requested resource or entity is missing."""

    def __init__(self, entity: str = "Resource", entity_id: str | uuid.UUID | None = None):
        msg = f"{entity} not found" if not entity_id else f"{entity} with ID '{entity_id}' not found"
        super().__init__(msg, code="NOT_FOUND")


class BusinessRuleError(DomainError):
    """Raised when a business constraint or domain invariant is violated."""

    def __init__(self, message: str):
        super().__init__(message, code="BUSINESS_RULE_VIOLATION")


class AuthorizationError(DomainError):
    """Raised when user lacks permissions for an operation."""

    def __init__(self, message: str = "Operation not permitted"):
        super().__init__(message, code="FORBIDDEN")


class ConflictError(DomainError):
    """Raised when a resource state conflicts with the requested action (e.g. duplicate key)."""

    def __init__(self, message: str):
        super().__init__(message, code="RESOURCE_CONFLICT")


class ValidationError(DomainError):
    """Raised when input validation fails."""

    def __init__(self, message: str):
        super().__init__(message, code="VALIDATION_ERROR")
