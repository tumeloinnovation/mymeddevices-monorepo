import json
import time
from typing import Any, Dict, Optional
from uuid import uuid4
from starlette.types import ASGIApp, Receive, Scope, Send, Message
from opentelemetry import trace
from .logging import logger

SENSITIVE_HEADERS = {"authorization", "cookie", "set-cookie"}
MAX_BODY_LOG_BYTES = 1024 * 16
SENSITIVE_BODY_KEYS = {"password", "token", "access_token", "refresh_token"}
EXCLUDED_PATHS = {"/openapi.json", "/docs", "/redoc", "/metrics"}

def get_trace_id() -> str:
    span = trace.get_current_span()
    if span and span.get_span_context().is_valid:
        return format(span.get_span_context().trace_id, "032x")
    return "n/a"

def _redact_body(data: Any) -> Any:
    if isinstance(data, dict):
        return {k: ("<redacted>" if k.lower() in SENSITIVE_BODY_KEYS else _redact_body(v)) for k, v in data.items()}
    if isinstance(data, list):
        return [_redact_body(item) for item in data]
    return data

def _safe_json_loads(b: bytes) -> Any:
    try:
        return json.loads(b.decode("utf-8"))
    except Exception:
        return b.decode("utf-8", errors="replace")

class RequestLoggingMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if (
            scope["type"] != "http" 
            or scope.get("path") in EXCLUDED_PATHS 
            or scope.get("method") == "OPTIONS"
        ):
            await self.app(scope, receive, send)
            return

        request_id = str(uuid4())
        trace_id = get_trace_id()
        ctx_logger = logger.bind(request_id=request_id, trace_id=trace_id)
        start_time = time.time()

        # Buffer the request body
        body_chunks = []
        more_body = True
        while more_body:
            message = await receive()
            if message["type"] == "http.request":
                chunk = message.get("body", b"")
                if chunk: body_chunks.append(chunk)
                more_body = message.get("more_body", False)
            else:
                # If we get something other than request (e.g. disconnect)
                # we should probably stop.
                body_chunks.append(b"")
                more_body = False

        request_body = b"".join(body_chunks)
        
        # Correct Replay Logic:
        # We've consumed the body messages. Now we need to provide them back
        # to the app, and THEN pass through any further messages (like disconnect).
        body_sent = False

        async def receive_replay() -> Message:
            nonlocal body_sent
            if not body_sent:
                body_sent = True
                return {
                    "type": "http.request",
                    "body": request_body,
                    "more_body": False
                }
            # After the body is sent, we must return the REAL messages from the stream
            # (which at this point will usually be http.disconnect)
            return await receive()

        # Log Request
        headers = {k.decode(): v.decode() for k, v in scope.get("headers", [])}
        request_info = {
            "method": scope.get("method"),
            "path": scope.get("path"),
            "headers": {k: ("<redacted>" if k.lower() in SENSITIVE_HEADERS else v) for k, v in headers.items()},
        }
        
        if request_body:
            try:
                parsed = _safe_json_loads(request_body)
                request_info["body"] = _redact_body(parsed)
            except:
                request_info["body"] = "<binary/unparseable>"

        ctx_logger.info(f"Request: {json.dumps(request_info, default=str)}")

        async def send_wrapper(message: Message) -> None:
            if message["type"] == "http.response.start":
                scope["__response_status"] = message.get("status")
            if message["type"] == "http.response.body" and not message.get("more_body", False):
                duration = time.time() - start_time
                status = scope.get("__response_status", 0)
                msg = f"Response: status={status} duration={duration:.4f}s"
                if status >= 500: ctx_logger.error(msg)
                elif status >= 400: ctx_logger.warning(msg)
                else: ctx_logger.info(msg)
            await send(message)

        await self.app(scope, receive_replay, send_wrapper)
