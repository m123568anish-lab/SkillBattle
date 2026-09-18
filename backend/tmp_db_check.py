import sqlite3
conn = sqlite3.connect(r'D:\BattleAI\backend\skillbattle.db')
print('TABLES', conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall())
print('ACHIEVEMENTS', conn.execute("PRAGMA table_info('achievements')").fetchall())
conn.close()
