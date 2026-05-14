import base64
import json
from PIL import Image
import io
import cv2
import numpy as np
from openai import OpenAI

def test_vlm_cropping():
    # ----------------------------
    # Configuration
    # ----------------------------
    IMAGE_PATH = r"C:\\smart-boss-files\\vlm_croping\\WhatsApp Image 2026-02-01 at 08.49.36.jpeg"
    MODEL_NAME = "gpt-5.2"
    OUTPUT_IMAGE_PATH = r"C:\\smart-boss-files\\vlm_croping\\scale_display_crop.png"

    client = OpenAI(api_key="sk-xxxx")

    # ----------------------------
    # Load and encode image
    # ----------------------------
    with open(IMAGE_PATH, "rb") as f:
        image_bytes = f.read()

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    # ----------------------------
    # Prompt
    # ----------------------------
    prompt = """
You are an industrial vision localization system.
Your task is precise spatial localization, not description.

SCENE CONTEXT:
The image shows a commercial restaurant or institutional kitchen work station.
The environment is dominated by stainless steel surfaces:
- Stainless steel wall panels behind the objects
- A stainless steel shelf or counter surface
- Visible screws, joints, and industrial fittings
Lighting is uniform and causes mild reflections on metal surfaces.

PRIMARY ANCHOR OBJECT:
On the stainless steel shelf there is a DIGITAL FOOD SCALE.
The scale is a standalone device resting on the shelf, not mounted to the wall.

SCALE STRUCTURE (OBSERVED):
The scale has two main visible parts:

1. TOP PLATFORM:
- A flat rectangular stainless steel weighing platform
- Metallic silver color
- Slightly worn, with scratches and stains
- Located above the display area

2. FRONT CONTROL PANEL:
- A dark-colored (dark blue or near-black) front panel
- Contains one illuminated display window
- Contains printed labels and round buttons outside the display window

DISPLAY WINDOW – CRITICAL VISUAL ANCHOR:
The digital display window has the following exact characteristics:

- Rectangular shape
- Oriented horizontally (not rotated)
- Contains bright RED LED numeric digits (7-segment style)
- Digits are clearly illuminated and highly saturated red
- Digits are shown on a dark (black or very dark) background
- The dark background area is fully surrounded by a THIN, LIGHT-COLORED rectangular frame
  (white or light gray)
- This thin light-colored frame defines the TRUE outer boundary of the display window

IMMEDIATE SURROUNDINGS (NEGATIVE CONTEXT):
Immediately OUTSIDE the light-colored frame:
- A dark control panel surface
- Printed text or labels (e.g. model name such as "SUPER-SS")
- Circular buttons or icons
- These elements are NOT illuminated
- These elements are NOT part of the display window

TARGET DEFINITION (VERY IMPORTANT):
Your target is the FULL DISPLAY WINDOW, defined as:
- The red illuminated digits
- The dark background behind the digits
- AND the thin light-colored rectangular frame around them

The display window is a self-contained visual unit.
Printed text, labels, buttons, or branding are NOT part of the display window.

BOUNDARY RULES:
- The rectangle MUST align with the OUTER edge of the light-colored frame
- The entire frame must be inside the rectangle
- No printed text, branding, or buttons may appear inside the rectangle
- The top edge of the rectangle MUST stop at the top edge of the light-colored frame
- The rectangle must not extend upward into any printed brand name or label

ORIENTATION / SKEW RULES:
- The display window is horizontally aligned
- The rectangle must be axis-aligned (no rotation)
- Do NOT return a rotated or diagonal rectangle
- If the camera angle causes perspective distortion, still return an axis-aligned rectangle
  that best fits the outer frame

CROPPING RULES:
- Create ONE rectangle tightly surrounding the entire display window
- Prefer slightly more padding over cutting any part of the frame
- All red digits must be fully inside the rectangle
- No digit may touch or cross the rectangle border

VALIDATION RULES:
- Bright red numeric digits MUST be clearly visible inside the rectangle
- The thin light-colored frame MUST be visible on all four sides
- A rectangle around digits without the surrounding frame is INVALID
- A rectangle that includes printed text or buttons is INVALID
- The rectangle must be located on the scale, not on walls or metal panels

FAILURE MODE:
If you cannot clearly and confidently identify:
- Red illuminated digits
- AND the surrounding thin light-colored rectangular frame
return exactly:
{ "rectangle": null }

OUTPUT FORMAT:
Return ONLY valid JSON.
No explanations.
No additional fields.

JSON SCHEMA:
{
  "rectangle": {
    "x": <int>,
    "y": <int>,
    "width": <int>,
    "height": <int>
  }
}

    """

    # ----------------------------
    # Call OpenAI Vision API
    # ----------------------------
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_b64}"
                        }
                    }
                ],
            }
        ],
        temperature=0.0
    )

    # ----------------------------
    # Parse JSON response
    # ----------------------------
    content = response.choices[0].message.content
    data = json.loads(content)

    rect = data["rectangle"]
    x = rect["x"]
    y = rect["y"]
    w = rect["width"]
    h = rect["height"]

    # ----------------------------
    # Crop image using rectangle
    # ----------------------------
    image = Image.open(IMAGE_PATH).convert("RGB")
    cropped = image.crop((x, y, x + w, y + h))
    cropped.save(OUTPUT_IMAGE_PATH)

    print("Rectangle:", rect)
    print("Cropped image saved to:", OUTPUT_IMAGE_PATH)

    # ----------------------------
    # Refine crop using OpenCV (white frame detection)
    # ----------------------------
    OPENCV_OUTPUT_PATH = r"C:\\smart-boss-files\\vlm_croping\\scale_display_crop_opencv.png"

    rx, ry, rw, rh = crop_by_white_frame_opencv(
        OUTPUT_IMAGE_PATH,
        OPENCV_OUTPUT_PATH
    )

    print("OpenCV refined rectangle:", {"x": rx, "y": ry, "width": rw, "height": rh})
    print("OpenCV cropped image saved to:", OPENCV_OUTPUT_PATH)


def crop_by_white_frame_opencv(input_image_path: str, output_image_path: str):
    """
    Receives an image cropped by the VLM and refines the crop
    by detecting the thin white rectangular frame around the digits.
    """

    # Load image with OpenCV
    img = cv2.imread(input_image_path)
    if img is None:
        raise ValueError("Failed to load image for OpenCV processing")

    # Convert to HSV for robust white detection
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # White / light-gray range (tuned for thin display frames)
    lower_white = np.array([0, 0, 180])
    upper_white = np.array([180, 60, 255])
    mask = cv2.inRange(hsv, lower_white, upper_white)

    # Morphological cleanup to connect thin frame lines
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise ValueError("No white frame contour detected")

    # Select the largest contour (assumed to be the display frame)
    c = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(c)

    # Safety padding (small, to avoid cutting the frame)
    pad = 2
    x = max(0, x - pad)
    y = max(0, y - pad)
    w = min(img.shape[1] - x, w + 2 * pad)
    h = min(img.shape[0] - y, h + 2 * pad)

    # Crop and save
    refined = img[y:y + h, x:x + w]
    cv2.imwrite(output_image_path, refined)

    return x, y, w, h
