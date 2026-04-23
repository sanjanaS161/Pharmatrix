import requests

url = "http://127.0.0.1:8001/auth/register"
data = {
    "username": "testuser4",
    "email": "test4@example.com",
    "phone_number": "+911234567893",
    "password": "testpassword"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
