import os
import sqlite3
import hashlib

def reset_database():
    print("Starting database reset...")
    
    # Delete existing database
    if os.path.exists('attendance.db'):
        os.remove('attendance.db')
        print("Existing database deleted.")
    
    # Create new connection
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()
    
    # Create tables
    print("Creating new tables...")
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        user_id TEXT NOT NULL
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT NOT NULL,
        course_type TEXT NOT NULL,
        session_date TEXT NOT NULL,
        professor_id INTEGER NOT NULL,
        qr_code_data TEXT NOT NULL
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        FOREIGN KEY (student_id) REFERENCES users(id)
    )''')
    
    # Insert test users
    print("Adding test users...")
    test_users = [
        ('n.bahajoub@gmail.com', 'nizar123', 'professor', 'Dr. Bahajoub', 'R140057625'),
        ('anejjarwalid7@gmail.com', 'walid123', 'professor', 'Dr. Anejjar', 'R12345678'),
        ('ziad@gmail.com', 'ziad123', 'student', 'Ziad Nadir', 'J12345678'),
        ('moughite@gmail.com', 'moughite123', 'student', 'Abdelmoughite Naoumi', 'K12345678')
    ]
    
    for user in test_users:
        c.execute(
            "INSERT INTO users (email, password, role, full_name, user_id) VALUES (?, ?, ?, ?, ?)",
            (user[0], hashlib.sha256(user[1].encode()).hexdigest(), user[2], user[3], user[4])
        )
    
    conn.commit()
    conn.close()
    print("Database reset completed successfully!")

if __name__ == "__main__":
    reset_database()