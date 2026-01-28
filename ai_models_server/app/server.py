from fastapi import FastAPI
from app.lifecycle import load_all_models
from api.vision_routes import router as vision_router
from api.vlm_routes import router as vlm_router

app = FastAPI()

@app.on_event("startup")
def startup_event():
    load_all_models()

app.include_router(vision_router, prefix="/vision")
app.include_router(vlm_router, prefix="/vlm")
