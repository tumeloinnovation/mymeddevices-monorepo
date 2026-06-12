import sys
import logging
import re
from pathlib import Path
from loguru import logger
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

def log_patcher(record):
    """Ensure request_id and trace_id are always present in the record."""
    if "request_id" not in record["extra"]:
        record["extra"]["request_id"] = "n/a"
    if "trace_id" not in record["extra"]:
        record["extra"]["trace_id"] = "n/a"

def setup_logging():
    # Remove default handler
    logger.remove()

    # Console handler (colored logs)
    logger.add(
        sys.stdout,
        format=LOG_FORMAT,
        level=settings.LOG_LEVEL,
        colorize=True,
        enqueue=True,
        backtrace=True,
        diagnose=True,
    )

    # Intercept standard logging
    class InterceptHandler(logging.Handler):
        def emit(self, record):
            try:
                level = logger.level(record.levelname).name
            except ValueError:
                level = record.levelno

            frame, depth = logging.currentframe(), 2
            while frame and (frame.f_code.co_filename == logging.__file__ or "logging/__init__.py" in frame.f_code.co_filename):
                frame = frame.f_back
                depth += 1

            message = record.getMessage()
            # Colorize Uvicorn status codes
            if record.name == "uvicorn.access":
                message = re.sub(r'(\s)([45]\d{2})(\s|$)', r'\1<red>\2</red>\3', message)
                message = re.sub(r'(\s)([23]\d{2})(\s|$)', r'\1<green>\2</green>\3', message)

            logger.opt(depth=depth, exception=record.exc_info, colors=True).log(level, message)

    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Silence noisy loggers
    for name in ["uvicorn", "uvicorn.error", "fastapi"]:
        _logger = logging.getLogger(name)
        _logger.handlers = [InterceptHandler()]
        _logger.propagate = False

    return logger.patch(log_patcher)

logger = setup_logging()
