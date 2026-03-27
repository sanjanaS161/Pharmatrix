from passlib.context import CryptContext

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = pwd_context.hash("testpassword")
    print(f"Hashed: {hashed}")
    verified = pwd_context.verify("testpassword", hashed)
    print(f"Verified: {verified}")
except Exception as e:
    print(f"Error: {e}")
