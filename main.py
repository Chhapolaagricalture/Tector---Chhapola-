"""
Chhapola Agriculture — FastAPI Backend
=======================================
Firebase Admin SDK + Gemini AI + Farmer Records CRUD
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Literal, Optional

import requests
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, firestore

# ==========================================
# FIREBASE INITIALIZATION
# ==========================================

if not firebase_admin._apps:
    firebase_service_account = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if not firebase_service_account:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT_JSON secret is required to start the backend."
        )
    try:
        service_account_info = json.loads(firebase_service_account)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT_JSON must contain valid service-account JSON."
        ) from exc
    cred = credentials.Certificate(service_account_info)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ==========================================
# GEMINI AI CONFIGURATION
# ==========================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    f"models/{GEMINI_MODEL}:generateContent"
)

SYSTEM_PROMPT = """
आप 'छपोला एग्रीकल्चर' (Chhapola Agriculture) के ट्रैक्टर और कृषि वर्क खाता बही (Tractor Account Ledger System) के विशेषज्ञ AI असिस्टेंट हैं।

आपकी मुख्य जिम्मेदारियाँ:
1. किसान का नाम, तारीख, मोबाइल नंबर, ट्रैक्टर काम (Hero, Cultivator, Thresher, Rotavator आदि), फसल (चना, गेहूं, बाजरा, ग्वार), बीघा/घंटा, रेट, कुल राशि, जमा राशि और बाकी (Balance) का सटीक हिसाब समझना और संभालना।
2. यूजर/किसान के सवालों का संक्षिप्त, सटीक और सरल हिंदी/राजस्थानी मिश्रित भाषा में जवाब देना।
3. अगर कोई आवाज़ या टेक्स्ट से एंट्री दर्ज करने को कहे, तो दिए गए फ़ील्ड्स (किसान, काम, बीघा, रेट, कुल) का विवरण निकाल कर देना।
"""

# ==========================================
# PYDANTIC MODELS
# ==========================================


class HealthResponse(BaseModel):
    status: Literal["ok"]


class ServiceInfo(BaseModel):
    name: str
    version: str
    description: str


class ChatRequest(BaseModel):
    user_id: str
    message: str


class RecordCreate(BaseModel):
    owner_uid: str
    name: str
    mobile: str = ""
    date: str = ""
    work: str = ""
    crop: str = ""
    unit: float = 0
    time: str = ""
    bigha: float = 0
    rate: float = 0
    paid: float = 0
    total: float = 0
    baki: float = 0
    note: str = ""


class RecordUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    date: Optional[str] = None
    work: Optional[str] = None
    crop: Optional[str] = None
    unit: Optional[float] = None
    time: Optional[str] = None
    bigha: Optional[float] = None
    rate: Optional[float] = None
    paid: Optional[float] = None
    total: Optional[float] = None
    baki: Optional[float] = None
    note: Optional[str] = None


class LedgerQuery(BaseModel):
    user_id: str
    message: str


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title="Chhapola Agriculture Tractor Ledger AI",
    description="Python API connected with Firebase and AI for tractor account management",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    servers=[
        {
            "url": "https://tector-chhapola.onrender.com",
            "description": "Production (Render)",
        },
    ],
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# HELPER: CALCULATE TOTAL & BALANCE
# ==========================================

def calculate_totals(record: dict) -> dict:
    """Calculate total and balance based on work type."""
    work = record.get("work", "")
    bigha = float(record.get("bigha", 0))
    rate = float(record.get("rate", 0))
    paid = float(record.get("paid", 0))
    unit = float(record.get("unit", 0))
    time_str = record.get("time", "")

    if work == "Thresher":
        crop = record.get("crop", "")
        if crop == "Bajra":
            total = bigha * rate  # Quintal
        else:
            # Parse time
            hours = 0
            if time_str:
                parts = time_str.replace("घंटा", "").replace("मिनट", "").split()
                for i, p in enumerate(parts):
                    p = p.strip()
                    if p.isdigit():
                        if i == 0:
                            hours = int(p)
                        elif i == 1:
                            hours += int(p) / 60
            total = hours * rate
    elif work == "Spray Machine":
        total = unit * rate
    elif work == "Pending Balance":
        total = rate
    else:
        total = bigha * rate

    baki = total - paid
    record["total"] = total
    record["baki"] = baki
    return record


# ==========================================
# SYSTEM ENDPOINTS
# ==========================================


@app.get("/", tags=["system"])
async def root():
    return {
        "service": "Chhapola Agriculture Backend",
        "version": app.version,
        "status": "running",
        "docs": "/api/docs",
    }


@app.get("/api", response_model=ServiceInfo, tags=["system"])
async def service_info() -> ServiceInfo:
    return ServiceInfo(
        name="Chhapola Agriculture Backend",
        version=app.version,
        description="Firebase + Gemini AI backend for tractor account management",
    )


@app.get("/api/healthz", response_model=HealthResponse, tags=["system"])
async def healthz() -> HealthResponse:
    return HealthResponse(status="ok")


# ==========================================
# GEMINI AI CHAT ENDPOINT
# ==========================================


@app.post("/api/chat", tags=["ai"])
async def chat_with_ai(request: ChatRequest):
    """Send a message to Gemini AI and get a response."""
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY not configured on server",
        )

    try:
        # Build prompt with system instruction
        prompt_content = f"{SYSTEM_PROMPT}\n\nयूजर का सवाल/इन्फो: {request.message}"

        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt_content}]}]
        }

        response = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
            headers=headers,
            timeout=30,
        )
        res_data = response.json()

        if response.status_code == 200 and "candidates" in res_data:
            ai_reply = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return {"status": "success", "reply": ai_reply}
        else:
            error_msg = res_data.get("error", {}).get("message", "Gemini API error")
            raise HTTPException(status_code=502, detail=error_msg)

    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Gemini API timeout")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ledger-chat", tags=["ai"])
async def process_ledger_ai(data: LedgerQuery):
    """Alternative chat endpoint (compatible with ai_assistant.py)."""
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY not configured on server",
        )

    try:
        prompt_content = f"{SYSTEM_PROMPT}\n\nयूजर का सवाल/इन्फो: {data.message}"

        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt_content}]}]
        }

        response = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
            headers=headers,
            timeout=30,
        )
        res_data = response.json()

        if response.status_code == 200 and "candidates" in res_data:
            ai_reply = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return {"success": True, "response": ai_reply}
        else:
            raise HTTPException(status_code=502, detail=res_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# FARMER RECORDS CRUD APIs
# ==========================================


@app.post("/api/records", tags=["records"])
async def create_record(record: RecordCreate):
    """Add a new farmer record to Firestore."""
    try:
        record_data = record.model_dump()
        record_data = calculate_totals(record_data)
        record_data["created_at"] = datetime.utcnow().isoformat()
        record_data["updated_at"] = datetime.utcnow().isoformat()

        doc_ref = db.collection("records").add(record_data)
        doc_id = doc_ref[1].id

        return {
            "status": "success",
            "message": "Record created successfully",
            "id": doc_id,
            "total": record_data["total"],
            "baki": record_data["baki"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/records", tags=["records"])
async def list_records(
    owner_uid: str = Query(..., description="Owner's Firebase UID"),
    search: str = Query("", description="Search by farmer name"),
    from_date: str = Query("", description="Filter from date (YYYY-MM-DD)"),
    to_date: str = Query("", description="Filter to date (YYYY-MM-DD)"),
):
    """List all records for an owner with optional filters."""
    try:
        query = db.collection("records").where("owner_uid", "==", owner_uid)
        docs = query.stream()

        records = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id

            # Apply date filters
            if from_date and data.get("date", "") < from_date:
                continue
            if to_date and data.get("date", "") > to_date:
                continue

            # Apply search filter
            if search:
                farmer_name = data.get("name", "").lower()
                if search.lower() not in farmer_name:
                    continue

            records.append(data)

        # Sort by date
        records.sort(key=lambda x: x.get("date", ""))

        return {"status": "success", "records": records, "count": len(records)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/records/{record_id}", tags=["records"])
async def get_record(record_id: str):
    """Get a single record by ID."""
    try:
        doc = db.collection("records").document(record_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Record not found")

        data = doc.to_dict()
        data["id"] = doc.id
        return {"status": "success", "record": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/records/{record_id}", tags=["records"])
async def update_record(record_id: str, updates: RecordUpdate):
    """Update an existing farmer record (partial update)."""
    try:
        doc = db.collection("records").document(record_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Record not found")

        update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Recalculate totals if financial fields changed
        financial_fields = {"work", "bigha", "rate", "paid", "unit", "time", "crop", "total", "baki"}
        if financial_fields.intersection(update_data.keys()):
            existing = doc.to_dict()
            existing.update(update_data)
            recalculated = calculate_totals(existing)
            update_data["total"] = recalculated["total"]
            update_data["baki"] = recalculated["baki"]

        update_data["updated_at"] = datetime.utcnow().isoformat()

        db.collection("records").document(record_id).update(update_data)

        return {
            "status": "success",
            "message": "Record updated successfully",
            "id": record_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/records/{record_id}", tags=["records"])
async def delete_record(record_id: str):
    """Delete a farmer record."""
    try:
        doc = db.collection("records").document(record_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Record not found")

        db.collection("records").document(record_id).delete()

        return {"status": "success", "message": "Record deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# SUMMARY / CALCULATION ENDPOINT
# ==========================================


@app.get("/api/summary", tags=["records"])
async def get_summary(
    owner_uid: str = Query(..., description="Owner's Firebase UID"),
    from_date: str = Query("", description="Filter from date"),
    to_date: str = Query("", description="Filter to date"),
):
    """Get total/paid/balance summary for an owner."""
    try:
        query = db.collection("records").where("owner_uid", "==", owner_uid)
        docs = query.stream()

        total_amount = 0.0
        total_paid = 0.0
        total_baki = 0.0
        total_farmers = set()
        today_amount = 0.0
        today = datetime.utcnow().strftime("%Y-%m-%d")

        for doc in docs:
            data = doc.to_dict()
            date = data.get("date", "")

            # Date filters
            if from_date and date < from_date:
                continue
            if to_date and date > to_date:
                continue

            total_amount += float(data.get("total", 0))
            total_paid += float(data.get("paid", 0))
            total_baki += float(data.get("baki", 0))
            total_farmers.add(data.get("name", "").strip().lower())

            if date == today:
                today_amount += float(data.get("total", 0))

        return {
            "status": "success",
            "total_farmers": len(total_farmers),
            "total_amount": total_amount,
            "total_paid": total_paid,
            "total_baki": total_baki,
            "today_income": today_amount,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8080")),
        reload=os.getenv("ENVIRONMENT", "development") == "development",
    )
