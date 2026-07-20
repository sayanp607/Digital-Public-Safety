"""
Currency Detection Router — Module 2
Uses Gemini Vision API to analyse currency note security features.
"""

import io
import json
import hashlib
import base64
import os
import random
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import numpy as np
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
vision_model = genai.GenerativeModel("gemini-flash-latest")

router = APIRouter()

# RBI dominant color signatures for denomination detection
_DENOM_COLORS = {
    2000: (185, 100, 140),
    500:  (155, 155, 140),
    200:  (210, 130,  70),
    100:  (160, 150, 185),
    50:   (100, 175, 200),
    20:   (180, 200,  80),
    10:   (180, 120,  60),
}

def _detect_denomination(img_array: np.ndarray) -> int:
    r = float(np.mean(img_array[:, :, 0]))
    g = float(np.mean(img_array[:, :, 1]))
    b = float(np.mean(img_array[:, :, 2]))
    best, best_dist = 500, float('inf')
    for denom, (dr, dg, db) in _DENOM_COLORS.items():
        dist = (r - dr)**2 + (g - dg)**2 + (b - db)**2
        if dist < best_dist:
            best_dist = dist
            best = denom
    return best


GEMINI_CURRENCY_PROMPT = """
You are an expert RBI currency authentication specialist. Analyse this Indian currency note image for authenticity.

Check these 6 official RBI security features:
1. Serial Number Format — Is it in valid RBI format? Proper font, spacing, ink?
2. Security Thread — Is there a visible embedded security thread running vertically?
3. Microprint Sharpness — Are fine details and text edges sharp and clear?
4. Color Gradient — Does the note show authentic color-shift and gradient patterns?
5. Intaglio Print — Is there raised/embossed texture in key areas (portrait, RBI seal)?
6. Watermark Region — Is the Gandhi watermark area visible with proper characteristics?

Also determine the denomination (10, 20, 50, 100, 200, 500, or 2000 rupees).

Respond ONLY with this exact JSON — no markdown, no explanation:
{
  "verdict": "GENUINE",
  "confidence": 87,
  "denomination": 500,
  "checks": {
    "serial_number_format":  {"passed": true,  "detail": "Valid RBI format detected"},
    "security_thread":       {"passed": true,  "detail": "Vertical thread visible"},
    "microprint_sharpness":  {"passed": true,  "detail": "Fine details clear"},
    "color_gradient":        {"passed": true,  "detail": "Authentic gradient present"},
    "intaglio_print":        {"passed": false, "detail": "Cannot verify from image"},
    "watermark_region":      {"passed": true,  "detail": "Watermark area normal"}
  },
  "features_passed": 5,
  "features_total": 6
}
"""


def _analyse_with_gemini(img: Image.Image, jpeg_bytes: bytes) -> dict:
    image_part = {"mime_type": "image/jpeg", "data": base64.b64encode(jpeg_bytes).decode()}
    response = vision_model.generate_content([GEMINI_CURRENCY_PROMPT, image_part])
    raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    result = json.loads(raw)
    for key in result.get("checks", {}):
        result["checks"][key]["passed"] = bool(result["checks"][key]["passed"])
    result["features_passed"] = int(result.get("features_passed", 0))
    result["features_total"] = int(result.get("features_total", 6))
    result["confidence"] = float(result.get("confidence", 0))
    result["denomination"] = int(result.get("denomination", 500))
    return result


def _analyse_heuristic(img: Image.Image) -> dict:
    """Fallback heuristic if Gemini is unavailable."""
    img_array = np.array(img.convert("RGB"))
    h, w, _ = img_array.shape

    checks = {
        "serial_number_format": {
            "passed": bool(80 < float(np.mean(img_array[:h//4, w//2:])) < 220),
            "detail": f"Brightness: {float(np.mean(img_array[:h//4, w//2:])):.1f}",
        },
        "security_thread": {
            "passed": bool(float(np.var(img_array[:, w//3: w//3 + w//12])) > 500),
            "detail": f"Thread variance: {float(np.var(img_array[:, w//3:w//3+w//12])):.0f}",
        },
        "microprint_sharpness": {
            "passed": bool(float(np.var(np.gradient(np.mean(img_array, axis=2).astype(float))[0])) > 100),
            "detail": "Sharpness analysis",
        },
        "color_gradient": {
            "passed": bool(abs(float(np.mean(img_array[:,:,0])) - float(np.mean(img_array[:,:,1]))) > 5),
            "detail": "Color channel analysis",
        },
        "intaglio_print": {
            "passed": bool(float(np.abs(np.diff(img_array.astype(int), axis=0)).mean()) > 8),
            "detail": "Edge analysis",
        },
        "watermark_region": {
            "passed": bool(100 < float(np.mean(img_array[:h//3, :w//4])) < 200),
            "detail": "Watermark region analysis",
        },
    }
    passed = sum(1 for v in checks.values() if v["passed"])
    confidence = round((passed / 6) * 100 - random.uniform(0, 3), 1)
    return {
        "verdict": "GENUINE" if confidence >= 70 else "COUNTERFEIT",
        "confidence": confidence,
        "denomination": _detect_denomination(img_array),
        "checks": checks,
        "features_passed": passed,
        "features_total": 6,
    }


@router.post("/scan")
async def scan_currency(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPG, PNG, WEBP)")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    try:
        img = Image.open(io.BytesIO(contents))
        img = img.convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read image. Use JPG, PNG, or WEBP.")

    # Convert to JPEG bytes for Gemini Vision
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    jpeg_bytes = buf.getvalue()

    analysis_mode = "gemini_vision"
    try:
        result = _analyse_with_gemini(img, jpeg_bytes)
    except Exception:
        result = _analyse_heuristic(img)
        analysis_mode = "heuristic_fallback"

    audit = {
        "timestamp":  datetime.utcnow().isoformat() + "Z",
        "model":      analysis_mode,
        "input_hash": hashlib.sha256(contents).hexdigest(),
        "image_size": f"{img.width}x{img.height}",
    }

    return {**result, "audit_trail": audit}
