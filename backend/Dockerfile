# Use official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for PyTorch and Audio processing
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies (including PyTorch)
# We use the CPU version of PyTorch to save space and ensure compatibility
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Create the cache directory for SpeechBrain models so it has write permissions
RUN mkdir -p /app/hf_cache && chmod 777 /app/hf_cache

# Copy the rest of the backend code
COPY . .

# Expose port 7860 (Required by Hugging Face Spaces)
EXPOSE 7860

# Run the FastAPI application using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
