import requests
import base64
import json
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

def analyze_medicine_image(image_bytes: bytes):
    """
    Sends image to Gemini 1.5 Flash to identify medicine and extract details.
    """
    try:
        # Encode image to base64
        b64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        prompt = """
        You are a medical assistant. Analyze this image of a medicine (tablet/syrup/packaging).
        Identify the medicine Name (Brand) and Generic Name.
        Provide its Purpose (short usage), Food Instructions (e.g. before/after food), and Warnings.
        Also check for Expiry Date in the image.

        Return ONLY a raw JSON object with this structure (no markdown):
        {
            "name": "Brand Name",
            "generic_name": "Generic Name",
            "purpose": "Short purpose description",
            "food_instruction": "Specific food instruction or 'Follow doctor advice'",
            "warnings": "Important warnings",
            "expiry_date": "YYYY-MM-DD or null",
            "is_expired": boolean,
            "expiry_message": "string description of expiry"
        }
        
        If image is unclear or not a medicine, return {"error": "Not a medicine"}
        """
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": b64_image
                        }
                    }
                ]
            }]
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # Using gemini-2.0-flash-lite-001 (Stable Lite version from list)
        url = f"{GEMINI_BASE_URL}/gemini-2.0-flash-lite-001:generateContent?key={GEMINI_API_KEY}"
        
        response = requests.post(url, headers=headers, json=payload)
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            return {"error": f"Gemini API Error: {response.status_code} {response.reason}"}
        
        result = response.json()
        
        # Parse text response
        text_content = result['candidates'][0]['content']['parts'][0]['text']
        
        # Clean markdown if present
        text_content = text_content.replace('```json', '').replace('```', '').strip()
        
        data = json.loads(text_content)
        return data

    except Exception as e:
        print(f"Gemini API Error (Image): {e}")
        return None

def analyze_medicine_text(text: str):
    """
    Sends raw OCR text to Gemini Pro (Text) to identify medicine and extract details.
    Useful when image analysis fails or is skipped.
    """
    try:
        prompt = f"""
        You are a medical assistant. I have extracted some text from a medicine image using OCR. 
        The text might be messy or contain typos.
        
        OCR Text:
        "{text}"
        
        Identify the medicine Name (Brand) and Generic Name from this text.
        ACT LIKE A MEDICAL SEARCH ENGINE. Search your internal knowledge base for real-world details.
        
        Provide:
        - Purpose (What is it used for?)
        - Who can take it? (Age groups, safety for pregnant/kids)
        - Common Dosage (General usage, NOT specific prescription)
        - Warnings (Side effects, precautions)
        - Is doctor consultation required? (Boolean)

        Return ONLY a raw JSON object with this structure (no markdown):
        {{
            "name": "Brand Name",
            "generic_name": "Generic Name",
            "purpose": "Detailed purpose description",
            "who_can_take": "Information on eligible age groups/conditions",
            "dosage": "Common dosage guidelines",
            "food_instruction": "Specific food instruction",
            "warnings": "Important warnings and side effects",
            "doctor_consultation_required": boolean,
            "expiry_date": "YYYY-MM-DD or null (if found in text)",
            "is_expired": boolean,
            "expiry_message": "string description of expiry status"
        }}
        
        If the text is gibberish or not a medicine, return {{"error": "Not a medicine"}}
        """
        
        payload = {
            "contents": [{
                "parts": [
                    { "text": prompt }
                ]
            }]
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # Use gemini-2.0-flash-lite-001 (Stable Lite version)
        url = f"{GEMINI_BASE_URL}/gemini-2.0-flash-lite-001:generateContent?key={GEMINI_API_KEY}"
        
        response = requests.post(url, headers=headers, json=payload)
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            return {"error": f"Gemini API Error: {response.status_code} {response.reason}"}
        
        result = response.json()
        
        # Parse text response
        if 'candidates' not in result or not result['candidates']:
             return {"error": "Gemini returned no candidates (Safety Block?)"}

        text_content = result['candidates'][0]['content']['parts'][0]['text']
        
        # Clean markdown if present
        text_content = text_content.replace('```json', '').replace('```', '').strip()
        
        data = json.loads(text_content)
        return data

    except Exception as e:
        print(f"Gemini Text API Error: {e}")
        return {"error": str(e)}
