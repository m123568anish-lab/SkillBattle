import sqlite3
import requests
from pathlib import Path

BASE = Path(__file__).resolve().parent
DB_PATH = (BASE.parent / "skillbattle.db").resolve()
API_URL = "http://localhost:8000"

ACCOUNTS = [
    {
        "username": "platformadmin",
        "email": "platformadmin@skillbattle.app",
        "full_name": "Platform Admin",
        "password": "StrongPass123!",
        "account_type": "STUDENT",
        "role": "admin",
        "is_superuser": 1,
        "status": "ACTIVE",
        "account_type_db": "STUDENT",
    },
    {
        "username": "collegeadmin",
        "email": "collegeadmin@skillbattle.app",
        "full_name": "College Admin",
        "password": "StrongPass123!",
        "account_type": "COLLEGE",
        "role": "college_admin",
        "is_superuser": 0,
        "status": "ACTIVE",
        "account_type_db": "COLLEGE",
    },
    {
        "username": "companyadmin",
        "email": "companyadmin@skillbattle.app",
        "full_name": "Company Admin",
        "password": "StrongPass123!",
        "account_type": "COMPANY",
        "role": "company_admin",
        "is_superuser": 0,
        "status": "ACTIVE",
        "account_type_db": "COMPANY",
    },
    {
        "username": "studentdemo",
        "email": "studentdemo@skillbattle.app",
        "full_name": "Student Demo",
        "password": "StrongPass123!",
        "account_type": "STUDENT",
        "role": "student",
        "is_superuser": 0,
        "status": "ACTIVE",
        "account_type_db": "STUDENT",
    },
]


def ensure_account(payload):
    r = requests.post(f"{API_URL}/auth/register", json={
        "username": payload["username"],
        "email": payload["email"],
        "full_name": payload["full_name"],
        "password": payload["password"],
        "account_type": payload["account_type"],
    }, timeout=25)
    print(f"REGISTER {payload['email']} -> {r.status_code} {r.text[:220]}")
    return r


conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()
for payload in ACCOUNTS:
    ensure_account(payload)
    cur.execute(
        """
        UPDATE users
        SET role = ?, account_type = ?, status = ?, is_active = 1, is_verified = 1,
            is_superuser = ?, requested_role = NULL, onboarding_completed = 1
        WHERE email = ?
        """,
        (payload["role"], payload["account_type_db"], payload["status"], payload["is_superuser"], payload["email"]),
    )
    conn.commit()

for payload in ACCOUNTS:
    r = requests.post(f"{API_URL}/auth/login", json={
        "email": payload["email"],
        "password": payload["password"],
        "role": payload["role"].upper(),
    }, timeout=25)
    print(f"LOGIN {payload['email']} -> {r.status_code} {r.text[:300]}")

print("\nDemo accounts ready:")
for payload in ACCOUNTS:
    print(f"{payload['role']}: {payload['email']} / {payload['password']}")

conn.close()
