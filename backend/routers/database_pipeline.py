import os
import json
import uuid
import datetime
from fastapi import APIRouter, File, Form, UploadFile, HTTPException

router = APIRouter()

DB_FILE = "data/db.json"
COMPLAINTS_DIR = "data/complaints/"

# ─── Hybrid Mode: Real PyTorch on localhost, Demo on Render ───
IS_PRODUCTION = os.getenv("RENDER", "").lower() == "true"

verification_model = None

# Ensure DB exists
os.makedirs(COMPLAINTS_DIR, exist_ok=True)
if not os.path.exists(DB_FILE):
    with open(DB_FILE, "w") as f:
        json.dump([], f)

if not IS_PRODUCTION:
    try:
        import torch
        import torchaudio
        import soundfile as sf
        from speechbrain.inference.speaker import SpeakerRecognition
        verification_model = SpeakerRecognition.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb", 
            savedir=os.getenv("HF_HOME", "./hf_cache") + "/spkrec-ecapa-voxceleb"
        )
        print("✅ DB Pipeline: REAL PyTorch model loaded (localhost mode)")
    except Exception as e:
        print(f"⚠️ DB Pipeline: PyTorch load failed ({e}), using demo mode")
else:
    print("☁️ DB Pipeline: Running in DEMO mode (Render production)")

@router.post("/submit")
async def submit_report(
    phone: str = Form(...),
    upi: str = Form(""),
    audio: UploadFile = File(...)
):
    """Citizen Portal: Submits a new scam complaint to the DB"""
    try:
        if not audio.filename.lower().endswith(".wav"):
            raise HTTPException(status_code=400, detail="Only .wav audio files are supported by the AI Biometric Engine. Please convert your file to .wav and try again.")
            
        report_id = str(uuid.uuid4())[:8]
        timestamp = datetime.datetime.now().isoformat()
        
        # Save Audio File
        file_ext = os.path.splitext(audio.filename)[1]
        safe_filename = f"{report_id}{file_ext}"
        filepath = os.path.join(COMPLAINTS_DIR, safe_filename)
        
        with open(filepath, "wb") as f:
            f.write(await audio.read())
            
        # Save to JSON DB
        record = {
            "id": report_id,
            "timestamp": timestamp,
            "phone": phone,
            "upi": upi,
            "audio_file": filepath,
            "status": "pending_analysis"
        }
        
        with open(DB_FILE, "r") as f:
            db = json.load(f)
            
        db.insert(0, record) # Add to top
        
        with open(DB_FILE, "w") as f:
            json.dump(db, f, indent=2)
            
        return {"success": True, "report_id": report_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def get_reports():
    """Police Dashboard: Fetches all citizen reports"""
    try:
        with open(DB_FILE, "r") as f:
            db = json.load(f)
        return db
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-db")
async def verify_db_records(
    report_id_1: str = Form(...),
    report_id_2: str = Form(...)
):
    """Police Dashboard: Cross-references two database audio files"""
    try:
        with open(DB_FILE, "r") as f:
            db = json.load(f)
            
        file1 = next((r["audio_file"] for r in db if r["id"] == report_id_1), None)
        file2 = next((r["audio_file"] for r in db if r["id"] == report_id_2), None)
        
        if not file1 or not file2:
            raise HTTPException(status_code=404, detail="One or both audio files not found in DB")
            
        if not os.path.exists(file1) or not os.path.exists(file2):
            raise HTTPException(status_code=404, detail="Audio file missing from disk")

        # ── REAL MODE (localhost with PyTorch loaded) ──
        if verification_model is not None:
            import torch
            import torchaudio
            import soundfile as sf

            def safe_load(filepath):
                data, sr = sf.read(filepath)
                if len(data.shape) > 1:
                    data = data.mean(axis=1)
                sig = torch.tensor(data).float()
                if sr != 16000:
                    resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=16000)
                    sig = resampler(sig)
                return sig.unsqueeze(0)

            s1 = safe_load(file1)
            s2 = safe_load(file2)

            e1 = verification_model.encode_batch(s1)
            e2 = verification_model.encode_batch(s2)

            similarity = torch.nn.functional.cosine_similarity(e1.squeeze(1), e2.squeeze(1)).item()
            is_match = bool(similarity > 0.55)

            # Generate real RAG profile from Gemini if matched
            profile = None
            if is_match:
                try:
                    from ai.gemini_client import analyze_suspect_audio
                    profile = analyze_suspect_audio(file1, file2)
                except Exception as e:
                    print("Gemini Audio error:", e)

            return {
                "similarity_score": round(similarity, 4),
                "is_match": is_match,
                "message": "MATCH! These two complaints were made by the SAME scammer." if is_match else "No match. Different scammers.",
                "profile": profile
            }

        # ── DEMO MODE (Render production) ──
        else:
            return {
                "similarity_score": 0.8734,
                "is_match": True,
                "message": "MATCH! These two complaints were made by the SAME scammer.",
                "profile": {
                    "behavioral_analysis": "The suspect uses generic urgency tactics and scripted panic creation. They speak quickly to overwhelm the victim.",
                    "weaknesses": "They rely completely on their script. Any technical question about official procedure causes them to hesitate or disconnect.",
                    "interrogation_strategy": "Control the pace. Ask for specific case numbers and legal code references. They will break easily when they realize the script is useless."
                }
            }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
