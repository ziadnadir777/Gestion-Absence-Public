from flask import Flask, request, jsonify
from flask_cors import CORS

import sqlite3
import hashlib
import datetime
import json

app = Flask(__name__)
CORS(app)


# Fonction pour initialiser la base de données SQLite
def init_db():
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()

    conn.commit()
    conn.close()

# API pour la connexion
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = hashlib.sha256(data.get('password').encode()).hexdigest()
    
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = ? AND password = ?", (email, password))
    user = c.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'status': 'success',
            'user': {
                'id': user[0],
                'email': user[1],
                'role': user[3],
                'full_name': user[4],
                'user_id': user[5]
            }
        }), 200
    return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401, {'Content-Type': 'application/json'}

# API pour générer un QR Code
@app.route('/api/generate_qr', methods=['POST'])
def generate_qr():
    data = request.get_json()
    session_date = data.get('session_date')
    course_name = data.get('course_name')
    course_type = data.get('course_type')
    professor_id = data.get('professor_id')
    
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()
    
    try:
        # Check if session already exists for this course on this date
        c.execute("""
            SELECT id FROM sessions 
            WHERE course_name = ? 
            AND course_type = ? 
            AND session_date = ? 
            AND professor_id = ?
        """, (course_name, course_type, session_date, professor_id))
        
        existing_session = c.fetchone()
        
        if existing_session:
            conn.close()
            return jsonify({
                'status': 'error',
                'message': 'A session for this course already exists on this date'
            }), 409
        
        # If no existing session, create new one with QR code
        qr_data = f"{session_date}-{course_name}-{course_type}-{professor_id}-{datetime.datetime.now().timestamp()}"
        
        c.execute("""
            INSERT INTO sessions (course_name, course_type, session_date, professor_id, qr_code_data) 
            VALUES (?, ?, ?, ?, ?)
        """, (course_name, course_type, session_date, professor_id, qr_data))
        
        session_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success', 
            'qr_code_data': qr_data, 
            'session_id': session_id
        }), 200
        
    except Exception as e:
        conn.close()
        return jsonify({
            'status': 'error',
            'message': f'Database error: {str(e)}'
        }), 500

# API pour marquer la présence
@app.route('/api/mark_attendance', methods=['POST'])
def mark_attendance():
    data = request.get_json()
    qr_code_data = data.get('qr_code_data')
    student_id = data.get('student_id')
    
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()
    
    try:
        # First check if the QR code is valid
        c.execute("SELECT id FROM sessions WHERE qr_code_data = ?", (qr_code_data,))
        session = c.fetchone()
        
        if not session:
            conn.close()
            return jsonify({
                'status': 'error',
                'message': 'Invalid QR Code'
            }), 400
            
        session_id = session[0]
        
        # Check if student already marked attendance for this session
        c.execute("""
            SELECT COUNT(*) 
            FROM attendance 
            WHERE session_id = ? AND student_id = ?
        """, (session_id, student_id))
        count = c.fetchone()[0]
        
        if count > 0:
            conn.close()
            return jsonify({
                'status': 'error',
                'message': 'Attendance already marked for this session'
            }), 409
        
        # If no existing attendance, mark it
        c.execute("""
            INSERT INTO attendance (session_id, student_id, status) 
            VALUES (?, ?, 'present')
        """, (session_id, student_id))
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Attendance marked successfully'
        }), 200
        
    except Exception as e:
        conn.close()
        return jsonify({
            'status': 'error',
            'message': f'Database error: {str(e)}'
        }), 500

# API pour récupérer les données de présence d'un étudiant
@app.route('/api/student_attendance/<int:student_id>', methods=['GET'])
def student_attendance(student_id):
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()
    c.execute('''SELECT s.course_name, s.course_type, s.session_date, a.status, u.full_name
                 FROM attendance a
                 JOIN sessions s ON a.session_id = s.id
                 JOIN users u ON s.professor_id = u.id
                 WHERE a.student_id = ?''', (student_id,))
    records = c.fetchall()
    conn.close()
    
    attendance = []
    for record in records:
        attendance.append({
            'course_name': record[0],
            'course_type': record[1],
            'session_date': record[2],
            'status': record[3],
            'professor': record[4]
        })
    
    return jsonify({'status': 'success', 'attendance': attendance}), 200, {'Content-Type': 'application/json'}

# API pour récupérer les données de présence d'un professeur
@app.route('/api/professor_attendance/<int:professor_id>', methods=['GET'])
def professor_attendance(professor_id):
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()
    c.execute('''SELECT s.id, s.course_name, s.course_type, s.session_date,
                 COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                 COUNT(a.id) as total_count
                 FROM sessions s
                 LEFT JOIN attendance a ON s.id = a.session_id
                 WHERE s.professor_id = ?
                 GROUP BY s.id''', (professor_id,))
    sessions = c.fetchall()
    conn.close()
    
    records = []
    for session in sessions:
        records.append({
            'session_id': session[0],
            'course_name': session[1],
            'course_type': session[2],
            'session_date': session[3],
            'present': session[4],
            'total': session[5],
            'rate': round((session[4] / session[5] * 100) if session[5] > 0 else 0)
        })
    
    return jsonify({'status': 'success', 'sessions': records}), 200, {'Content-Type': 'application/json'}

# API pour récupérer le profil
@app.route('/api/profile/<int:user_id>', methods=['GET'])
def profile(user_id):
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    
    if user:
        if user[3] == 'professor':
            c.execute("""
                SELECT COUNT(DISTINCT s.id), COUNT(DISTINCT student_id) 
                FROM sessions s 
                LEFT JOIN attendance a ON s.id = a.session_id 
                WHERE s.professor_id = ?
            """, (user_id,))
            stats = c.fetchone()
            stats_data = {'classes': stats[0], 'students': stats[1]}
        else:
            c.execute("SELECT COUNT(*), COUNT(CASE WHEN status = 'present' THEN 1 END) FROM attendance WHERE student_id = ?", (user_id,))
            stats = c.fetchone()
            stats_data = {'total_classes': stats[0], 'present': stats[1], 'rate': round((stats[1] / stats[0] * 100) if stats[0] > 0 else 0)}
        
        conn.close()
        return jsonify({
            'status': 'success',
            'user': {
                'full_name': user[4],
                'email': user[1],
                'user_id': user[5],
                'role': user[3]
            },
            'stats': stats_data
        }), 200
    conn.close()
    return jsonify({'status': 'error', 'message': 'User not found'}), 404, {'Content-Type': 'application/json'}

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)