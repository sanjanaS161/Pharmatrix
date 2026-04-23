# Medicine Scan & Assistant 💊

A full-stack web application that helps users manage their medicines. Features include:
- **Medicine Scanner**: Scan medicine strips using your camera to detect name and expiry date (powered by Tesseract OCR).
- **Search**: Find medicine details or get suggestions for common symptoms using the OpenFDA API.
- **Medicine Cabinet**: Track your medicines and get low-stock notifications.
- **Text-to-Speech**: Announce scan results for accessibility.

## Tech Stack
- **Frontend**: React, Vite, Vanilla CSS (Premium Design)
- **Backend**: Python, FastAPI, SQLAlchemy (SQLite)
- **OCR**: Tesseract OCR
- **Data**: OpenFDA API

## Prerequisites
1.  **Node.js** and **npm** installed.
2.  **Python 3.8+** installed.
3.  **Tesseract OCR** installed on your system.
    - **Mac**: `brew install tesseract`
    - **Windows**: Download installer from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) and add to PATH.
    - **Linux**: `sudo apt install tesseract-ocr`

## Setup Instructions

### 1. Backend Setup
Navigate to the `backend` folder:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Frontend Setup
Navigate to the `frontend` folder:
```bash
cd frontend
npm install
```

## Running the Application

### Start the Backend Server
From the `backend` directory:
```bash
# Ensure venv is activated
uvicorn main:app --reload
```
The API will run at `http://localhost:8000`.

### Start the Frontend Server
From the `frontend` directory:
```bash
npm run dev
```
The application will run at `http://localhost:5173`.

## How to Use
1.  **Scanner**: Allow camera access. Point camera at a medicine strip. Click "Capture & Scan". The app will read out the result.
2.  **Search**: Click "Search" in the nav. Type a medicine name (e.g., "Ibuprofen") or symptom (e.g., "headache").
3.  **Cabinet**: Click "Cabinet". Add your medicines. View warnings if stock is running low (< 2 days).

## Troubleshooting
- **OCR not working / "TesseractNotFound Error"**: Ensure Tesseract is installed and available in your system PATH.
- **Camera not opening**: Ensure you are on `localhost` or HTTPS. Allow browser permissions.
