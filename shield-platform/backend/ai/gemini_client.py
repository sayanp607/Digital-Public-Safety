"""
Gemini AI client — shared across all modules
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Default model for all text tasks
model = genai.GenerativeModel("gemini-1.5-flash")


def ask_gemini(prompt: str) -> str:
    """Send a prompt to Gemini and return the text response."""
    response = model.generate_content(prompt)
    return response.text
