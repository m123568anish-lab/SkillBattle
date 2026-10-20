from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import settings
from app.middleware.cors import configure_cors


def test_production_cors_rejects_unconfigured_hosting_origins(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "ALLOWED_ORIGINS", "https://skill-battle-one.vercel.app")

    app = FastAPI()
    configure_cors(app)

    @app.get("/health")
    def health():
        return {"ok": True}

    client = TestClient(app)
    allowed = client.options(
        "/health",
        headers={
            "Origin": "https://skill-battle-one.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    rejected = client.options(
        "/health",
        headers={
            "Origin": "https://untrusted.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert allowed.headers["access-control-allow-origin"] == "https://skill-battle-one.vercel.app"
    assert "access-control-allow-origin" not in rejected.headers
