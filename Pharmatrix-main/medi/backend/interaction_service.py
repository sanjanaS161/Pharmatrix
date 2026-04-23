import requests
import json
from groq_service import GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL

def check_drug_interactions(medicines: list[dict]) -> dict:
    """
    Takes a list of medicine objects from the cabinet, extracts active ingredients,
    and checks for potential interactions using Groq AI.
    """
    if not medicines or len(medicines) < 2:
        return {"interactions": [], "status": "safe", "message": "At least two medicines are required for interaction check."}

    # Prepare a concise list of medicines for the prompt
    med_list = []
    for m in medicines:
        med_list.append({
            "name": m.get("name"),
            "type": m.get("type"),
            "dosage": m.get("dosage_instructions")
        })

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    system_prompt = """You are a professional pharmaceutical safety system.
Your task is to analyze a list of medicines in a user's cabinet and identify potential negative drug-drug interactions.

STEP 1: Identify the active ingredients for each medicine provided.
STEP 2: Check for known interactions between any combinations of these medicines.
STEP 3: For each interaction found, provide:
- The medicines involved (e.g., "Ibuprofen + Warfarin")
- Severity (High, Moderate, Low)
- Risk explanation (Why it happens)
- Safety recommendation (What the user should do)

Return ONLY a JSON object with this structure:
{
    "interactions": [
        {
            "medicines": "Med A + Med B",
            "severity": "High/Moderate/Low",
            "risk": "Description of the risk",
            "explanation": "Detailed explanation of why it happens",
            "recommendation": "Professional safety advice"
        }
    ],
    "status": "warning" (if interactions exist) or "safe" (if none found)
}

If NO interactions are found, return:
{
    "interactions": [],
    "status": "safe",
    "message": "No drug interactions detected. Your medicines appear safe to take together."
}

Be accurate and prioritize safety. Use professional medical terminology but keep it understandable."""

    user_content = f"Check these medicines for interactions:\n{json.dumps(med_list, indent=2)}"

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }

    try:
        print(f"DEBUG: Checking interactions for {len(medicines)} medicines...")
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        return json.loads(content)

    except Exception as e:
        print(f"Error checking interactions: {e}")
        return {"interactions": [], "status": "error", "message": f"Failed to check interactions: {str(e)}"}
