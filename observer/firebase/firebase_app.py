import firebase_admin
from firebase_admin import credentials, storage

_app = None

def get_firebase_app():
    global _app
    if _app is None:
        cred = credentials.Certificate(
            "firebase/serviceAccountKey.json"
        )
        _app = firebase_admin.initialize_app(
            cred,
            {
                "storageBucket": "smart-boss-a771e.firebasestorage.app"
            }
        )
    return _app
