"""Generates a secure SECRET_KEY for use in .env.production

Usage:
    python scripts/generate_secret.py
"""
import secrets
import base64


def generate_key(length=48):
    return base64.urlsafe_b64encode(secrets.token_bytes(length)).decode()


if __name__ == "__main__":
    print(generate_key())
