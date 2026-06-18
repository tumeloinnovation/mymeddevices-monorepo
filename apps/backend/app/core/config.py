import os
import sys
from typing import Optional
from pydantic import model_validator
from pydantic_settings import BaseSettings

# Determine environment to select appropriate env file
# Default to "development" if not set
env_name = os.getenv("ENVIRONMENT", "development").lower()

env_file = ".env"
if env_name == "production":
    env_file = ".env.production"
elif env_name == "staging":
    env_file = ".env.staging"
elif env_name == "testing":
    env_file = ".env.testing"
elif env_name == "development":
    env_file = ".env.development"

# Fall back to ".env" if the environment-specific file doesn't exist
if not os.path.exists(env_file) and os.path.exists(".env"):
    env_file = ".env"

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"

    # Database Settings
    DATABASE_URL: str = ""
    ECHO_SQL: bool = False
    
    # Database Pool Settings
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 1800  # 30 minutes
    DB_POOL_PRE_PING: bool = True

    # Logging Settings
    LOG_LEVEL: str = "INFO"
    SHOW_SQL_QUERIES: bool = True

    # Security Settings
    SECRET_KEY: str = ""  # Default empty, validated at runtime
    JWT_PRIVATE_KEY: Optional[str] = None
    JWT_PUBLIC_KEY: Optional[str] = None
    ALGORITHM: str = "RS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # HostPinnacle SMS Settings
    HOSTPINNACLE_API_KEY: Optional[str] = None
    HOSTPINNACLE_PARTNER_ID: Optional[str] = None
    HOSTPINNACLE_SENDER_ID: str = "MyMed"

    # SMTP Email Settings
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = False
    SMTP_USE_SSL: bool = False
    FROM_EMAIL: str = "MyMed <noreply@mymeddevices.com>"
    REPLY_TO_EMAIL: Optional[str] = "support@mymeddevices.com"
    EMAIL_LOGO_URL: str = ""

    # Catalog Settings
    DEFAULT_CURRENCY: str = "KES"
    MARKUP_PERCENT_LOW: float = 5.0
    MARKUP_PERCENT_MEDIUM: float = 3.0
    MARKUP_PERCENT_HIGH: float = 2.0
    MARKUP_THRESHOLD_LOW: float = 10000.0
    MARKUP_THRESHOLD_MEDIUM: float = 50000.0
    COMMISSION_FEE_PERCENT: float = 2.0
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-pro"
    UPLOAD_DIR: str = "static/uploads/products"
    AVATAR_UPLOAD_DIR: str = "static/uploads/avatars"

    # Typesense Settings
    TYPESENSE_HOST: str = "localhost"
    TYPESENSE_PORT: int = 8108
    TYPESENSE_PROTOCOL: str = "http"
    TYPESENSE_API_KEY: str = ""

    # Google Maps API Settings
    GOOGLE_MAPS_API_KEY: Optional[str] = None

    # Redis (Rate Limiting)
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"

    # Request size limits (Default: 10MB)
    MAX_CONTENT_LENGTH: int = 10 * 1024 * 1024

    # Site URL (for email templates, etc.)
    SITE_URL: Optional[str] = None

    model_config = {
        "env_file": env_file,
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

    @model_validator(mode="after")
    def validate_settings(self) -> "Settings":
        # Check if running under pytest
        is_testing = "pytest" in sys.modules or "unittest" in sys.modules
        
        # Enforce keys in production/staging
        if self.ENVIRONMENT in ("production", "staging") and not is_testing:
            if not self.JWT_PRIVATE_KEY:
                raise ValueError("JWT_PRIVATE_KEY must be configured in production/staging environment.")
            if not self.JWT_PUBLIC_KEY:
                raise ValueError("JWT_PUBLIC_KEY must be configured in production/staging environment.")
        
        # Auto-generate RSA key pair for local dev/testing if not provided
        if not self.JWT_PRIVATE_KEY or not self.JWT_PUBLIC_KEY:
            try:
                from cryptography.hazmat.primitives.asymmetric import rsa
                from cryptography.hazmat.primitives import serialization
                
                private_key = rsa.generate_private_key(
                    public_exponent=65537,
                    key_size=2048
                )
                
                if not self.JWT_PRIVATE_KEY:
                    self.JWT_PRIVATE_KEY = private_key.private_bytes(
                        encoding=serialization.Encoding.PEM,
                        format=serialization.PrivateFormat.PKCS8,
                        encryption_algorithm=serialization.NoEncryption()
                    ).decode("utf-8")
                
                if not self.JWT_PUBLIC_KEY:
                    self.JWT_PUBLIC_KEY = private_key.public_key().public_bytes(
                        encoding=serialization.Encoding.PEM,
                        format=serialization.PublicFormat.SubjectPublicKeyInfo
                    ).decode("utf-8")
            except Exception as e:
                # If cryptography isn't loaded or fails, we fail safely
                raise RuntimeError(f"Failed to auto-generate RSA key pair: {e}")

        if not is_testing:
            if not self.DATABASE_URL:
                raise ValueError("DATABASE_URL must be configured and cannot be empty in a non-testing environment.")
            if not self.SECRET_KEY or self.SECRET_KEY == "your-secret-key-here-generate-with-secrets-module":
                raise ValueError("SECRET_KEY must be configured and cannot be empty or default in a non-testing environment.")
            if len(self.SECRET_KEY) < 32:
                raise ValueError("SECRET_KEY must be at least 32 characters long for security.")
            if self.ENVIRONMENT == "production":
                if not self.REDIS_URL:
                    raise ValueError("REDIS_URL must be configured in a production environment.")
        return self

settings = Settings()
