import sqlite3
conn = sqlite3.connect('medicine.db')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(medicines)")
cols = cursor.fetchall()
print("medicines columns:")
for c in cols:
    print(" ", c)
conn.close()
