"""
Scam Detection Router — Module 1 + Module 5 (Chatbot)
"""

import json
import hashlib
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ai.gemini_client import ask_gemini

router = APIRouter()


# ── Request / Response models ─────────────────────────────────────────────────

class ScamAnalysisRequest(BaseModel):
    text: str
    language: str = "en"   # "en" or "hi"


class ChatRequest(BaseModel):
    message: str
    language: str = "en"


# ── Scam Detector ─────────────────────────────────────────────────────────────

SCAM_ANALYSIS_PROMPT = """
You are an expert digital fraud analyst for the Indian government. Analyse the following text/transcript for digital arrest scam patterns.

Known patterns:
- Impersonating CBI, ED, Customs, Police, Supreme Court
- Claiming victim has a package/account/Aadhaar linked to illegal activity
- Demanding secrecy ("don't tell family")
- Demanding money transfer to "safe account"
- Threatening arrest within hours
- Using video call to simulate official environment

TEXT TO ANALYSE:
\"\"\"
{text}
\"\"\"

Respond ONLY with valid JSON in this exact format:
{{
  "risk_score": <integer 0-100>,
  "verdict": "<SCAM | SUSPICIOUS | SAFE>",
  "patterns_detected": ["<pattern1>", "<pattern2>"],
  "triggered_phrases": ["<phrase1>", "<phrase2>"],
  "explanation": "<2-3 sentence plain English explanation>",
  "recommended_action": "<what the user should do right now>"
}}
"""

@router.post("/analyse")
async def analyse_scam(req: ScamAnalysisRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    prompt = SCAM_ANALYSIS_PROMPT.format(text=req.text)
    raw = ask_gemini(prompt)

    # Strip markdown code fences if present
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        result = json.loads(clean)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned malformed JSON. Retry.")

    # Audit trail
    audit = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model": "gemini-1.5-flash",
        "input_hash": hashlib.sha256(req.text.encode()).hexdigest(),
        "confidence": result.get("risk_score"),
    }

    return {**result, "audit_trail": audit}


# ── FIR Draft Generator ───────────────────────────────────────────────────────

class FIRRequest(BaseModel):
    transcript: str
    victim_state: str = "Unknown"

FIR_PROMPT = """
You are a legal assistant. Generate a professional FIR (First Information Report) draft for a digital arrest scam based on the following transcript.
Include: Date, Nature of complaint, Brief facts, Loss amount (if mentioned), Portal to file: cybercrime.gov.in, Helpline: 1930.

Transcript:
\"\"\"
{transcript}
\"\"\"

Return a clean, formal FIR draft in plain text.
"""

@router.post("/generate-fir")
async def generate_fir(req: FIRRequest):
    prompt = FIR_PROMPT.format(transcript=req.transcript)
    fir_text = ask_gemini(prompt)
    return {"fir_draft": fir_text}


# ── Citizen Chatbot ───────────────────────────────────────────────────────────

CHATBOT_SYSTEM = """
You are a friendly, calm AI safety assistant for Indian citizens deployed by the government to help detect scams.
Always respond in the same language the user writes in (Hindi or English).
Be concise — max 4 short paragraphs.
Always end with: the National Cybercrime Helpline number 1930 and the link cybercrime.gov.in if the situation seems dangerous.
Never be alarmist, but always be honest about risks.
"""

@router.post("/chat")
async def chatbot(req: ChatRequest):
    prompt = f"{CHATBOT_SYSTEM}\n\nUser message: {req.message}"
    response = ask_gemini(prompt)
    return {"response": response}
