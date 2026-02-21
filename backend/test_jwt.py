import jwt
import os
from datetime import datetime, timezone, timedelta

SECRET_KEY = "vs-fashion-secret-key-2024"
to_encode = {"test": "data"}
expire = datetime.now(timezone.utc) + timedelta(days=7)
to_encode.update({"exp": expire})

try:
    token = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    print(f"Token: {token}")
    print(f"Type: {type(token)}")
except Exception as e:
    import traceback
    traceback.print_exc()
