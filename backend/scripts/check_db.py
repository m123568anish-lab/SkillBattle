import sqlite3
import sys
from pathlib import Path

# Ensure backend package root is on sys.path when running as a script
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.database.database import engine

if __name__ == '__main__':
    db = engine.url.database
    print('DB file:', db)
    try:
        conn = sqlite3.connect(db)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cur.fetchall()
        print('SQLite tables:', tables)
        conn.close()
    except Exception as e:
        print('Error reading DB:', e)
