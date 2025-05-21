import os
import hashlib
import psycopg2

def get_conn():
    return psycopg2.connect(
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASS'),
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT', '5432')
    )

def reset_database():
    print("🔄 Initializing database if needed...")

    conn = get_conn()
    c = conn.cursor()

    # Create tables if not exist
    print("🛠️ Creating tables if they do not exist...")
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            full_name TEXT NOT NULL,
            user_id TEXT NOT NULL
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id SERIAL PRIMARY KEY,
            course_name TEXT NOT NULL,
            course_type TEXT NOT NULL,
            session_date TEXT NOT NULL,
            professor_id INTEGER NOT NULL,
            qr_code_data TEXT NOT NULL
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id SERIAL PRIMARY KEY,
            session_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(id),
            FOREIGN KEY (student_id) REFERENCES users(id)
        )
    ''')

    # Check if users already exist to avoid duplication
    c.execute("SELECT COUNT(*) FROM users")
    user_count = c.fetchone()[0]

    if user_count == 0:
        print("👥 Inserting default test users...")
        test_users = [
            ('n.bahajoub@gmail.com', 'nizar123', 'professor', 'Dr. Bahajoub', 'R140057625'),
            ('anejjarwalid7@gmail.com', 'walid123', 'professor', 'Dr. Anejjar', 'R12345678'),
            ('ziad@gmail.com', 'ziad123', 'student', 'Ziad Nadir', 'J12345678'),
            ('moughite@gmail.com', 'moughite123', 'student', 'Abdelmoughite Naoumi', 'K12345678')
        ]

        for user in test_users:
            c.execute(
                "INSERT INTO users (email, password, role, full_name, user_id) VALUES (%s, %s, %s, %s, %s)",
                (user[0], hashlib.sha256(user[1].encode()).hexdigest(), user[2], user[3], user[4])
            )
    else:
        print("✔️ Test users already exist. Skipping insertion.")

    conn.commit()
    conn.close()
    print("✅ Database initialization complete.")

if __name__ == "__main__":
    reset_database()
