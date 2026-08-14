from app.core.security import hash_password

print("Testing...")

hashed = hash_password("123456789")

print(hashed)