import sqlite3
import os
import sys

# Ensure UTF-8 output encoding for terminal
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def check_database(db_path="farmiq.db"):
    if not os.path.exists(db_path):
        if os.path.exists(os.path.join("Backend", db_path)):
            db_path = os.path.join("Backend", db_path)
        elif os.path.exists(os.path.join("..", db_path)):
            db_path = os.path.join("..", db_path)
        else:
            print(f"[!] Database file '{db_path}' not found.")
            return

    abs_path = os.path.abspath(db_path)
    print("=" * 80)
    print(f" FARMIQ DATABASE INSPECTOR: {abs_path}")
    print("=" * 80)

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        tables = [t[0] for t in cursor.fetchall() if not t[0].startswith("sqlite_")]

        if not tables:
            print("No user tables found in database yet. (Start backend once to initialize tables).")
            conn.close()
            return

        print(f"Total Tables Found: {len(tables)}\n")

        for table in tables:
            # Count rows
            cursor.execute(f"SELECT COUNT(*) FROM `{table}`;")
            count = cursor.fetchone()[0]

            # Get column names
            cursor.execute(f"PRAGMA table_info(`{table}`);")
            columns = [col[1] for col in cursor.fetchall()]

            print(f"[*] TABLE: {table.upper()} ({count} records)")
            print(f"    Columns: {', '.join(columns)}")

            # Show first 2 sample rows
            if count > 0:
                cursor.execute(f"SELECT * FROM `{table}` LIMIT 2;")
                rows = cursor.fetchall()
                for i, r in enumerate(rows, 1):
                    clean_row = []
                    for val in r:
                        s = str(val)
                        if len(s) > 35:
                            s = s[:35] + "..."
                        clean_row.append(s)
                    print(f"    Sample {i}: {clean_row}")
            print("-" * 80)

        conn.close()
    except Exception as e:
        print(f"Error inspecting database: {e}")

if __name__ == "__main__":
    db_file = sys.argv[1] if len(sys.argv) > 1 else "Backend/farmiq.db"
    check_database(db_file)
