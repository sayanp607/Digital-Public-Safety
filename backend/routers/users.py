from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import motor.motor_asyncio
import os
from dotenv import load_dotenv

router = APIRouter()

# Initialize MongoDB Connection
load_dotenv(override=True)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client.shield_db
users_collection = db.users

class UserProfile(BaseModel):
    citizen_id: str
    email: str
    name: str = "Citizen"

@router.post("/register")
async def register_user(user: UserProfile):
    # Check if user already exists
    existing_user = await users_collection.find_one({"citizen_id": user.citizen_id})
    
    if existing_user:
        # User exists: The email acts as the "password". Check if it matches.
        if existing_user.get("email") != user.email:
            raise HTTPException(
                status_code=401, 
                detail="Invalid Credentials: This Phone Number is already registered with a different Emergency Email."
            )
        return {"status": "success", "message": "Login successful"}
    else:
        # New User: Register them
        await users_collection.insert_one({
            "citizen_id": user.citizen_id,
            "email": user.email,
            "name": user.name
        })
        return {"status": "success", "message": "User registered successfully"}

@router.get("/{citizen_id}")
async def get_user(citizen_id: str):
    user = await users_collection.find_one({"citizen_id": citizen_id})
    if user:
        return {
            "citizen_id": user["citizen_id"], 
            "email": user.get("email", ""), 
            "name": user.get("name", "")
        }
    raise HTTPException(status_code=404, detail="User not found")
