import requests
import sys

# Test the /scan endpoint with a sample image
API_URL = "http://localhost:8000"
image_path = r"C:/Users/sanja/.gemini/antigravity/brain/31ef6828-86bf-41b3-b10c-ce3fe2c80681/medicine_test_sample_1768900930523.png"

print("🧪 Testing OCR Scanner Endpoint...")
print(f"📸 Image: {image_path}")

try:
    with open(image_path, 'rb') as f:
        files = {'file': ('test.png', f, 'image/png')}
        response = requests.post(f"{API_URL}/scan", files=files)
    
    print(f"\n✅ Response Status: {response.status_code}")
    print(f"📦 Response Data:")
    
    import json
    result = response.json()
    print(json.dumps(result, indent=2))
    
    # Save to file for detailed analysis
    with open('test_result.json', 'w') as f:
        json.dump(result, f, indent=2)
    print("\n💾 Full result saved to test_result.json")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
