import io

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from PIL import Image

from services.vlm_service import generate_vlm_text


router = APIRouter()


@router.post("/generate")
async def generate(prompt: str = Form(...), image: UploadFile = File(...), max_new_tokens: int = Form(128)):
    try:
        image_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}")

    try:
        text = generate_vlm_text(prompt=prompt, image=pil_image, max_new_tokens=max_new_tokens)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"text": text}
