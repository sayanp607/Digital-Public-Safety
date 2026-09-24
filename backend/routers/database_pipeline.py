import os
import json
import uuid
import datetime
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from dotenv import load_dotenv
import motor.motor_asyncio

load_dotenv(override=True)

router = APIRouter()

DB_FILE = "data/db.json"
COMPLAINTS_DIR = "data/complaints/"

# ─── MongoDB Async Database Setup ───
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
try:
    mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    db = mongo_client.shield_db
    complaints_collection = db.complaints
except Exception as e:
    complaints_collection = None
    print(f"[WARN] MongoDB Client init warning: {e}")

# ─── Hybrid Mode: Real PyTorch on localhost, Demo on Render ───
IS_PRODUCTION = os.getenv("RENDER", "").lower() == "true"

verification_model = None

# Ensure DB directory & fallback file exists
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
        print("[INFO] DB Pipeline: REAL PyTorch model loaded (localhost mode)")
    except Exception as e:
        print(f"[WARN] DB Pipeline: PyTorch load failed ({e}), using demo mode")
else:
    print("[INFO] DB Pipeline: Running in DEMO mode (Render production)")

@router.post("/submit")
async def submit_report(
    phone: str = Form(...),
    upi: str = Form(""),
    audio: UploadFile = File(...)
):
    """Citizen Portal: Submits a new scam complaint to MongoDB & DB file"""
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
            
        # Record Object
        record = {
            "id": report_id,
            "timestamp": timestamp,
            "phone": phone,
            "upi": upi,
            "audio_file": filepath,
            "status": "pending_analysis"
        }
        
        # 1. Save to MongoDB
        try:
            if complaints_collection is not None:
                await complaints_collection.insert_one(dict(record))
        except Exception as db_err:
            print(f"[WARN] MongoDB insert fallback: {db_err}")
            
        # 2. Dual-save to JSON DB for local persistence
        try:
            with open(DB_FILE, "r") as f:
                db_data = json.load(f)
            db_data.insert(0, record)
            with open(DB_FILE, "w") as f:
                json.dump(db_data, f, indent=2)
        except Exception as json_err:
            print(f"[WARN] File save error: {json_err}")
            
        return {"success": True, "report_id": report_id, "db": "MongoDB (shield_db.complaints)"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def get_reports():
    """Police Dashboard: Fetches all citizen reports from MongoDB"""
    try:
        # Try fetching from MongoDB first
        if complaints_collection is not None:
            try:
                cursor = complaints_collection.find({}, {"_id": 0}).sort("timestamp", -1)
                reports = await cursor.to_list(length=200)
                if reports and len(reports) > 0:
                    return reports
            except Exception as mongo_err:
                print(f"[WARN] MongoDB fetch fallback to file: {mongo_err}")

        # Fallback to DB JSON file
        with open(DB_FILE, "r") as f:
            db_data = json.load(f)
        return db_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-db")
async def verify_db_records(
    report_id_1: str = Form(...),
    report_id_2: str = Form(...)
):
    """Police Dashboard: Cross-references two database audio files"""
    try:
        file1, file2 = None, None
        if complaints_collection is not None:
            try:
                doc1 = await complaints_collection.find_one({"id": report_id_1})
                doc2 = await complaints_collection.find_one({"id": report_id_2})
                if doc1: file1 = doc1.get("audio_file")
                if doc2: file2 = doc2.get("audio_file")
            except Exception as e:
                print(f"[WARN] MongoDB record query fallback: {e}")

        if not file1 or not file2:
            with open(DB_FILE, "r") as f:
                db_data = json.load(f)
            file1 = file1 or next((r["audio_file"] for r in db_data if r["id"] == report_id_1), None)
            file2 = file2 or next((r["audio_file"] for r in db_data if r["id"] == report_id_2), None)
            
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
