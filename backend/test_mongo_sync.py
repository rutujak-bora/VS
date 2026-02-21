import pymongo
import os
import certifi
from dotenv import load_dotenv

load_dotenv()

def test_conn():
    try:
        url = os.environ.get('MONGO_URL')
        print(f"Connecting to {url[:20]}...")
        client = pymongo.MongoClient(url, tlsCAFile=certifi.where())
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        print("Connected successfully using pymongo and certifi!")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_conn()
