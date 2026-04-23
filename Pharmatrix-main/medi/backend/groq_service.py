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
    pass

GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"  # Groq vision model


def analyze_medicine_image(image_bytes: bytes) -> dict:
    try:
        import base64
        import requests
        import json
        import os

        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

        b64_image = base64.b64encode(image_bytes).decode("utf-8")

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        prompt = """
            You are a medical image analyzer.

            If the image contains a medicine, return JSON:

        {
        "is_medicine": true,
        "name": "",
        "generic_name": "",
        "purpose": "",
        "dosage": "",
        "warnings": ""
        }

    If the image is NOT a medicine (like food, drink, or random object), return:

{
    "is_medicine": false
}

Return ONLY JSON. No explanation.
"""

        payload = {
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{b64_image}"
                            }
                        }
                    ]
                }
            ],
            "temperature": 0.2
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]

        # clean markdown if any
        content = content.replace("```json", "").replace("```", "").strip()

        data = json.loads(content)
        if not data.get("is_medicine"):
            return {
            "not_medicine": True,
            "message": "Not a medicine. Please upload a valid medicine image."
             }

        return {
            "not_medicine": False,
            "name": data.get("name"),
            "generic_name": data.get("generic_name"),
            "purpose": data.get("purpose"),
            "who_can_take": "Consult doctor",
            "dosage": data.get("dosage"),
            "food_instruction": "After food",
            "warnings": data.get("warnings"),
            "doctor_consultation_required": True,
            "expiry_date": None,
            "is_expired": False,
            "expiry_message": "Check manually"
        }

    except Exception as e:
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
