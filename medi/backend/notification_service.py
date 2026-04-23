import os
from twilio.rest import Client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

def send_otp_sms(phone_number: str, message_body: str):
    """
    Sends an SMS message to the user's phone via Twilio.
    Used for OTPs, Quantity Alerts, and Expiry Alerts.
    """
    # If credentials are not set, fall back to console log
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        print("\n" + "!" * 50)
        print(" TWILIO CREDENTIALS NOT SET! FALLING BACK TO CONSOLE ")
        print(f" SMS TO: {phone_number}")
        print(f" MESSAGE: {message_body}")
        print("!" * 50 + "\n")
        return False

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        print(f"DEBUG: SMS sent to {phone_number}, SID: {message.sid}")
        return True
    except Exception as e:
        print(f"Error sending SMS via Twilio: {e}")
        return False

def send_medicine_reminder(phone_number: str, medicine_name: str, dosage: str):
    """
    Sends a medicine reminder to the user's phone via Twilio.
    """
    sms_message = f"Pharmatrix Reminder: Time to take your medicine – {medicine_name} ({dosage})."
    
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        print("\n--- [MOCK REMINDER SENT] ---")
        print(f"TO: {phone_number}")
        print(f"SMS: {sms_message}")
        print("---------------------------\n")
        return False

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=sms_message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        print(f"DEBUG: Reminder sent to {phone_number}, SID: {message.sid}")
        return True
    except Exception as e:
        print(f"Error sending reminder via Twilio: {e}")
        return False
