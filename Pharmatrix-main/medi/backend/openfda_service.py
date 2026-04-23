import requests
import re

OPENFDA_ENDPOINT = "https://api.fda.gov/drug/label.json"

# Fallback/Local Brand Mapping
BRAND_MAPPINGS = {
    "DOLO": "PARACETAMOL",
    "CROCIN": "PARACETAMOL",
    "CALPOL": "PARACETAMOL",
    "COMBIFLAM": "IBUPROFEN",
    "DISPRIN": "ASPIRIN",
    "ALLEGRA": "FEXOFENADINE",
    "OTRIVIN": "XYLOMETAZOLINE",
    "BRUFEN": "IBUPROFEN"
}

def get_medicine_details(medicine_name: str):
    try:
        query_name = medicine_name.upper()
        
        # 1. Check Brand Mapping
        # If we find "DOLO", we search for "PARACETAMOL" instead
        for brand, generic in BRAND_MAPPINGS.items():
            if brand in query_name:
                query_name = generic
                break
                
        # Search primarily by brand_name or generic_name
        params = {
            'search': f'openfda.brand_name:"{query_name}"+openfda.generic_name:"{query_name}"',
            'limit': 1
        }
        response = requests.get(OPENFDA_ENDPOINT, params=params)
        data = response.json()
        
        if 'results' in data and len(data['results']) > 0:
            result = data['results'][0]
            
            # Extract Food Instructions
            dosage = result.get('dosage_and_administration', [''])[0]
            warnings = result.get('warnings', [''])[0]
            food_instruction = extract_food_instruction(dosage + " " + warnings)
            
            info = {
                "name": medicine_name.title(), # Return original name (e.g. Dolo)
                "generic_name": result.get('openfda', {}).get('generic_name', [query_name])[0],
                "purpose": result.get('purpose', ['Not available'])[0],
                "warnings": warnings,
                "dosage_and_administration": dosage,
                "food_instruction": food_instruction
            }
            return info
        else:
            return None
    except Exception as e:
        print(f"OpenFDA Error: {e}")
        return None

def extract_food_instruction(text: str):
    """
    Simple heuristic to find food related instructions.
    """
    text_lower = text.lower()
    
    # Common phrases
    if "after food" in text_lower or "after meal" in text_lower or "with food" in text_lower:
        return "Take after food or with a meal."
    if "before food" in text_lower or "empty stomach" in text_lower:
        return "Take on an empty stomach, before food."
    
    return None
