"""
Chhapola Agriculture — FastAPI Backend
=======================================
Firebase Admin SDK + Gemini AI + Farmer Records CRUD
Security: ID Token Auth, CORS, Rate Limiting
"""

from __future__ import annotations

import json
import logging
import os
import time
from collections import defaultdict
from datetime import datetime
from typing import Literal, Optional

import requests
import uvicorn
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# Phase 3: Spare Parts Search Router
from spare_parts_router import router as spare_parts_router

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


MAX_REQUEST_BODY_BYTES = 10 * 1024 * 1024  # 10 MB

logger = logging.getLogger("chhapola")


class ChatPromptRequest(BaseModel):
    """Flexible chat request — accepts prompt, message, or image for Vision API."""
    prompt: Optional[str] = None
    message: Optional[str] = None
    user_id: Optional[str] = "web"
    image: Optional[str] = None  # base64 data-URL (data:image/...;base64,...)
    mime_type: Optional[str] = None  # e.g. "image/jpeg"

    @field_validator("prompt", "message")
    @classmethod
    def _truncate_text(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 50000:
            return v[:50000]
        return v


class RecordCreate(BaseModel):
    owner_uid: str = ""  # Ignored server-side; overridden by Firebase token
    name: str = Field(..., max_length=200)
    mobile: str = Field("", max_length=20)
    date: str = Field("", max_length=20)
    work: str = Field("", max_length=100)
    crop: str = Field("", max_length=100)
    unit: float = 0
    time: str = Field("", max_length=50)
    bigha: float = 0
    rate: float = 0
    paid: float = 0
    total: float = 0
    baki: float = 0
    note: str = Field("", max_length=1000)

    @field_validator("unit", "bigha", "rate", "paid", "total", "baki")
    @classmethod
    def _clamp_financial(cls, v: float) -> float:
        if v < 0:
            return 0.0
        if v > 10_000_000:
            return 10_000_000.0
        return v


class RecordUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    mobile: Optional[str] = Field(None, max_length=20)
    date: Optional[str] = Field(None, max_length=20)
    work: Optional[str] = Field(None, max_length=100)
    crop: Optional[str] = Field(None, max_length=100)
    unit: Optional[float] = None
    time: Optional[str] = Field(None, max_length=50)
    bigha: Optional[float] = None
    rate: Optional[float] = None
    paid: Optional[float] = None
    total: Optional[float] = None
    baki: Optional[float] = None
    note: Optional[str] = Field(None, max_length=1000)

    @field_validator("unit", "bigha", "rate", "paid", "total", "baki")
    @classmethod
    def _clamp_financial(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v < 0:
            return 0.0
        if v > 10_000_000:
            return 10_000_000.0
        return v


class LedgerQuery(BaseModel):
    user_id: str
    message: str


# ==========================================
# FASTAPI APP
# ==========================================

_IS_PROD = os.getenv("ENVIRONMENT", "production") == "production"

app = FastAPI(
    title="Chhapola Agriculture Tractor Ledger AI",
    description="Python API connected with Firebase and AI for tractor account management",
    version="1.0.0",
    # Task 24: Hide docs in production to reduce public API surface
    docs_url="/api/docs" if not _IS_PROD else None,
    redoc_url="/api/redoc" if not _IS_PROD else None,
    openapi_url="/api/openapi.json" if not _IS_PROD else None,
    servers=[
        {
            "url": "https://tector-chhapola.onrender.com",
            "description": "Production (Render)",
        },
    ],
)


# ==========================================
# REQUEST SIZE LIMIT MIDDLEWARE
# ==========================================

@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    """Reject requests larger than MAX_REQUEST_BODY_BYTES."""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_BODY_BYTES:
        return Response(
            content=json.dumps({"detail": "Request too large"}),
            status_code=413,
            media_type="application/json",
        )
    response = await call_next(request)
    # Task 23: Security headers on every response
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    # Task 25: Structured logging for auth/rate-limit events
    logger.info(
        "%s %s %s",
        request.method,
        request.url.path,
        response.status_code,
    )
    return response

# ==========================================
# PHASE 3: SPARE PARTS SEARCH ROUTER
# ==========================================

app.include_router(spare_parts_router)


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
    "http://127.0.0.1:5174",
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

def _normalize_work(name: str) -> str:
    """Map common work-name variations to canonical values.

    Existing Firestore records may store "Displau" instead of "Display".
    This normalisation is display-only — we never mutate stored records.
    """
    _WORK_ALIASES = {
        "displau": "Display",
        "display": "Display",
        "calti": "Calti",
        "cultivator": "Calti",
        "morplau": "Morplau",
        "morplough": "Morplau",
        "hero": "Hero",
        "thresher": "Thresher",
        "spray machine": "Spray Machine",
        "spray": "Spray Machine",
        "pending balance": "Pending Balance",
        "mej (pata)": "Mej (Pata)",
    }
    return _WORK_ALIASES.get(name.strip().lower(), name)


_CROP_ALIASES = {
    "gehu": "Gehu",
    "gehoon": "Gehu",
    "gehun": "Gehu",
    "wheat": "Gehu",
    "chana": "Chana",
    "chickpea": "Chana",
    "bajra": "Bajra",
    "pearl millet": "Bajra",
    "guar": "Guar",
    "cluster bean": "Guar",
}


def _normalize_crop(name: str) -> str:
    """Map common crop-name variations to canonical values (display-only)."""
    return _CROP_ALIASES.get(name.strip().lower(), name)


def calculate_totals(record: dict) -> dict:
    """Calculate total and balance based on work type.

    Server is authoritative — client-supplied total/baki are replaced.
    NaN / Infinity values are clamped to 0.
    """
    # ---- sanitise inputs ----
    def _safe_float(v, default=0.0):
        try:
            f = float(v)
            if f != f or f == float("inf") or f == float("-inf"):
                return default
            return f
        except (TypeError, ValueError):
            return default

    work = _normalize_work(record.get("work", ""))
    bigha = max(_safe_float(record.get("bigha", 0)), 0)
    rate = max(_safe_float(record.get("rate", 0)), 0)
    paid = max(_safe_float(record.get("paid", 0)), 0)
    unit = max(_safe_float(record.get("unit", 0)), 0)
    time_str = record.get("time", "")

    if work == "Thresher":
        crop = _normalize_crop(record.get("crop", ""))
        if crop == "Bajra":
            total = bigha * rate  # Quintal
        else:
            # Parse time
            hours = 0
            if time_str:
                parts = time_str.replace("घंटा", "").replace("घंटे", "").replace("मिनट", "").split()
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
    record["total"] = round(total, 2)
    record["baki"] = round(baki, 2)
    record["work"] = work  # normalised
    record["crop"] = _normalize_crop(record.get("crop", ""))
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


def _get_record_owner(doc_data: dict) -> str:
    """Extract owner UID from record, handling both ownerUid (frontend Firestore)
    and owner_uid (backend API) field names."""
    return doc_data.get("owner_uid") or doc_data.get("ownerUid") or ""


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

    import re as _re
    import time as _time

    MAX_RETRIES = 2
    _req_start = _time.time()
    logger.info(f"[GEMINI] Request start | model={GEMINI_MODEL} | text_len={len(user_text)}")

    try:
        prompt_content = f"{SYSTEM_PROMPT}\n\nयूजर का सवाल/इन्फो: {user_text}" if user_text.strip() else SYSTEM_PROMPT

        parts = [{"text": prompt_content}]

        # If image is provided, add it as inline_data for Gemini Vision
        if body.image:
            raw_b64 = body.image
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

        req_timeout = 60 if body.image else 30
        # For image requests (scanner), do NOT retry on 429 — fail fast to save quota
        retryable_codes = {500, 502, 503, 504} if body.image else {429, 500, 502, 503, 504}
        last_error = None

        for attempt in range(1, MAX_RETRIES + 1):
            attempt_start = _time.time()
            try:
                response = requests.post(
                    f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                    json=payload,
                    headers=headers,
                    timeout=req_timeout,
                )
                attempt_time = round(_time.time() - attempt_start, 2)
                res_data = response.json()

                if response.status_code == 200 and "candidates" in res_data:
                    total_time = round(_time.time() - _req_start, 2)
                    model_ver = res_data.get("modelVersion", "unknown")
                    logger.info(f"[GEMINI] PASS | model={model_ver} | attempt={attempt} | time={total_time}s")
                    return res_data

                # Extract error info
                error_msg = res_data.get("error", {}).get("message", "Gemini API error")
                error_code = res_data.get("error", {}).get("code", response.status_code)

                # Parse retry-after from Google's error message
                retry_match = _re.search(r"retry in (\d+\.?\d*)s", error_msg, _re.IGNORECASE)
                retry_after = float(retry_match.group(1)) if retry_match else None

                logger.warning(f"[GEMINI] FAIL | attempt={attempt} | HTTP={response.status_code} | code={error_code} | time={attempt_time}s | retry_after={retry_after}s | error={error_msg[:200]}")

                # Non-retryable error — fail immediately
                if response.status_code not in retryable_codes and error_code not in retryable_codes:
                    total_time = round(_time.time() - _req_start, 2)
                    logger.error(f"[GEMINI] FATAL | HTTP={response.status_code} | not retryable | total_time={total_time}s")
                    raise HTTPException(status_code=response.status_code, detail=error_msg)

                # Retryable error — wait and retry
                if attempt < MAX_RETRIES:
                    wait_time = retry_after if retry_after else (attempt * 3)
                    # Cap wait at 30s
                    wait_time = min(wait_time, 10)
                    logger.info(f"[GEMINI] RETRY | waiting {wait_time}s before attempt {attempt + 1}")
                    _time.sleep(wait_time)
                    last_error = (response.status_code, error_msg)
                else:
                    last_error = (response.status_code, error_msg)

            except requests.Timeout:
                attempt_time = round(_time.time() - attempt_start, 2)
                logger.warning(f"[GEMINI] TIMEOUT | attempt={attempt} | time={attempt_time}s")
                if attempt < MAX_RETRIES:
                    _time.sleep(attempt * 2)
                    last_error = (504, "Gemini API timeout")
                else:
                    last_error = (504, "Gemini API timeout")

        # All retries exhausted
        total_time = round(_time.time() - _req_start, 2)
        status_code, error_msg = last_error if last_error else (502, "All retries failed")
        logger.error(f"[GEMINI] EXHAUSTED | {MAX_RETRIES} retries failed | final_status={status_code} | total_time={total_time}s")
        raise HTTPException(status_code=status_code, detail=error_msg)

    except HTTPException:
        raise
    except Exception as e:
        total_time = round(_time.time() - _req_start, 2)
        logger.exception(f"[GEMINI] ERROR | total_time={total_time}s")
        raise HTTPException(status_code=500, detail="Internal server error")


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
        logger.exception("process_ledger_ai error")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# SCANNER — DEDICATED OCR ENDPOINT
# ==========================================


class ScannerRequest(BaseModel):
    """Scanner OCR request — image only, no chat prompt needed."""
    prompt: str = Field(..., min_length=1, max_length=100000, description="OCR prompt from frontend scanner")
    image: str = Field(..., description="Base64 image data")
    mime_type: Optional[str] = Field(None, description="MIME type e.g. image/jpeg")


@app.post("/api/scanner", tags=["scanner"])
async def scanner_ocr(body: ScannerRequest, request: Request):
    """Dedicated endpoint for AI Scanner OCR.

    - No AI Munshi SYSTEM_PROMPT
    - Separate rate limit (15 req/min — scanner is heavier)
    - No retry on 429 (fail fast to save quota)
    - Only returns Gemini Vision OCR response
    """
    # Separate rate limit for scanner (heavier requests)
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip, max_requests=15):
        raise HTTPException(
            status_code=429,
            detail="Scanner rate limit reached. Please wait a moment and try again."
        )

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY not configured on server",
        )

    if not body.image:
        raise HTTPException(status_code=400, detail="Image is required for scanning")

    import time as _time

    # ---- Model configuration ----
    SCANNER_FALLBACK_MODEL = os.getenv(
        "SCANNER_FALLBACK_MODEL", "gemini-2.5-flash"
    )

    # Models to try, in order: primary (GEMINI_MODEL) → fallback
    _scanner_models = [GEMINI_MODEL, SCANNER_FALLBACK_MODEL]
    # Deduplicate while preserving order
    _seen = set()
    _scanner_models_unique = []
    for m in _scanner_models:
        if m and m not in _seen:
            _seen.add(m)
            _scanner_models_unique.append(m)

    _req_start = _time.time()
    logger.info(f"[SCANNER] Request start | models={_scanner_models_unique} | prompt_len={len(body.prompt)}")

    # ---- Build request parts (shared across all model attempts) ----
    parts = [{"text": body.prompt}]

    raw_b64 = body.image
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
    payload = {"contents": [{"parts": parts}]}

    # ---- 503 / overloaded codes that trigger model fallback ----
    _overloaded_codes = {503}

    # ---- Try each model ----
    for model_idx, model_name in enumerate(_scanner_models_unique):
        model_url = (
            f"https://generativelanguage.googleapis.com/v1beta/"
            f"models/{model_name}:generateContent"
        )
        is_last_model = (model_idx == len(_scanner_models_unique) - 1)

        # For each model: 1 attempt + 1 retry on 503
        MAX_RETRIES_PER_MODEL = 1
        last_error = None

        for attempt in range(1, MAX_RETRIES_PER_MODEL + 1):
            attempt_start = _time.time()
            try:
                response = requests.post(
                    f"{model_url}?key={GEMINI_API_KEY}",
                    json=payload,
                    headers=headers,
                    timeout=60,
                )
                attempt_time = round(_time.time() - attempt_start, 2)
                res_data = response.json()

                # ---- SUCCESS ----
                if response.status_code == 200 and "candidates" in res_data:
                    total_time = round(_time.time() - _req_start, 2)
                    model_ver = res_data.get("modelVersion", "unknown")
                    logger.info(f"[SCANNER] PASS | model={model_name} | version={model_ver} | attempt={attempt} | time={total_time}s")
                    return res_data

                # ---- ERROR ----
                error_msg = res_data.get("error", {}).get("message", "Gemini API error")
                error_code = res_data.get("error", {}).get("code", response.status_code)

                logger.warning(
                    f"[SCANNER] FAIL | model={model_name} | attempt={attempt} "
                    f"| HTTP={response.status_code} | code={error_code} "
                    f"| time={attempt_time}s | error={error_msg[:200]}"
                )

                # ---- 429 rate limit: fail fast, no retry ----
                if response.status_code == 429:
                    total_time = round(_time.time() - _req_start, 2)
                    logger.error(f"[SCANNER] RATE_LIMITED | model={model_name} | total_time={total_time}s")
                    raise HTTPException(
                        status_code=429,
                        detail="अभी AI Scanner व्यस्त है। कृपया कुछ सेकंड बाद फिर प्रयास करें।"
                    )

                # ---- 503 / overloaded: retry once, then fallback to next model ----
                if response.status_code in _overloaded_codes or error_code in _overloaded_codes:
                    if attempt < MAX_RETRIES_PER_MODEL:
                        # Exponential backoff: 2s, then 4s
                        wait_time = attempt * 2
                        logger.info(f"[SCANNER] OVERLOADED | model={model_name} | retrying in {wait_time}s")
                        _time.sleep(wait_time)
                        last_error = (response.status_code, error_msg)
                        continue
                    elif not is_last_model:
                        # Move to fallback model
                        logger.info(
                            f"[SCANNER] FALLBACK | model={model_name} overloaded | "
                            f"switching to {_scanner_models_unique[model_idx + 1]}"
                        )
                        break  # Break inner loop, continue outer loop to next model
                    else:
                        last_error = (response.status_code, error_msg)
                        break  # Last model, fall through to error
                else:
                    # Non-retryable, non-overloaded error (400, 401, 403)
                    total_time = round(_time.time() - _req_start, 2)
                    logger.error(
                        f"[SCANNER] FATAL | model={model_name} | HTTP={response.status_code} "
                        f"| not retryable | total_time={total_time}s"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="अभी AI Scanner उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।"
                    )

            except requests.Timeout:
                attempt_time = round(_time.time() - attempt_start, 2)
                logger.warning(f"[SCANNER] TIMEOUT | model={model_name} | attempt={attempt} | time={attempt_time}s")
                if attempt < MAX_RETRIES_PER_MODEL:
                    _time.sleep(2)
                    last_error = (504, "Gemini API timeout")
                    continue
                elif not is_last_model:
                    logger.info(f"[SCANNER] FALLBACK | model={model_name} timeout | switching to next model")
                    break  # Try next model
                else:
                    last_error = (504, "Gemini API timeout")
                    break

            except requests.ConnectionError:
                attempt_time = round(_time.time() - attempt_start, 2)
                logger.warning(f"[SCANNER] CONN_ERROR | model={model_name} | attempt={attempt} | time={attempt_time}s")
                if attempt < MAX_RETRIES_PER_MODEL:
                    _time.sleep(2)
                    last_error = (502, "Connection error")
                    continue
                elif not is_last_model:
                    break  # Try next model
                else:
                    last_error = (502, "Connection error")
                    break

        # If last_error is set and we exhausted this model, continue to next
        if last_error and is_last_model:
            total_time = round(_time.time() - _req_start, 2)
            status_code, _ = last_error
            logger.error(
                f"[SCANNER] EXHAUSTED | all models failed | final_status={status_code} "
                f"| models_tried={_scanner_models_unique} | total_time={total_time}s"
            )
            raise HTTPException(
                status_code=status_code,
                detail="अभी AI Scanner व्यस्त है। कृपया कुछ सेकंड बाद फिर प्रयास करें।"
            )

    # Should not reach here, but safety net
    total_time = round(_time.time() - _req_start, 2)
    logger.error(f"[SCANNER] UNEXPECTED_FALLTHROUGH | total_time={total_time}s")
    raise HTTPException(
        status_code=503,
        detail="अभी AI Scanner व्यस्त है। कृपया कुछ सेकंड बाद फिर प्रयास करें।"
    )


