from sqlalchemy import Column, Integer, String, Date, Float, DateTime
from database import Base
from datetime import datetime

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True) # To link medicine to a specific user
    name = Column(String, index=True)
    type = Column(String) # e.g. "Tablet", "Syrup", "Injection", "Capsule", "Other"
    quantity = Column(Integer) # Total units left
    expiry_date = Column(String) # Storing as YYYY-MM-DD string for simplicity
    dosage_instructions = Column(String) # e.g. "Take 1 pill after dinner"
    reminder_time = Column(String) # e.g. "08:00"
    reminder_enabled = Column(Integer, default=0) # 0 for false, 1 for true
    notes = Column(String) # Optional warnings/notes

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    phone_number = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class DietPlan(Base):
    __tablename__ = "diet_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    age = Column(Integer)
    gender = Column(String)
    height = Column(Float)
    weight = Column(Float)
    condition = Column(String) # Diabetes, BP, etc.
    preference = Column(String) # Veg/Non-Veg/Vegan
    allergies = Column(String)
    activity_level = Column(String) # Low, Moderate, High
    plan_json = Column(String) # Storing the generated plan as a JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

# Removed OTP model as it's no longer needed
