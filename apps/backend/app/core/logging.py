import logging
import re
import sys
from types import FrameType

from loguru import logger as _loguru_logger

from app.core.config import settings

# Format for logs with Trace and Request ID support
LOG_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<magenta>{extra[request_id]}</magenta> | "
    "<yellow>{extra[trace_id]}</yellow> - "
    "<level>{message}</level>"
)

SENSITIVE_PATTERNS = [
    (re.compile(r'(?i)(password|secret|token|otp|api_key)\s*[:=]\s*["\']?([^"\'\s,;]+)["\']?'), r'\1="[REDACTED]"'),
    (re.compile(r"(?i)(bearer\s+)([a-zA-Z0-9_\-\.]+)"), r"\1[REDACTED]"),
]


def sanitize_message(message: str) -> str:
    """Mask sensitive credentials from log output."""
    if not isinstance(message, str):
        return message
    sanitized = message
    for pattern, repl in SENSITIVE_PATTERNS:
        sanitized = pattern.sub(repl, sanitized)
    return sanitized


def log_patcher(record):
    """Ensure request_id, trace_id and sanitized messages."""
    if "request_id" not in record["extra"]:
        record["extra"]["request_id"] = "n/a"
    if "trace_id" not in record["extra"]:
        record["extra"]["trace_id"] = "n/a"
    if "message" in record:
        record["message"] = sanitize_message(record["message"])


def setup_logging():
    # Remove default handler
    _loguru_logger.remove()

    _loguru_logger.configure(patcher=log_patcher)

    # Console handler (colored logs)
    _loguru_logger.add(
        sys.stdout,
        format=LOG_FORMAT,
        level=settings.LOG_LEVEL,
        colorize=True,
        enqueue=True,
        backtrace=True,
        diagnose=settings.ENVIRONMENT != "production",
    )

    # File handler (specifically to output.log)
    _loguru_logger.add(
        "output.log",
        format=LOG_FORMAT,
        level=settings.LOG_LEVEL,
        enqueue=True,
        backtrace=True,
        diagnose=settings.ENVIRONMENT != "production",
    )

    # Intercept standard logging
    class InterceptHandler(logging.Handler):
        def emit(self, record):
            try:
                level = _loguru_logger.level(record.levelname).name
            except ValueError:
                level = record.levelno

            frame: FrameType | None = logging.currentframe()
            depth = 2
            while frame and (
                frame.f_code.co_filename == logging.__file__ or "logging/__init__.py" in frame.f_code.co_filename
            ):
                frame = frame.f_back
                depth += 1

            message = record.getMessage()
            # Colorize Uvicorn status codes
            if record.name == "uvicorn.access":
                message = re.sub(r"(\s)([45]\d{2})(\s|$)", r"\1<red>\2</red>\3", message)
                message = re.sub(r"(\s)([23]\d{2})(\s|$)", r"\1<green>\2</green>\3", message)

            _loguru_logger.opt(depth=depth, exception=record.exc_info, colors=True).log(level, message)

    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    # Silence noisy loggers
    for name in ["uvicorn", "uvicorn.error", "fastapi"]:
        _logger = logging.getLogger(name)
        _logger.handlers = [InterceptHandler()]
        _logger.propagate = False

    return _loguru_logger


logger = setup_logging()

__all__ = ["logger", "setup_logging", "sanitize_message", "LOG_FORMAT"]
