import requests
import json
import os
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Groq API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable not set")
GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"  # Groq vision model


def analyze_medicine_image(image_bytes: bytes) -> dict:
    """
    Sends the raw image to Groq's vision model which reads the image directly.
    No OCR / Tesseract needed. Returns structured medicine info dict.
    """
    try:
        # Encode image to base64
        b64_image = base64.b64encode(image_bytes).decode("utf-8")

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        system_prompt = """You are a strict medical AI assistant specialized ONLY in medicines and pharmaceutical products.

STEP 1 - IDENTIFY: First, determine if this image shows a MEDICINE or pharmaceutical product.
Medicines include: tablets, capsules, syrups, ointments, injections, medical strips, prescription drugs, OTC drugs, supplements, vitamins.
NOT medicines: food, beverages, soft drinks (Coca-Cola, Pepsi), chocolates, snacks, cosmetics, household items, or anything not pharmaceutical.

STEP 2 - REJECT if NOT medicine:
If the image does NOT show a medicine/pharmaceutical product, return ONLY this JSON:
{
    "not_medicine": true,
    "error": "This does not appear to be a medicine. Please scan a medicine strip, tablet box, or medicine bottle."
}

STEP 3 - EXTRACT if IS medicine:
If it IS a medicine, return ONLY this JSON (no markdown, no explanation):
{
    "not_medicine": false,
    "name": "Brand Name of medicine (from the image)",
    "generic_name": "Generic / chemical name",
    "purpose": "What this medicine is used for",
    "who_can_take": "Which age groups or patient types can use it",
    "dosage": "Common dosage guidelines",
    "food_instruction": "Take with food / empty stomach etc.",
    "warnings": "Side effects and important warnings",
    "doctor_consultation_required": true or false,
    "expiry_date": "YYYY-MM-DD if visible in image, else null",
    "is_expired": false,
    "expiry_message": "Valid / Expired / Expiry not visible"
}

Be STRICT. Do NOT guess or treat food/drink products as medicines. If unsure, reject with not_medicine: true."""

        payload = {
            "model": GROQ_VISION_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": system_prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{b64_image}"
                            }
                        }
                    ]
                }
            ],
            "temperature": 0.1,
            "max_tokens": 1024
        }

        print("DEBUG: Sending image to Groq Vision model...")
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)

        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            print(f"DEBUG: Groq Vision HTTP Error: {response.status_code} {response.text}")
            return {"error": f"Groq Vision API Error: {response.status_code} — {response.text[:200]}"}

        result = response.json()
        if 'choices' not in result or not result['choices']:
            return {"error": "Groq Vision returned no choices"}

        content = result['choices'][0]['message']['content']
        print(f"DEBUG: Groq Vision response: {content[:200]}")

        # Parse JSON from response
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Strip markdown code fences if present
            clean = content.replace("```json", "").replace("```", "").strip()
            # Find first { to last }
            start = clean.find("{")
            end = clean.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(clean[start:end])
            return {"error": f"Could not parse JSON from Groq Vision: {content[:200]}"}

    except Exception as e:
        print(f"Groq Vision Error: {e}")
        return {"error": str(e)}

