# 🛡️ SHIELD Platform

**Smart Hazard Intelligence & Enforcement for Law & Defense**

AI-powered Digital Public Safety Intelligence Platform — Hackathon Project

---

## 🗂️ Project Structure

```
shield-platform/
├── frontend/          # React + Vite app (3 portals)
├── backend/           # FastAPI Python backend (5 AI modules)
├── data/              # Mock datasets
└── docs/              # Architecture diagrams, presentation
```

## 🚀 Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                  # Runs on http://localhost:5173
```

## 🧩 Modules

| # | Module | Portal | Status |
|---|---|---|---|
| 1 | Digital Arrest Scam Detector | Citizen | 🔧 In Progress |
| 2 | Counterfeit Currency Scanner | Bank | 🔧 In Progress |
| 3 | Fraud Network Graph | Law Enforcement | 🔧 In Progress |
| 4 | Geospatial Crime Heatmap | Law Enforcement | 🔧 In Progress |
| 5 | Citizen Fraud Shield Chatbot | Citizen | 🔧 In Progress |

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key (get free at ai.google.dev) |

## 📡 API Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/scam/analyse` | Analyse text for scam patterns |
| `POST /api/scam/generate-fir` | Generate FIR draft |
| `POST /api/scam/chat` | Citizen chatbot |
| `POST /api/currency/scan` | Scan currency note image |
| `GET  /api/graph/demo` | Get fraud network graph |
| `GET  /api/geo/heatmap` | Get crime heatmap data |
