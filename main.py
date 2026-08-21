
from __future__ import annotations

import json
import os
from typing import Literal

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 1. Firebase Admin SDK Import
import firebase_admin
from firebase_admin import credentials, firestore

# Firebase Initialization from the secure Replit Secret
if not firebase_admin._apps:
    firebase_service_account = (
        os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    )
    if not firebase_service_account:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT_JSON secret is required to start the backend."
        )

    try:
        service_account_info = (
            json.loads(firebase_service_account)
        )
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT_JSON must contain valid service-account JSON."
        ) from exc

    cred = credentials.Certificate(service_account_info)
    firebase_admin.initialize_app(cred)

db = firestore.client()


class HealthResponse(BaseModel):
    status: Literal["ok"]


class ServiceInfo(BaseModel):
    name: str
    version: str
    description: str


# यूजर के मैसेज के लिए Request Model
class ChatRequest(BaseModel):
    user_id: str
    message: str


app = FastAPI(
    title="Tractor & Billing AI Backend",
    description="Python API connected with Firebase and AI",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api", response_model=ServiceInfo, tags=["system"])
async def service_info() -> ServiceInfo:
    return ServiceInfo(
        name="Tractor AI Backend",
        version=app.version,
        description="Python API connected to Firebase",
    )


@app.get("/api/healthz", response_model=HealthResponse, tags=["system"])
async def healthz() -> HealthResponse:
    return HealthResponse(status="ok")


# 2. AI Chatbot API Endpoint (Firebase से डेटा पढ़कर जवाब देने के लिए)
@app.post("/api/chat", tags=["ai-services"])
async def chat_with_ai(request: ChatRequest):
    try:
        # Firebase से डेटाबेस रीड करने का उदाहरण
        # doc_ref = db.collection("users").document(request.user_id)

        user_msg = request.message.lower()

        # सैंपल AI लॉजिक (आप यहाँ Gemini API भी जोड़ सकते हैं)
        response_text = (
            f"आपका मैसेज '{request.message}' मिला। बैकएंड और Firebase सफलतापूर्वक कनेक्ट हैं!"
        )

        return {
            "status": "success",
            "reply": response_text,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8080")),
        reload=os.getenv("ENVIRONMENT", "development") == "development",
    )
