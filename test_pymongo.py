import os
import pymongo
from pymongo import MongoClient

mongo_url = 'mongodb+srv://vsfashiiiion:Vs12345@vs1.gtpkake.mongodb.net/'

print(f"PyMongo version: {pymongo.__version__}")
client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)

try:
    print(client.server_info())
except Exception as e:
    import traceback
    traceback.print_exc()
