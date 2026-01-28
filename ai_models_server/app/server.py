from fastapi import FastAPI
from app.lifecycle import load_all_models
from api.vision_routes import router as vision_router

app = FastAPI()

@app.on_event("startup")
def startup_event():
    load_all_models()

app.include_router(vision_router, prefix="/vision")
