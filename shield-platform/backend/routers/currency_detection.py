"""
Currency Detection Router — Module 2
Rule-based + heuristic image analysis for demo purposes.
Production: swap with trained EfficientNet/MobileNet model.
"""

import io
import hashlib
import random
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import numpy as np

router = APIRouter()

DENOMINATIONS = [10, 20, 50, 100, 200, 500, 2000]


def _analyse_image(img: Image.Image) -> dict:
    """
    Heuristic image analysis.
    In production: replace with trained CNN inference.
    """
    img_array = np.array(img.convert("RGB"))
    h, w, _ = img_array.shape

    checks = {
        "serial_number_format":   _check_serial_region(img_array, w, h),
        "security_thread":        _check_security_thread(img_array, w, h),
        "microprint_sharpness":   _check_sharpness(img_array),
        "color_gradient":         _check_color_distribution(img_array),
        "intaglio_print":         _check_intaglio(img_array),
        "watermark_region":       _check_watermark(img_array, w, h),
    }

    passed  = sum(1 for v in checks.values() if v["passed"])
    total   = len(checks)
    confidence = round((passed / total) * 100 - random.uniform(0, 3), 1)
    confidence = max(0, min(100, confidence))

    verdict = "GENUINE" if confidence >= 70 else "COUNTERFEIT"
    denomination = random.choice(DENOMINATIONS)   # In prod: detect from model

    return {
        "verdict":          verdict,
        "confidence":       confidence,
        "denomination":     denomination,
        "checks":           checks,
        "features_passed":  passed,
        "features_total":   total,
    }


def _check_serial_region(arr, w, h):
    region = arr[:h//4, w//2:]
    brightness = float(np.mean(region))
    passed = 80 < brightness < 220
    return {"passed": passed, "detail": f"Brightness: {brightness:.1f}"}


def _check_security_thread(arr, w, h):
    strip = arr[:, w//3 : w//3 + w//12]
    variance = float(np.var(strip))
    passed = variance > 500
    return {"passed": passed, "detail": f"Thread variance: {variance:.0f}"}


def _check_sharpness(arr):
    gray = np.mean(arr, axis=2)
    laplacian_var = float(np.var(np.gradient(gray.astype(float))[0]))
    passed = laplacian_var > 100
    return {"passed": passed, "detail": f"Sharpness score: {laplacian_var:.1f}"}


def _check_color_distribution(arr):
    r_mean = float(np.mean(arr[:, :, 0]))
    g_mean = float(np.mean(arr[:, :, 1]))
    b_mean = float(np.mean(arr[:, :, 2]))
    passed = abs(r_mean - g_mean) > 5 or abs(r_mean - b_mean) > 5
    return {"passed": passed, "detail": f"RGB: ({r_mean:.0f}, {g_mean:.0f}, {b_mean:.0f})"}


def _check_intaglio(arr):
    edges = np.abs(np.diff(arr.astype(int), axis=0)).mean()
    passed = edges > 8
    return {"passed": passed, "detail": f"Edge sharpness: {edges:.2f}"}


def _check_watermark(arr, w, h):
    region = arr[:h//3, :w//4]
    brightness = float(np.mean(region))
    passed = 100 < brightness < 200
    return {"passed": passed, "detail": f"Watermark brightness: {brightness:.1f}"}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/scan")
async def scan_currency(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    img = Image.open(io.BytesIO(contents))
    result = _analyse_image(img)

    audit = {
        "timestamp":   datetime.utcnow().isoformat() + "Z",
        "model":       "rule_based_v1",
        "input_hash":  hashlib.sha256(contents).hexdigest(),
        "image_size":  f"{img.width}x{img.height}",
    }

    return {**result, "audit_trail": audit}