def analyze_medicine_text(text: str):
    """
    Analyzes OCR text using Groq (Llama 3.3) to extract medicine details.
    Returns a structured dictionary.
    """
    try:
        if not text or len(text.strip()) < 5:
            return {"error": "Text too short for analysis"}

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        # Prompt engineering for Groq/Llama
        system_prompt = """
        You are an expert medical AI assistant. Your task is to analyze OCR text from medicine packaging and extract structured information.
        ACT LIKE A MEDICAL SEARCH ENGINE. Search your internal knowledge base for real-world details based on the recognized name.
        
        Provide:
        - Name (Brand) and Generic Name
        - Purpose (What is it used for?)
        - Who can take it? (Age groups, safety)
        - Common Dosage (General usage)
        - Warnings (Side effects, precautions)
        - Is doctor consultation required? (Boolean)
        
        Return ONLY a raw JSON object with this structure:
        {
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
        }
        """

        user_content = f"Here is the OCR text from a medicine image:\n\n{text}"

        payload = {
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.1, # Low temperature for factual extraction
            "response_format": {"type": "json_object"} # Force JSON mode
        }
        
        print(f"DEBUG: Sending request to Groq ({GROQ_MODEL})...")
        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            return {"error": f"Groq API Error: {response.status_code} {response.text}"}

        result = response.json()
        
        if 'choices' not in result or not result['choices']:
             return {"error": "Groq returned no choices"}

        content = result['choices'][0]['message']['content']
        
        # Parse JSON
        try:
            data = json.loads(content)
            return data
        except json.JSONDecodeError:
            # Fallback cleanup if needed (Llama 3 usually listens to json_object mode well)
            clean_content = content.replace('```json', '').replace('```', '').strip()
            return json.loads(clean_content)

    except Exception as e:
        print(f"Groq API Error: {e}")
        return {"error": str(e)}

def get_consultation_details(query: str):
    """
    Analyzes a raw search query (e.g., 'headache') and determines what patient details 
    are needed for a safe recommendation.
    """
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        system_prompt = """
        You are a medical triage assistant. Your goal is to identify if a user's query is a symptom/condition that requires patient context.
        
        If the query is a specific medicine name (e.g. "Dolo 650"), return {"type": "medicine_search", "query": "..."}.
        If the query is a symptom (e.g. "headache", "fever", "stomach pain"), you MUST ask for patient details.
        
        Return JSON:
        {
            "type": "consultation_needed", 
            "required_fields": ["age", "gender", "pregnancy_status", "duration_of_symptoms"]
        }
        OR
        {
            "type": "medicine_search",
            "query": "cleaned medicine name"
        }
        """
        
        payload = {
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User Query: {query}"}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return json.loads(response.json()['choices'][0]['message']['content'])

    except Exception as e:
        print(f"Groq Consultation Error: {e}")
        return {"type": "error", "message": str(e)}

def get_medical_recommendation(context: dict):
    """
    Provides a recommendation based on patient details and symptoms.
    context = { "query": "headache", "age": "5", "gender": "male", ... }
    """
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        system_prompt = """
        You are an AI Doctor Assistant. You are provided with a patient's symptoms and demographic details.
        
        Rules:
        1. WARNING: If the patient is a young child (age < 5), be extremely careful. You MUST primarily advise seeing a Pediatrician or a general doctor. DO NOT provide extensive medical treatment plans for young children.
        2. If symptoms are severe or duration is > 3 days, advise seeing a doctor immediately.
        3. For patients age 5 and above, suggest common OTC medicines ONLY if suitable and safe. When suggesting dosage, DO NOT give hourly schedules (like "every 6 hours"). Instead, clearly state the total milligrams (mg) or total amount they should take at one time (e.g., "Take 500mg").
        4. Provide an action plan and warnings.
        
        Return ONLY a JSON object with EXACTLY this structure:
        {
            "urgency": "Normal" | "High",
            "assessment": "Detailed clinical assessment of the symptoms...",
            "recommendations": [
                {
                    "name": "Medicine Name",
                    "dosage": "Suggested Dosage",
                    "food_instruction": "Before food / After food / On empty stomach - DO NOT LEAVE EMPTY",
                    "timing": "Morning / Afternoon / Night / Morning & Night etc",
                    "reason": "Why this is recommended"
                }
            ],
            "medical_advice": [
                "Drink plenty of fluids",
                "Rest for 2 days"
            ],
            "when_to_see_doctor": "Specific signs to watch out for...",
            "action_plan": "Step by step plan for the next 48 hours"
        }
        """
        
        user_content = f"Patient Details: {json.dumps(context)}"
        
        payload = {
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return json.loads(response.json()['choices'][0]['message']['content'])

    except Exception as e:
        print(f"Groq Recommendation Error: {e}")
        return {"error": str(e)}
