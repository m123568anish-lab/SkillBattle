from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
resp = client.post('/auth/login', json={'email':'testuser@example.com','password':'StrongPass123!'})
print(resp.status_code)
print(resp.text)
