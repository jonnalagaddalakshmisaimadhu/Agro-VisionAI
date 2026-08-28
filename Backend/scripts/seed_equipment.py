import os
import sqlite3

# Resolve relative path to farmiq.db in Backend directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "farmiq.db")

print(f"Connecting to database at: {DB_PATH}")

if not os.path.exists(DB_PATH):
    print(f"Warning: Database file {DB_PATH} does not exist yet. Run backend first to initialize DB.")
    exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Update equipment with authentic owner profiles & mobile numbers
updates = [
    ("Ram Charan", "6305936623", "Guntur, Andhra Pradesh", "Guntur", 1),
    ("Charith", "8341505040", "Vijayawada, Andhra Pradesh", "Krishna", 2),
    ("Sai Madhu", "8639668662", "Bapatla, Andhra Pradesh", "Bapatla", 3),
    ("Sai Madhu", "8639668662", "Amaravati, Andhra Pradesh", "Guntur", 4),
    ("Ram Charan", "6305936623", "Tenali, Andhra Pradesh", "Guntur", 5),
    ("Charith", "8341505040", "Krishna District, Andhra Pradesh", "Krishna", 6),
    ("Ram Charan", "6305936623", "Guntur Rural, Andhra Pradesh", "Guntur", 7),
]

for owner_name, phone_number, location, district, eq_id in updates:
    cursor.execute("""
        UPDATE equipment 
        SET owner_name = ?, phone_number = ?, location = ?, district = ?
        WHERE id = ?
    """, (owner_name, phone_number, location, district, eq_id))

conn.commit()

# Print all equipment rows
cursor.execute("SELECT id, name, owner_name, phone_number, location FROM equipment")
for row in cursor.fetchall():
    print(row)

conn.close()
print("Equipment owners updated successfully!")
