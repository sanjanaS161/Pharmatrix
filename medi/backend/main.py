from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
import models
import database
import mongo_database
import openfda_service
import groq_service
from typing import Optional
from pydantic import BaseModel
import json
import interaction_service
import diet_service
import random
import notification_service

app = FastAPI()

# CORS — must be registered before any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Pharmatrix API is running"}

# Database Initialization
models.Base.metadata.create_all(bind=database.engine)

# Password hashing setup
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

class MedicineCreate(BaseModel):
    user_id: int # Required to link medicine to user
    name: str
    type: Optional[str] = "Tablet"
    quantity: int
    expiry_date: str
    dosage_instructions: Optional[str] = ""
    reminder_time: Optional[str] = ""
    reminder_enabled: Optional[int] = 0
    notes: Optional[str] = ""

class MedicineResponse(BaseModel):
    id: int
    user_id: int
    name: str
    type: Optional[str] = "Tablet"
    quantity: int
    expiry_date: str
    dosage_instructions: Optional[str] = ""
    reminder_time: Optional[str] = ""
    reminder_enabled: Optional[int] = 0
    notes: Optional[str] = ""
    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    username: str
    email: str
    phone_number: str
    password: str

class UserLogin(BaseModel):
    login_id: str  # Username or Email
    password: str

class ChatRequest(BaseModel):
    query: str

class ChatRecommendationRequest(BaseModel):
    query: Optional[str] = ""
    age: Optional[int] = None
    gender: Optional[str] = ""
    height: Optional[float] = None
    weight: Optional[float] = None
    condition: Optional[str] = ""
    preference: Optional[str] = ""
    allergies: Optional[str] = ""
    activity_level: Optional[str] = ""
    pregnancy_status: Optional[str] = ""
    duration: Optional[str] = ""
    other_conditions: Optional[str] = ""

class DietPlanCreate(BaseModel):
    user_id: int
    age: int
    gender: str
    height: float
    weight: float
    condition: str
    preference: str
    allergies: str
    activity_level: str

class DietPlanResponse(BaseModel):
    id: int
    user_id: int
    plan_json: str
    created_at: datetime
    class Config:
        from_attributes = True

# Routes

# ──────────────────────────────────────────────
# AUTH ROUTES
# ──────────────────────────────────────────────

@app.post("/auth/register")
def register_user(user: UserRegister):
    """Registers a new user with username, email, phone, and password in MongoDB."""
    col = mongo_database.users_collection

    if col.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    if col.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    if col.find_one({"phone_number": user.phone_number}):
        raise HTTPException(status_code=400, detail="Phone number already exists")

    hashed_password = hash_password(user.password)
    new_user_id = mongo_database.get_next_user_id()

    doc = {
        "user_id": new_user_id,
        "username": user.username,
        "email": user.email,
        "phone_number": user.phone_number,
        "hashed_password": hashed_password,
        "is_active": 1,
        "created_at": datetime.utcnow().isoformat()
    }
    col.insert_one(doc)

    return {
        "message": "Registration successful!",
        "user": {
            "id": new_user_id,
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number
        }
    }

@app.post("/auth/login")
def login_user(login_data: UserLogin):
    """Logs in a user using Username/Email and password from MongoDB."""
    col = mongo_database.users_collection

    user = col.find_one({
        "$or": [
            {"username": login_data.login_id},
            {"email": login_data.login_id}
        ]
    })

    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    return {
        "message": "Login successful!",
        "user": {
            "id": user["user_id"],
            "username": user["username"],
            "email": user["email"],
            "phone_number": user["phone_number"]
        }
    }


# ──────────────────────────────────────────────
# MEDICINE ROUTES
# ──────────────────────────────────────────────

