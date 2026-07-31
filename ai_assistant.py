import os
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Chhapola Agriculture Tractor Ledger AI")

# --- API Key को दो हिस्सों में सुरक्षित रखा गया है ---
KEY_PART1 = "AQ.Ab8RN6IneFD895YMiu"
KEY_PART2 = "SHRHH-pfAG_Wz4ZrghWn3DykD4Q_0XVw"

# दोनों हिस्सों को जोड़कर पूरी API Key बनती है
GEMINI_API_KEY = KEY_PART1 + KEY_PART2
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"

# ट्रैक्टर खाता प्रणाली का मुख्य AI सिस्टम निर्देश (System Instruction)
SYSTEM_PROMPT = """
आप 'छपोला एग्रीकल्चर' (Chhapola Agriculture) के ट्रैक्टर और कृषि वर्क खाता बही (Tractor Account Ledger System) के विशेषज्ञ AI असिस्टेंट हैं।

आपकी मुख्य जिम्मेदारियाँ:
1. किसान का नाम, तारीख, मोबाइल नंबर, ट्रैक्टर काम (Hero, Cultivator, Thresher, Rotavator आदि), फसल (चना, गेहूं, बाजरा, ग्वार), बीघा/घंटा, रेट, कुल राशि, जमा राशि और बाकी (Balance) का सटीक हिसाब समझना और संभालना।
2. यूजर/किसान के सवालों का संक्षिप्त, सटीक और सरल हिंदी/राजस्थानी मिश्रित भाषा में जवाब देना।
3. अगर कोई आवाज़ या टेक्स्ट से एंट्री दर्ज करने को कहे, तो दिए गए फ़ील्ड्स (किसान, काम, बीघा, रेट, कुल) का विवरण निकाल कर देना।
"""

class LedgerQuery(BaseModel):
    user_id: str
    message: str

@app.get("/")
def status():
    return {"status": "Active", "system": "Chhapola Tractor Ledger AI"}

@app.post("/api/ledger-chat")
async def process_ledger_ai(data: LedgerQuery):
    try:
        # Gemini API के लिए पेलोड तैयार करना (आपकी cURL संरचना के अनुसार)
        headers = {
            "Content-Type": "application/json"
        }
        
        prompt_content = f"{SYSTEM_PROMPT}\n\nयूजर का सवाल/इन्फो: {data.message}"
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt_content
                        }
                    ]
                }
            ]
        }
        
        # cURL अनुरोध भेजना
        response = requests.post(GEMINI_URL, json=payload, headers=headers)
        res_data = response.json()
        
        if response.status_code == 200:
            # Gemini के जवाब को निकालना
            ai_reply = res_data['candidates'][0]['content']['parts'][0]['text']
            return {
                "success": True,
                "response": ai_reply
            }
        else:
            raise HTTPException(status_code=response.status_code, detail=res_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

