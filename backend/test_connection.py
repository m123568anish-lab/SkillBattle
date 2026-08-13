import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="skillbattle",
        user="postgres",
        password="783828@",
    )

    print("✅ Connected successfully!")

    conn.close()

except Exception as e:
    print(e)