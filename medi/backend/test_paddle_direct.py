from paddleocr import PaddleOCR
import io
import numpy as np
from PIL import Image

print("Testing PaddleOCR directly...")

# Try different initialization options
try:
    print("\n1. Testing: PaddleOCR(lang='en')")
    ocr1 = PaddleOCR(lang='en')
    print("✅ Initialization successful")
    
    # Load test image
    image_path = r"C:/Users/sanja/.gemini/antigravity/brain/31ef6828-86bf-41b3-b10c-ce3fe2c80681/medicine_test_sample_1768900930523.png"
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_array = np.array(image)
    
    print("\n2. Testing: ocr.ocr(img_array)")
    result = ocr1.ocr(img_array)
    print(f"✅ OCR successful! Result type: {type(result)}")
    
    if result and result[0]:
        print(f"✅ Found {len(result[0])} text regions")
        for i, line in enumerate(result[0][:3]):  # Show first 3
            text, score = line[1]
            print(f"   - Text: '{text}' (confidence: {score:.2f})")
    else:
        print("⚠️ No text detected")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
