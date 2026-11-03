from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import settings
from app.middleware.cors import configure_cors


def test_production_vercel_login_preflight_allows_auth_headers(monkeypatch):
    origin = "https://skill-battle-frontend.vercel.app"
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    app = FastAPI()
    configure_cors(app)

    with TestClient(app) as client:
        response = client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == origin
        assert response.headers["access-control-allow-credentials"] == "true"
        allowed_headers = {
            header.strip().lower()
            for header in response.headers["access-control-allow-headers"].split(",")
        }
        assert {"authorization", "content-type"} <= allowed_headers

        rejected = client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": "https://untrusted.example",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        assert rejected.status_code == 400
        assert "access-control-allow-origin" not in rejected.headers
