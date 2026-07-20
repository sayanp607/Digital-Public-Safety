"""
Scam Detection Router — Module 1 + Module 5 (Chatbot)
"""

import os
import json
import uuid
import hashlib
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, File, UploadFile
from pydantic import BaseModel
from typing import Optional
from ai.gemini_client import ask_gemini, analyze_image_for_deepfake

router = APIRouter()


# ── Request / Response models ─────────────────────────────────────────────────

class ScamAnalysisRequest(BaseModel):
    text: str
    language: str = "en"   # "en" or "hi"
    citizen_id: str = "" # To salt the hash and tie it to the user securely


class ChatRequest(BaseModel):
    message: str
    language: str = "en"

class SOSEmailRequest(BaseModel):
    email: str
    citizen_phone: str = "Unknown Number"
    transcript_preview: str = ""


# ── Scam Detector ─────────────────────────────────────────────────────────────

SCAM_ANALYSIS_PROMPT = """
You are an expert digital fraud analyst for the Indian government. Analyse the following text/transcript for digital arrest scam patterns.

Known patterns:
- Impersonating CBI, ED, Customs, Police, Supreme Court
- Claiming victim has a package/account/Aadhaar linked to illegal activity
- Secrecy / Isolation Protocol ("don't tell family", "you are under secret investigation")
- Demanding money transfer to "safe account"
- Threatening arrest within hours
- Using video call to simulate official environment

TEXT TO ANALYSE:
\"\"\"
{text}
\"\"\"

CRITICAL INSTRUCTION: The user's preferred language is: {language}. 
Your `explanation` and `recommended_action` MUST be written natively in {language}.

Respond ONLY with valid JSON in this exact format:
{{
  "risk_score": <integer 0-100>,
  "verdict": "<SCAM | SUSPICIOUS | SAFE>",
  "patterns_detected": ["<pattern1>", "<pattern2>"],
  "triggered_phrases": ["<phrase1>", "<phrase2>"],
  "explanation": "<2-3 sentence explanation IN {language}>",
  "recommended_action": "<what the user should do right now IN {language}>"
}}
"""

@router.post("/analyse")
async def analyse_scam(req: ScamAnalysisRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    prompt = SCAM_ANALYSIS_PROMPT.format(text=req.text, language=req.language)
    raw = ask_gemini(prompt)

    # Strip markdown code fences if present
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        result = json.loads(clean)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned malformed JSON. Retry.")

    # Create a unique salt using the citizen's ID + timestamp to guarantee global uniqueness
    salt = req.citizen_id + datetime.utcnow().isoformat()
    unique_hash = hashlib.sha256((req.text + salt).encode()).hexdigest()

    # Audit trail
    audit = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model": "gemini-flash-latest",
        "input_hash": unique_hash,
        "confidence": result.get("risk_score"),
    }

    return {**result, "audit_trail": audit}

import smtplib
from email.mime.text import MIMEText
import os

from dotenv import load_dotenv

@router.post("/sos-email")
async def send_sos_email(req: SOSEmailRequest):
    # Dynamically reload the .env file so we don't need to restart the server
    load_dotenv(override=True)
    
    sender_email = os.getenv("SMTP_EMAIL")
    sender_password = os.getenv("SMTP_PASSWORD")

    if not sender_email or not sender_password:
        return {"status": "skipped", "detail": "SMTP credentials not configured in .env"}

    # Gmail app passwords shouldn't have spaces
    sender_password = sender_password.replace(" ", "")

    msg_body = f"""🚨 AUTOMATED EMERGENCY SOS 🚨

We are contacting you on behalf of your family member (Phone: {req.citizen_phone}). 

Our SHIELD AI systems have detected that they are currently on a call being targeted by a cyber extortion / "Digital Arrest" scam. The scammers are actively attempting to psychologically isolate them on a video/audio call.

Please contact them at {req.citizen_phone} IMMEDIATELY to break the isolation, or call the National Cyber Crime Helpline (1930) on their behalf. 
Do not trust anyone calling from their phone number asking for ransom money.

--
SHIELD Digital Public Safety Platform
"""
    msg = MIMEText(msg_body)
    msg["Subject"] = "🚨 URGENT: Family Member Trapped on Scam Call!"
    msg["From"] = sender_email
    msg["To"] = req.email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, req.email, msg.as_string())
        return {"status": "sent"}
    except Exception as e:
        print(f"SMTP Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email.")


# ── FIR Draft Generator ───────────────────────────────────────────────────────

class FIRRequest(BaseModel):
    transcript: str
    victim_state: str = "Unknown"
    language: str = "en"

FIR_PROMPT = """
You are a legal assistant. Generate a professional FIR (First Information Report) draft for a digital arrest scam based on the following transcript.
Include: Date, Nature of complaint, Brief facts, Loss amount (if mentioned), Portal to file: cybercrime.gov.in, Helpline: 1930.

Transcript:
\"\"\"
{transcript}
\"\"\"

CRITICAL INSTRUCTION: Write the FIR draft natively in the user's preferred language: {language}.
Return a clean, formal FIR draft in plain text.
"""

@router.post("/generate-fir")
async def generate_fir(req: FIRRequest):
    prompt = FIR_PROMPT.format(transcript=req.transcript, language=req.language)
    fir_text = ask_gemini(prompt)
    return {"fir_draft": fir_text}


# ── Citizen Chatbot ───────────────────────────────────────────────────────────

CHATBOT_SYSTEM = """
You are a friendly, calm AI safety assistant for Indian citizens deployed by the government to help detect scams.
CRITICAL INSTRUCTION: Always respond in the EXACT SAME LANGUAGE the user writes in (e.g., Bengali, Hindi, Tamil, English, etc.). Do not default to English if the user speaks Bengali.
Be concise — max 4 short paragraphs.
Always end with: the National Cybercrime Helpline number 1930 and the link cybercrime.gov.in if the situation seems dangerous.
Never be alarmist, but always be honest about risks.
"""

@router.post("/chat")
async def chatbot(req: ChatRequest):
    prompt = f"{CHATBOT_SYSTEM}\n\nUser message: {req.message}"
    response = ask_gemini(prompt)
    return {"response": response}


# ── Deepfake Video Scanner ───────────────────────────────────────────────────

@router.post("/analyze-deepfake")
async def analyze_deepfake(file: UploadFile = File(...)):
    """Accepts an image file and analyzes it for deepfake anomalies using Gemini Vision."""
    try:
        contents = await file.read()
        mime_type = file.content_type or "image/jpeg"
        filename = file.filename or ""
        
        # Call Gemini Vision
        result_text = analyze_image_for_deepfake(contents, mime_type, filename)
        
        # Clean markdown if present
        clean_json = result_text.replace('```json', '').replace('```', '').strip()
        data = json.loads(clean_json)
        
        return data
        
    except json.JSONDecodeError:
        print(f"Failed to parse Deepfake JSON: {result_text}")
        raise HTTPException(status_code=500, detail="Vision AI returned malformed response.")
    except Exception as e:
        print(f"Deepfake Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
