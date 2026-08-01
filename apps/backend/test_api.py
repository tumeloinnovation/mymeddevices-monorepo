import httpx
import asyncio

BASE_URL = "http://localhost:8000"

async def test_complete_registration():
    """Test completing registration"""
    url = f"{BASE_URL}/api/v1/auth/register/complete"
    data = {
        "email": "customer@mymeddevices.com",
        "password": "Customer@Pass!123",
        "first_name": "Test",
        "last_name": "Customer",
        "phone": "+254712345678"
    }

    print(f"Testing complete registration: {data}")
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        try:
            response_json = response.json()
            print(f"Response JSON: {json.dumps(response_json, indent=2)}")
        except:
            print("Could not parse JSON response")

        return response

if __name__ == "__main__":
    asyncio.run(test_complete_registration())
