import os
import json
import uuid
import datetime
import torch
import torchaudio
import soundfile as sf
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from speechbrain.inference.speaker import SpeakerRecognition

router = APIRouter()

DB_FILE = "data/db.json"
COMPLAINTS_DIR = "data/complaints/"

# Ensure DB exists
if not os.path.exists(DB_FILE):
    with open(DB_FILE, "w") as f:
        json.dump([], f)

# Load PyTorch Model globally so it doesn't load on every request
try:
    verification_model = SpeakerRecognition.from_hparams(
        source="speechbrain/spkrec-ecapa-voxceleb", 
        savedir="E:/hf_cache/spkrec-ecapa-voxceleb"
    )
except Exception as e:
    verification_model = None
    print(f"Failed to load PyTorch model: {e}")

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
    if not verification_model:
        raise HTTPException(status_code=500, detail="PyTorch Model not loaded")

    try:
        with open(DB_FILE, "r") as f:
            db = json.load(f)
            
        file1 = next((r["audio_file"] for r in db if r["id"] == report_id_1), None)
        file2 = next((r["audio_file"] for r in db if r["id"] == report_id_2), None)
        
        if not file1 or not file2:
            raise HTTPException(status_code=404, detail="One or both audio files not found in DB")
            
        if not os.path.exists(file1) or not os.path.exists(file2):
            raise HTTPException(status_code=404, detail="Audio file missing from disk")

        # ── MANUAL AUDIO LOADING TO BYPASS SPEECHBRAIN WINDOWS BUGS ──
        def safe_load(filepath):
            data, sr = sf.read(filepath)
            if len(data.shape) > 1:
                data = data.mean(axis=1) # Convert stereo to mono
            sig = torch.tensor(data).float()
            if sr != 16000:
                resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=16000)
                sig = resampler(sig)
            return sig.unsqueeze(0) # Return [1, samples] tensor

        s1 = safe_load(file1)
        s2 = safe_load(file2)

        # Get embeddings
        e1 = verification_model.encode_batch(s1)
        e2 = verification_model.encode_batch(s2)

        # Calculate cosine similarity
        similarity = torch.nn.functional.cosine_similarity(e1.squeeze(1), e2.squeeze(1)).item()
        
        # A threshold of 0.55 (55%) is highly accurate for separating distinct speakers in ECAPA-TDNN
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

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