@app.post("/scan")
async def scan_medicine(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        print(f"DEBUG: Received file: {file.filename}, size={len(contents)} bytes")

        # Send image directly to Groq Vision (no Tesseract needed)
        print("DEBUG: Sending image to Groq Vision AI...")
        ai_result = groq_service.analyze_medicine_image(contents)

        # Check if the image is not a medicine (e.g. food, drink, chocolate)
        if ai_result and ai_result.get("not_medicine") is True:
            error_msg = ai_result.get("error", "This does not appear to be a medicine. Please scan a medicine strip, tablet box, or medicine bottle.")
            print(f"DEBUG: Non-medicine image detected: {error_msg}")
            return {
                "ocr_text": "",
                "medicine_data": None,
                "expiry_message": "Not a medicine",
                "is_expired": False,
                "error": error_msg,
                "not_medicine": True
            }

        if ai_result and "error" not in ai_result:
            print("DEBUG: Groq Vision Success!")
            return {
                "ocr_text": ai_result.get("name", ""),
                "medicine_data": ai_result,
                "expiry_message": ai_result.get("expiry_message") or "Check packaging",
                "is_expired": ai_result.get("is_expired", False)
            }
        else:
            error_msg = ai_result.get("error") if ai_result else "Unknown AI Error"
            print(f"DEBUG: Groq Vision failed: {error_msg}")
            return {
                "ocr_text": "",
                "medicine_data": None,
                "expiry_message": "AI analysis failed",
                "is_expired": False,
                "error": error_msg
            }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/analyze")
def analyze_chat(request: ChatRequest):
    """
    Step 1: Analyze user query. 
    Returns either 'consultation_needed' (with required fields) OR 'medicine_search' (direct result).
    """
    analysis = groq_service.get_consultation_details(request.query)
    
    if analysis.get("type") == "medicine_search":
        # If it's just a medicine name, use OpenFDA or Groq to get details immediately
        # For consistency, we can use Groq to just get the details like we do for scanning
        # OR fall back to the old OpenFDA logic. Let's use Groq for better quality.
        details = groq_service.analyze_medicine_text(analysis["query"])
        return {"type": "medicine_result", "data": details}
        
    return analysis # Returns {type: "consultation_needed", required_fields: [...]}

@app.post("/chat/recommend")
def recommend_chat(request: ChatRecommendationRequest):
    """
    Step 2: Provide recommendation based on full context.
    """
    context = request.dict()
    recommendation = groq_service.get_medical_recommendation(context)
    return recommendation

@app.get("/search/{query}")
def search_medicine(query: str):
    # Backward compatibility or simple fallback
    # For now, we can redirect to the chat analyze flow on frontend, but keep this for legacy
    details = openfda_service.get_medicine_details(query)
    if details: return {"type": "medicine", "data": details}
    return {"type": "not_found", "message": "No direct match. Try the AI Assistant."}

@app.get("/drug-safety-check")
def check_drug_safety(user_id: Optional[int] = None, db: Session = Depends(database.get_db)):
    """
    Checks for potential drug interactions between all medicines in the user's cabinet.
    """
    query = db.query(models.Medicine)
    if user_id:
        query = query.filter(models.Medicine.user_id == user_id)
    medicines = query.all()
    
    if not medicines:
        return {"interactions": [], "status": "safe", "message": "Cabinet is empty."}
    
    # Convert SQLAlchemy objects to dictionaries for the service
    med_list = []
    for m in medicines:
        med_list.append({
            "name": m.name,
            "type": m.type,
            "dosage_instructions": m.dosage_instructions
        })
    
    result = interaction_service.check_drug_interactions(med_list)
    return result

@app.get("/cabinet", response_model=list[MedicineResponse])
def get_cabinet(user_id: Optional[int] = None, db: Session = Depends(database.get_db)):
    if user_id:
        return db.query(models.Medicine).filter(models.Medicine.user_id == user_id).all()
    return db.query(models.Medicine).all()

@app.put("/cabinet/{medicine_id}", response_model=MedicineResponse)
def update_medicine(medicine_id: int, medicine: MedicineCreate, db: Session = Depends(database.get_db)):
    db_med = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    # Update all fields except ID
    for key, value in medicine.dict().items():
        setattr(db_med, key, value)
    
    db.commit()
    db.refresh(db_med)
    
    # Fetch user for their phone number
    user = db.query(models.User).filter(models.User.id == db_med.user_id).first()
    user_phone = user.phone_number if user else "+USER_PHONE"
    
    # Check for alerts after update
    check_medicine_alerts(db_med, user_phone)
    
    return db_med

@app.post("/cabinet", response_model=MedicineResponse)
def add_medicine(medicine: MedicineCreate, db: Session = Depends(database.get_db)):
    db_med = models.Medicine(**medicine.dict())
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    
    # Fetch user for their phone number
    user = db.query(models.User).filter(models.User.id == db_med.user_id).first()
    user_phone = user.phone_number if user else "+USER_PHONE"
    
    # Check for immediate alerts (Quantity/Expiry)
    check_medicine_alerts(db_med, user_phone)
        
    return db_med

def check_medicine_alerts(med, user_phone):
    """Checks medicine for low quantity or near-expiry and sends SMS alerts."""
    # 1. Quantity Alert (Threshold: 5 units)
    if med.quantity <= 5:
        msg = f"Pharmatrix Alert: Your medicine {med.name} is running low ({med.quantity} left). Please restock soon."
        notification_service.send_otp_sms(user_phone, msg)
        # Still log to console for development visibility
        print("\n" + "🔒" * 20)
        print(f" PHARMATRIX ALERT (QUANTITY): {msg} ")
        print(f" FOR: {user_phone}")
        print("🔒" * 20 + "\n")

    # 2. Expiry Alert (Threshold: 5 days)
    try:
        expiry = datetime.strptime(med.expiry_date, "%Y-%m-%d").date()
        days_to_expiry = (expiry - date.today()).days
        if 0 <= days_to_expiry <= 5:
            msg = f"Pharmatrix Alert: Your medicine {med.name} will expire in {days_to_expiry} days ({med.expiry_date}). Please check it."
            notification_service.send_otp_sms(user_phone, msg)
            # Still log to console for development visibility
            print("\n" + "🔒" * 20)
            print(f" PHARMATRIX ALERT (EXPIRY): {msg} ")
            print(f" FOR: {user_phone}")
            print("🔒" * 20 + "\n")
    except Exception as e:
        print(f"DEBUG: Error calculating expiry for {med.name}: {e}")
        pass

@app.delete("/cabinet/{medicine_id}")
def delete_medicine(medicine_id: int, db: Session = Depends(database.get_db)):
    db_med = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    db.delete(db_med)
    db.commit()
    return {"message": "Medicine deleted successfully"}

@app.post("/diet-plan/generate")
def generate_diet_plan(data: DietPlanCreate, db: Session = Depends(database.get_db)):
    """
    Generates a personalized diet plan using Groq AI and saves it to the database.
    """
    plan = diet_service.generate_personalized_diet_plan(data.dict())
    
    db_plan = models.DietPlan(
        user_id=data.user_id,
        age=data.age,
        gender=data.gender,
        height=data.height,
        weight=data.weight,
        condition=data.condition,
        preference=data.preference,
        allergies=data.allergies,
        activity_level=data.activity_level,
        plan_json=json.dumps(plan)
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    
    return {"id": db_plan.id, "plan": plan}

@app.get("/diet-plan/latest/{user_id}")
def get_latest_diet_plan(user_id: int, db: Session = Depends(database.get_db)):
    """
    Fetches the latest saved diet plan for a user.
    """
    db_plan = db.query(models.DietPlan).filter(models.DietPlan.user_id == user_id).order_by(models.DietPlan.created_at.desc()).first()
    if not db_plan:
        return {"plan": None}
    
    return {"id": db_plan.id, "plan": json.loads(db_plan.plan_json)}

@app.get("/diet-plan/{category}")
def get_diet_plan_endpoint(category: str, user_id: Optional[int] = None, db: Session = Depends(database.get_db)):
    """
    Get diet recommendations for a specific category.
    If category is 'Medicine', it includes user's medicine data.
    """
    context = {}
    if category == "Medicine":
        query = db.query(models.Medicine)
        if user_id:
            query = query.filter(models.Medicine.user_id == user_id)
        medicines = query.all()
        context["medicines"] = [m.name for m in medicines]
    
    return diet_service.get_diet_recommendations(category, context)

@app.get("/cabinet/check_stock")
def check_stock(db: Session = Depends(database.get_db)):
    # meds = db.query(models.Medicine).all()
    notifications = []
    # Temporarily disabled broken stock logic
    return {"notifications": notifications}
