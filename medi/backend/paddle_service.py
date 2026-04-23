import io
import numpy as np
from PIL import Image
import re

# Try to import OCR libraries in order of preference
OCR_ENGINE = None

try:
    from paddleocr import PaddleOCR
    # Initialize without use_angle_cls to avoid cls parameter error
    ocr = PaddleOCR(lang='en', use_angle_cls=False, show_log=False)
    OCR_ENGINE = "PaddleOCR"
    print("✅ OCR Engine: PaddleOCR loaded successfully")
except Exception as e:
    print(f"⚠️ PaddleOCR not available: {e}")
    ocr = None

def extract_text(image_bytes: bytes) -> str:
    """
    Extracts raw text from image bytes using available OCR engine.
    Returns joined string of all detected text.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(image)
        
        if OCR_ENGINE == "PaddleOCR" and ocr is not None:
            print("🔍 Using PaddleOCR for text extraction...")
            
            # Run OCR without cls parameter
            result = ocr.ocr(img_array, cls=False)
            
            if not result or result[0] is None:
                print("⚠️ PaddleOCR returned no results")
                return ""

            extracted_lines = []
            for line in result[0]:
                text, score = line[1]
                if score > 0.5:  # Confidence threshold
                    extracted_lines.append(text)
                    print(f"   📝 Detected: '{text}' (confidence: {score:.2f})")
                
            final_text = "\n".join(extracted_lines)
            print(f"✅ Extracted {len(extracted_lines)} text lines")
            return final_text
        else:
            # Fallback: Return a helpful error message
            error_msg = "OCR engine not available. Please install Tesseract or configure PaddleOCR."
            print(f"❌ {error_msg}")
            return f"Error: {error_msg}"
        
    except Exception as e:
        error_msg = f"OCR extraction failed: {str(e)}"
        print(f"❌ {error_msg}")
        import traceback
        traceback.print_exc()
        return f"Error: {error_msg}"

def extract_clean_data(image_bytes: bytes) -> dict:
    """
    Runs OCR and applies Regex filters to find:
    - Medicine Name (Heuristic)
    - Strength (e.g. 500mg)
    - Expiry Date
    """
    print("\n🔬 Starting OCR extraction...")
    text = extract_text(image_bytes)
    
    if text.startswith("Error:"):
        print(f"❌ OCR Error: {text}")
        return {
            "ocr_text": text,
            "name": None,
            "strength": None,
            "expiry_date": None
        }
    
    lines = text.split('\n')
    
    data = {
        "ocr_text": text,
        "name": None,
        "strength": None,
        "expiry_date": None
    }
    
    # --- REGEX FILTERS ---
    
    # 1. Strength (e.g. 500 mg, 650mg, 10ml, 5g)
    strength_pattern = re.compile(r'\b\d+\.?\d*\s?(mg|ml|mcg|g)\b', re.IGNORECASE)
    
    # 2. Expiry Date (e.g. Exp: 12/2025, Use By: Nov 2024, 05/26)
    expiry_pattern = re.compile(r'(EXP|USE BY|DT)[\s:.]*(\d{2}[/.-]\d{2,4})', re.IGNORECASE)
    
    # 3. Noise / Logos to Ignore
    noise_keywords = ["LTD", "PVT", "MFG", "BATCH", "NO.", "MRP", "INDIA", "REGD", "TRADE", "MARK", "PHARMA", "LABS"]
    
    possible_names = []
    
    for line in lines:
        clean_line = line.strip()
        
        # Check Strength
        if not data["strength"]:
            match = strength_pattern.search(clean_line)
            if match:
                data["strength"] = match.group(0)
                print(f"   💊 Found strength: {data['strength']}")
                
        # Check Expiry
        if not data["expiry_date"]:
            match = expiry_pattern.search(clean_line)
            if match:
                data["expiry_date"] = match.group(2)
                print(f"   📅 Found expiry: {data['expiry_date']}")
        
        # Check Name Candidates
        if len(clean_line) > 3 and not strength_pattern.match(clean_line):
           is_noise = any(keyword in clean_line.upper() for keyword in noise_keywords)
           if not is_noise:
               possible_names.append(clean_line)
                
    # Heuristic for Name
    for candidate in possible_names:
        if candidate.upper() in ["TABLETS", "CAPSULES", "INJECTION", "SYRUP", "USP", "IP"]:
            continue
        data["name"] = candidate
        print(f"   🏷️ Found medicine name: {data['name']}")
        break
    
    print(f"✅ OCR data extraction complete")
    return data
