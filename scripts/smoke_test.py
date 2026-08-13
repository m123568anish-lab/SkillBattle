"""Simple smoke test for API flows: register -> login -> refresh -> dashboard

Run from the repo root with the backend running at http://localhost:8000
"""
import requests
import time
import uuid
import sys

# Try both localhost and 127.0.0.1 to avoid potential name resolution issues
BASE = "http://127.0.0.1:8000/api/v1"


def wait_for_backend(timeout=60):
    print("Waiting for backend...")
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(BASE + "/health", timeout=2)
            print("health ->", r.status_code, r.json())
            return True
        except Exception as e:
            print("backend not ready yet:", e)
            time.sleep(1)
    # If /health did not respond, try a lightweight probe against register
    print("/health timed out; attempting probe register")
    return probe_register()


def probe_register():
    """Try a quick register to probe the API when /health is unreliable."""
    try:
        resp = requests.post(BASE + "/auth/register", json={
            "username": "probe",
            "email": "probe@example.com",
            "full_name": "Probe",
            "password": "password123",
        }, timeout=3)
        print("probe register ->", resp.status_code)
        # 200/201/400 indicate the service is responding (400 if probe exists)
        return resp.status_code in (200, 201, 400)
    except Exception as e:
        print("probe register failed:", e)
        return False


def register_user(email):
    payload = {
        "username": email.split("@")[0],
        "email": email,
        "full_name": "Smoke Test",
        "password": "password123",
    }
    r = requests.post(BASE + "/auth/register", json=payload)
    print("register ->", r.status_code, r.text)
    return r


def login_user(email):
    payload = {"email": email, "password": "password123"}
    r = requests.post(BASE + "/auth/login", json=payload)
    print("login ->", r.status_code, r.text)
    return r


def refresh_token(refresh_token):
    r = requests.post(BASE + "/auth/refresh", json={"refresh_token": refresh_token})
    print("refresh ->", r.status_code, r.text)
    return r


def get_dashboard(access_token):
    headers = {"Authorization": f"Bearer {access_token}"}
    r = requests.get(BASE + "/dashboard", headers=headers)
    print("dashboard ->", r.status_code, r.text)
    return r


def main():
    ok = wait_for_backend(30)
    if not ok:
        print("Backend did not become ready")
        sys.exit(2)

    unique = str(uuid.uuid4())[:8]
    email = f"smoke_{unique}@example.com"

    r = register_user(email)
    if r.status_code not in (200, 201):
        # If already exists, continue
        print("Register failed")

    r = login_user(email)
    if r.status_code != 200:
        print("Login failed")
        sys.exit(3)

    body = r.json()
    token = body.get("access_token") or (body.get("tokens") or {}).get("access_token")
    refresh = body.get("refresh_token") or (body.get("tokens") or {}).get("refresh_token")

    if not token:
        print("No access token returned")
        sys.exit(4)

    # call dashboard
    d = get_dashboard(token)
    if d.status_code != 200:
        print("Dashboard failed")
        sys.exit(5)

    # refresh
    if refresh:
        rf = refresh_token(refresh)
        if rf.status_code != 200:
            print("Refresh failed")
            sys.exit(6)

    print("SMOKE TESTS PASSED")


if __name__ == "__main__":
    main()
