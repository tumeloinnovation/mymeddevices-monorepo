from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging import logger
from app.core.middleware import RequestLoggingMiddleware
from app.domains.auth.api.auth_api import router as auth_router

app = FastAPI(title="MyMedDevices API")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Include Routers
app.include_router(auth_router, prefix="/api/v1")

@app.get("/")
async def root():
    logger.info("Hello World from root!")
    return {"message": "Welcome to MyMedDevices API"}
