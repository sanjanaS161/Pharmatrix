import requests
import json
from groq_service import GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL

def generate_personalized_diet_plan(user_data: dict) -> dict:
    """
    Generates a truly personalized diet plan using Groq AI based on user profile.
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    system_prompt = """You are a highly skilled clinical nutritionist AI.
Generate a comprehensive, personalized daily meal plan based on the user's health profile.

FORMAT REQUIREMENTS:
- Provide specific food items for each meal.
- Tailor suggestions strictly to the health condition (e.g., low glycemic for Diabetes).
- Respect dietary preferences (Veg/Non-Veg/Vegan).
- Be mindful of allergies.
- Include hydration and snack advice.

Return ONLY a JSON object with this exact structure:
{
    "title": "Personalized Nutrition Plan",
    "breakfast": ["Food 1", "Food 2"],
    "lunch": ["Food 1", "Food 2"],
    "dinner": ["Food 1", "Food 2"],
    "snacks": ["Snack 1", "Snack 2"],
    "hydration": ["Suggestion 1", "Suggestion 2"],
    "health_notes": "A brief explanation of why this plan fits the condition."
}
"""

    user_query = f"""
    User Profile:
    - Age: {user_data.get('age')}
    - Gender: {user_data.get('gender')}
    - Height: {user_data.get('height')} cm
    - Weight: {user_data.get('weight')} kg
    - Condition: {user_data.get('condition')}
    - Preference: {user_data.get('preference')}
    - Allergies: {user_data.get('allergies')}
    - Activity Level: {user_data.get('activity_level')}
    """

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate a personalized diet plan for this user: {user_query}"}
        ],
        "temperature": 0.3,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=25)
        response.raise_for_status()
        result = response.json()
        return json.loads(result['choices'][0]['message']['content'])
    except Exception as e:
        print(f"Error generating personalized diet: {e}")
        return {
            "title": "Basic Balanced Plan (Fallback)",
            "breakfast": ["Oatmeal with nuts", "Green tea"],
            "lunch": ["Grilled chicken/tofu salad", "Quinoa"],
            "dinner": ["Baked fish/lentils", "Steamed vegetables"],
            "snacks": ["Greek yogurt", "Handful of almonds"],
            "hydration": ["2-3 liters of water", "Herbal infusions"],
            "health_notes": "This is a general balanced plan. Please check your connection for a personalized result."
        }

def get_diet_recommendations(category: str, user_context: dict = None) -> dict:
    """
    Provides diet recommendations based on category (Age, Pregnancy, Medicine, Health)
    using Groq AI.
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    system_prompt = """You are a professional nutritionist AI.
Provide simple, minimal diet recommendations based on the user's selected category.

FORMAT REQUIREMENTS:
- Keep information short and easy to scan.
- Use bullet points.
- Avoid long paragraphs.
- Provide only 4-6 items for each section.

Return ONLY a JSON object with this structure:
{
    "category": "Category Name",
    "title": "Short Descriptive Title",
    "recommended_foods": ["Food 1", "Food 2", ...],
    "foods_to_avoid": ["Food 1", "Food 2", ...],
    "tips": ["Tip 1", "Tip 2"]
}
"""

    user_query = f"Category: {category}\n"
    if user_context:
        user_query += f"Context: {json.dumps(user_context)}"

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Provide diet recommendations for: {user_query}"}
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=20)
        response.raise_for_status()
        result = response.json()
        return json.loads(result['choices'][0]['message']['content'])
    except Exception as e:
        print(f"Error getting diet recommendations: {e}")
        return {
            "category": category,
            "title": "Diet Recommendation",
            "recommended_foods": ["Leafy greens", "Whole grains", "Lean proteins", "Fresh fruits"],
            "foods_to_avoid": ["Excess sugar", "Processed foods", "Sugary drinks", "High sodium snacks"],
            "tips": ["Stay hydrated", "Eat balanced meals"]
        }
