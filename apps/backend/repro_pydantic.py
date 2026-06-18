from pydantic import ValidationError
from app.domains.auth.schemas.auth_schemas import UserCreate

try:
    UserCreate(
        email="test@example.com",
        password="short",
        first_name="Test",
        last_name="User"
    )
except ValidationError as e:
    for error in e.errors():
        print(f"Location: {error['loc']}, Message: {error['msg']}, Type: {error['type']}")

print("\n--- Testing empty password ---")
try:
    UserCreate(
        email="test@example.com",
        password="",
        first_name="Test",
        last_name="User"
    )
except ValidationError as e:
    for error in e.errors():
        print(f"Location: {error['loc']}, Message: {error['msg']}, Type: {error['type']}")
