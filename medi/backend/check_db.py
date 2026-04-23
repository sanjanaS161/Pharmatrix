import sqlite3, os, requests

db_path = 'medicine.db'
print('DB exists:', os.path.exists(db_path))
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print('Tables:', tables)
    for t in tables:
        cursor.execute(f"PRAGMA table_info({t[0]})")
        print(f'  {t[0]} columns:', cursor.fetchall())
    conn.close()

# Also try the POST and print full response
try:
    print("\nTesting /cabinet POST...")
    r = requests.post('http://pharmatrix-backend.onrender.com/cabinet', json={
        'name': 'Test Medicine', 'type': 'Tablet', 'quantity': 10, 'expiry_date': '2026-12-31',
        'dosage_instructions': 'Take 1 daily', 'reminder_time': '08:00 AM', 'notes': 'Test note'
    })
    print('Status:', r.status_code)
    print('Response:', r.text[:500])

    print("\nTesting /diet-plan/Age...")
    r = requests.get('http://pharmatrix-backend.onrender.com/diet-plan/Age')
    print('Status:', r.status_code)
    print('Response:', r.text[:1000])

    print("\nTesting /diet-plan/Medicine...")
    r = requests.get('http://pharmatrix-backend.onrender.com/diet-plan/Medicine')
    print('Status:', r.status_code)
    print('Response:', r.text[:1000])
except Exception as e:
    print('Error:', e)
