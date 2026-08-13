import sys, random
sys.path.insert(0, ".")
from app.main import app
from fastapi.testclient import TestClient
paths = ["/api/v1/auth/register", "/auth/auth/register", "/api/v1/api/v1/auth/api/v1/auth/register", "/auth/register"]
payload = {
    "username": f"testuser{random.randint(100000,999999)}",
    "full_name": "Test User",
    "email": f"testuser{random.randint(100000,999999)}@example.com",
    "password": "Password123!",
}
print("payload", payload)
with TestClient(app) as client:
    for p in paths:
        r = client.post(p, json=payload)
        print(p, r.status_code, r.text)

