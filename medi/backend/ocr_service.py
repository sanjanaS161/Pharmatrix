"""
OCR Service with enhanced preprocessing for better medicine text recognition.
Priority: Tesseract with multiple image enhancement passes > fallback message
"""
import io
import re
from PIL import Image, ImageEnhance, ImageFilter
from datetime import datetime

TESSERACT_AVAILABLE = False
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
    print("✅ OCR Engine: Tesseract (pytesseract) loaded successfully")
except ImportError:
    print("⚠️ pytesseract not available")

def preprocess_variants(original_image: Image.Image):
    """
    Returns a list of (label, image, config) tuples using different
    preprocessing strategies for maximum OCR coverage.
    """
    variants = []

    # ── 1. Original ──────────────────────────────────────
    variants.append(("original", original_image, "--psm 6"))

    # ── 2. Grayscale ──────────────────────────────────────
    gray = original_image.convert("L")
    variants.append(("gray", gray, "--psm 6"))

    # ── 3. 2× Upscale + Grayscale (great for small text) ──
    w, h = gray.size
    upscaled = gray.resize((w * 2, h * 2), Image.LANCZOS)
    variants.append(("upscaled-2x", upscaled, "--psm 6"))

    # ── 4. High Contrast ──────────────────────────────────
    contrast = ImageEnhance.Contrast(gray).enhance(2.5)
    variants.append(("high-contrast", contrast, "--psm 6"))

    # ── 5. Sharpen + Contrast ─────────────────────────────
    sharpened = gray.filter(ImageFilter.SHARPEN).filter(ImageFilter.SHARPEN)
    sharpened = ImageEnhance.Contrast(sharpened).enhance(2.0)
    variants.append(("sharpen+contrast", sharpened, "--psm 6"))

    # ── 6. Upscale + Sharpen (best for blurry images) ─────
    up_sharp = upscaled.filter(ImageFilter.SHARPEN)
    up_sharp = ImageEnhance.Contrast(up_sharp).enhance(2.0)
    variants.append(("upscaled+sharp", up_sharp, "--psm 6"))

    # ── 7. Binary threshold (Otsu-style via point) ────────
    threshold = gray.point(lambda x: 255 if x > 128 else 0, "L")
    variants.append(("binary-threshold", threshold, "--psm 6"))

    # ── 8. Upscale + Binary threshold ─────────────────────
    up_thresh = upscaled.point(lambda x: 255 if x > 128 else 0, "L")
    variants.append(("upscaled-threshold", up_thresh, "--psm 6"))

    # ── 9. Auto-detect page layout ────────────────────────
    variants.append(("auto-layout", gray, "--psm 3"))

    # ── 10. Sparse text (good for medicine strips) ─────────
    variants.append(("sparse-text", upscaled, "--psm 11"))

    return variants


def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extracts text from image using multiple Tesseract OCR strategies.
    Returns the best result (most alphanumeric characters found).
    """
    if not TESSERACT_AVAILABLE:
        return "Error: OCR library not available. Please install pytesseract."

    try:
        original_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        print(f"🔍 Processing image: {original_image.size} pixels")

        variants = preprocess_variants(original_image)
        best_text = ""
        best_score = -1

        print("📊 OCR Results:")
        for label, img, config in variants:
            try:
                raw = pytesseract.image_to_string(img, config=config)
                cleaned = raw.strip()
                # Score: count alphanumeric characters (more = better)
                score = sum(c.isalnum() for c in cleaned)
                print(f"   [{label}] score={score} | preview: {cleaned[:60].replace(chr(10), ' ')}...")
                if score > best_score:
                    best_score = score
                    best_text = cleaned
            except Exception as e:
                print(f"   [{label}] ERROR: {e}")

        if best_score == 0:
            print("⚠️ No text detected in any OCR pass")
            return "No text detected. Please ensure the image is clear, well-lit, and the medicine label is visible."

        print(f"✅ Best result: score={best_score}, text={best_text[:80].replace(chr(10), ' ')}...")
        return best_text

    except Exception as e:
        error_msg = str(e)
        print(f"❌ OCR Error: {error_msg}")
        if "tesseract is not installed" in error_msg.lower() or "not found" in error_msg.lower():
            return "Error: Tesseract is not installed. Install from: https://github.com/UB-Mannheim/tesseract/wiki"
        return f"Error: {error_msg}"


def find_expiry_date(text: str):
    """Find and parse expiry date from OCR text"""
    lines = text.split('\n')
    for line in lines:
        upper_line = line.upper()
        if 'EXP' in upper_line or 'USE BY' in upper_line or 'DT' in upper_line:
            date_match = re.search(r'\b(\d{1,2}[./-]\d{4}|\d{1,2}[./-]\d{2}[./-]\d{2,4})\b', line)
            if date_match:
                d, msg = parse_date(date_match.group(0))
                if d:
                    return d, msg

    match = re.search(r'\b(0[1-9]|1[0-2])[./-]20(2[3-9]|3[0-5])\b', text)
    if match:
        d, msg = parse_date(match.group(0))
        if d:
            return d, msg

    return None, "Expiry date not found in image."


def parse_date(date_str):
    """Parse date string to date object"""
    try:
        date_str = date_str.replace('-', '/')
        parts = date_str.split('/')
        if len(parts) == 2:
            return datetime.strptime(date_str, "%m/%Y").date(), "Date found"
        if len(parts) == 3:
            try:
                return datetime.strptime(date_str, "%d/%m/%Y").date(), "Date found"
            except:
                return datetime.strptime(date_str, "%m/%d/%Y").date(), "Date found"
        return None, "Invalid date format"
    except Exception as e:
        return None, str(e)