# ==========================================
# FARMER RECORDS CRUD APIs (with auth + ownership)
# ==========================================


@app.post("/api/records", tags=["records"])
async def create_record(record: RecordCreate, request: Request):
    """Add a new farmer record to Firestore. Requires auth."""
    token = await require_auth(request)

    try:
        record_data = record.model_dump()
        # Task 1b: Override client-supplied owner_uid with authenticated uid
        record_data["owner_uid"] = token["uid"]
        record_data = calculate_totals(record_data)
        now = datetime.utcnow().isoformat()
        record_data["created_at"] = now
        record_data["created_at_by"] = token["uid"]
        record_data["updated_at"] = now
        record_data["updated_at_by"] = token["uid"]

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
        logger.exception("create_record error")
        raise HTTPException(status_code=500, detail="Internal server error")


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

            # Task 20: Skip soft-deleted records
            if data.get("_deleted"):
                continue

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

        # Task 17: Sort by date (newest last — chronological)
        records.sort(key=lambda x: (x.get("date", ""), x.get("created_at", "")))

        return {"status": "success", "records": records, "count": len(records)}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("list_records error")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/records/{record_id}", tags=["records"])
async def get_record(record_id: str, request: Request):
    """Get a single record by ID. Requires auth + ownership."""
    token = await require_auth(request)

    try:
        doc = db.collection("records").document(record_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Record not found")

        data = doc.to_dict()
        data["id"] = doc.id

        # Task 1: Verify record belongs to authenticated user
        record_owner = _get_record_owner(data)
        if record_owner and record_owner != token.get("uid"):
            raise HTTPException(status_code=403, detail="Access denied")

        return {"status": "success", "record": data}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("get_record error")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.put("/api/records/{record_id}", tags=["records"])
async def update_record(record_id: str, updates: RecordUpdate, request: Request):
    """Update an existing farmer record (partial update). Requires auth + ownership."""
    token = await require_auth(request)

    try:
        doc = db.collection("records").document(record_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Record not found")

        # Task 1: Verify record belongs to authenticated user
        existing = doc.to_dict()
        record_owner = _get_record_owner(existing)
        if record_owner and record_owner != token.get("uid"):
            raise HTTPException(status_code=403, detail="Access denied")

        update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Recalculate totals if financial fields changed
        financial_fields = {"work", "bigha", "rate", "paid", "unit", "time", "crop", "total", "baki"}
        if financial_fields.intersection(update_data.keys()):
            merged = dict(existing)
            merged.update(update_data)
            recalculated = calculate_totals(merged)
            update_data["total"] = recalculated["total"]
            update_data["baki"] = recalculated["baki"]

        update_data["updated_at"] = datetime.utcnow().isoformat()
        update_data["updated_at_by"] = token["uid"]

        db.collection("records").document(record_id).update(update_data)

        return {
            "status": "success",
            "message": "Record updated successfully",
            "id": record_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("update_record error")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.delete("/api/records/{record_id}", tags=["records"])
async def delete_record(record_id: str, request: Request):
    """Delete a farmer record. Requires auth + ownership."""
    token = await require_auth(request)

    try:
        doc = db.collection("records").document(record_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Record not found")

        # Task 1: Verify record belongs to authenticated user
        record_owner = _get_record_owner(doc.to_dict())
        if record_owner and record_owner != token.get("uid"):
            raise HTTPException(status_code=403, detail="Access denied")

        # Task 20: Soft delete — mark as deleted instead of removing
        db.collection("records").document(record_id).update({
            "_deleted": True,
            "_deleted_at": datetime.utcnow().isoformat(),
            "_deleted_by": token["uid"],
        })

        return {"status": "success", "message": "Record deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("delete_record error")
        raise HTTPException(status_code=500, detail="Internal server error")


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

            # Task 20: Skip soft-deleted records
            if data.get("_deleted"):
                continue

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
        logger.exception("get_summary error")
        raise HTTPException(status_code=500, detail="Internal server error")


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
