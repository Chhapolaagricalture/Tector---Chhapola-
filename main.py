"""
Chhapola Agriculture — FastAPI Backend
=======================================
Firebase Admin SDK + Gemini AI + Farmer Records CRUD
Security: ID Token Auth, CORS, Rate Limiting
"""

from __future__ import annotations

import json
import os
import time
from collections import defaultdict
from datetime import datetime
from typing import Literal, Optional

import requests
import uvicorn
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, firestore, auth as fb_auth

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
    user_id: Optional[str] = "web"
    message: str


class ChatPromptRequest(BaseModel):
    """Flexible chat request — accepts prompt, message, or image for Vision API."""
    prompt: Optional[str] = None
    message: Optional[str] = None
    user_id: Optional[str] = "web"
    image: Optional[str] = None  # base64 data-URL (data:image/...;base64,...)
    mime_type: Optional[str] = None  # e.g. "image/jpeg"


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

# ==========================================
# CORS — Restricted to known production domains
# ==========================================

ALLOWED_ORIGINS = [
    "https://tector-chhapola.onrender.com",
    "https://tector-chhapola-frontend.onrender.com",
    "https://chhapolaagricalture.github.io",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# RATE LIMITING — In-memory, per-IP
# ==========================================

_rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 30  # max requests per window (for /api/chat)


def check_rate_limit(ip: str, max_requests: int = RATE_LIMIT_MAX_REQUESTS) -> bool:
    """Return True if rate limit is OK, False if exceeded."""
    now = time.time()
    # Remove old entries outside the window
    _rate_limit_store[ip] = [
        t for t in _rate_limit_store[ip] if now - t < RATE_LIMIT_WINDOW
    ]
    if len(_rate_limit_store[ip]) >= max_requests:
        return False
    _rate_limit_store[ip].append(now)
    return True


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
# AUTH HELPER — Firebase ID Token Verification
# ==========================================

async def verify_firebase_token(request: Request) -> Optional[dict]:
    """Verify Firebase ID token from Authorization header.

    Returns the decoded token dict if valid, None if no token provided.
    Raises HTTPException(401) if token is provided but invalid.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None  # No token — allow endpoint to decide

    id_token = auth_header[7:]  # strip "Bearer "
    try:
        decoded = fb_auth.verify_id_token(id_token)
        return decoded
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )


async def require_auth(request: Request) -> dict:
    """Require a valid Firebase ID token. Returns decoded token.

    Raises 401 if no token or invalid token.
    """
    token = await verify_firebase_token(request)
    if token is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please sign in."
        )
    return token


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
# GEMINI AI CHAT ENDPOINT (with rate limiting)
# ==========================================


@app.post("/api/chat", tags=["ai"])
async def chat_with_ai(body: ChatPromptRequest, request: Request):
    """Send a message to Gemini AI and get a Gemini-compatible response.

    Rate limited: 30 requests per minute per IP.
    """
    # Rate limit check
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Bahut zyada requests ho rahi hain. Kuch der baad try karein."
        )

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY not configured on server",
        )

    user_text = body.prompt or body.message or ""
    if not user_text.strip() and not body.image:
        raise HTTPException(status_code=400, detail="prompt or message is required")

    try:
        prompt_content = f"{SYSTEM_PROMPT}\n\nयूजर का सवाल/इन्फो: {user_text}" if user_text.strip() else SYSTEM_PROMPT

        parts = [{"text": prompt_content}]

        # If image is provided, add it as inline_data for Gemini Vision
        if body.image:
            raw_b64 = body.image
            # Strip data-URL prefix if present, e.g. "data:image/jpeg;base64,/9j/..."
            if "," in raw_b64 and raw_b64.startswith("data:"):
                raw_b64 = raw_b64.split(",", 1)[1]

            mime = body.mime_type or "image/jpeg"
            parts.append({
                "inline_data": {
                    "mime_type": mime,
                    "data": raw_b64,
                }
            })

        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": parts}]
        }

        # Use longer timeout for image requests (large payloads)
        req_timeout = 90 if body.image else 30

        response = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
            headers=headers,
            timeout=req_timeout,
        )
        res_data = response.json()

        if response.status_code == 200 and "candidates" in res_data:
            # Return raw Gemini format so frontend can parse it directly
            return res_data
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
# FARMER RECORDS CRUD APIs (with auth)
# ==========================================


@app.post("/api/records", tags=["records"])
async def create_record(record: RecordCreate, request: Request):
    """Add a new farmer record to Firestore. Requires auth."""
    await require_auth(request)

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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/records", tags=["records"])
async def list_records(
    request: Request,
    owner_uid: str = Query(..., description="Owner's Firebase UID"),
    search: str = Query("", description="Search by farmer name"),
    from_date: str = Query("", description="Filter from date (YYYY-MM-DD)"),
    to_date: str = Query("", description="Filter to date (YYYY-MM-DD)"),
):
    """List all records for an owner with optional filters. Requires auth."""
    token = await require_auth(request)
    # Ensure user can only access their own records
    if token.get("uid") != owner_uid:
        raise HTTPException(status_code=403, detail="Access denied to other user's records")

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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/records/{record_id}", tags=["records"])
async def get_record(record_id: str, request: Request):
    """Get a single record by ID. Requires auth."""
    await require_auth(request)

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
async def update_record(record_id: str, updates: RecordUpdate, request: Request):
    """Update an existing farmer record (partial update). Requires auth."""
    await require_auth(request)

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
async def delete_record(record_id: str, request: Request):
    """Delete a farmer record. Requires auth."""
    await require_auth(request)

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
# SUMMARY / CALCULATION ENDPOINT (with auth)
# ==========================================


@app.get("/api/summary", tags=["records"])
async def get_summary(
    request: Request,
    owner_uid: str = Query(..., description="Owner's Firebase UID"),
    from_date: str = Query("", description="Filter from date"),
    to_date: str = Query("", description="Filter to date"),
):
    """Get total/paid/balance summary for an owner. Requires auth."""
    token = await require_auth(request)
    # Ensure user can only access their own summary
    if token.get("uid") != owner_uid:
        raise HTTPException(status_code=403, detail="Access denied to other user's data")

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
    except HTTPException:
        raise
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
