from flask import Flask, request, jsonify
from flasgger import Swagger
from flask_cors import CORS
import psycopg2
import hashlib
import datetime
import os

app = Flask(__name__)
CORS(app)
swagger = Swagger(app)

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'attendance'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASS', 'password'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', 5432)
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = hashlib.sha256(data.get('password').encode()).hexdigest()

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))
    user = cur.fetchone()
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
    return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

@app.route('/api/generate_qr', methods=['POST'])
def generate_qr():
    data = request.get_json()
    session_date = data.get('session_date')
    course_name = data.get('course_name')
    course_type = data.get('course_type')
    professor_id = data.get('professor_id')

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id FROM sessions 
            WHERE course_name = %s AND course_type = %s AND session_date = %s AND professor_id = %s
        """, (course_name, course_type, session_date, professor_id))
        if cur.fetchone():
            conn.close()
            return jsonify({'status': 'error', 'message': 'Session already exists'}), 409

        qr_data = f"{session_date}-{course_name}-{course_type}-{professor_id}-{datetime.datetime.now().timestamp()}"
        cur.execute("""
            INSERT INTO sessions (course_name, course_type, session_date, professor_id, qr_code_data) 
            VALUES (%s, %s, %s, %s, %s) RETURNING id
        """, (course_name, course_type, session_date, professor_id, qr_data))
        session_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'qr_code_data': qr_data, 'session_id': session_id}), 200
    except Exception as e:
        conn.close()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/mark_attendance', methods=['POST'])
def mark_attendance():
    data = request.get_json()
    qr_code_data = data.get('qr_code_data')
    student_id = data.get('student_id')

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM sessions WHERE qr_code_data = %s", (qr_code_data,))
        session = cur.fetchone()
        if not session:
            conn.close()
            return jsonify({'status': 'error', 'message': 'Invalid QR Code'}), 400

        session_id = session[0]
        cur.execute("SELECT COUNT(*) FROM attendance WHERE session_id = %s AND student_id = %s", (session_id, student_id))
        if cur.fetchone()[0] > 0:
            conn.close()
            return jsonify({'status': 'error', 'message': 'Already marked'}), 409

        cur.execute("INSERT INTO attendance (session_id, student_id, status) VALUES (%s, %s, 'present')",
                    (session_id, student_id))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Attendance marked'}), 200
    except Exception as e:
        conn.close()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/student_attendance/<int:student_id>', methods=['GET'])
def student_attendance(student_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT s.course_name, s.course_type, s.session_date, a.status, u.full_name
        FROM attendance a
        JOIN sessions s ON a.session_id = s.id
        JOIN users u ON s.professor_id = u.id
        WHERE a.student_id = %s
    """, (student_id,))
    records = cur.fetchall()
    conn.close()

    attendance = [{
        'course_name': r[0],
        'course_type': r[1],
        'session_date': r[2],
        'status': r[3],
        'professor': r[4]
    } for r in records]

    return jsonify({'status': 'success', 'attendance': attendance}), 200

@app.route('/api/professor_attendance/<int:professor_id>', methods=['GET'])
def professor_attendance(professor_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT s.id, s.course_name, s.course_type, s.session_date,
            COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_count,
            COUNT(a.id) AS total_count
        FROM sessions s
        LEFT JOIN attendance a ON s.id = a.session_id
        WHERE s.professor_id = %s
        GROUP BY s.id
    """, (professor_id,))
    sessions = cur.fetchall()
    conn.close()

    data = [{
        'session_id': s[0],
        'course_name': s[1],
        'course_type': s[2],
        'session_date': s[3],
        'present': s[4],
        'total': s[5],
        'rate': round((s[4] / s[5] * 100) if s[5] > 0 else 0)
    } for s in sessions]

    return jsonify({'status': 'success', 'sessions': data}), 200

@app.route('/api/profile/<int:user_id>', methods=['GET'])
def profile(user_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    if not user:
        conn.close()
        return jsonify({'status': 'error', 'message': 'User not found'}), 404

    if user[3] == 'professor':
        cur.execute("""
            SELECT COUNT(DISTINCT s.id), COUNT(DISTINCT student_id)
            FROM sessions s
            LEFT JOIN attendance a ON s.id = a.session_id
            WHERE s.professor_id = %s
        """, (user_id,))
        stats = cur.fetchone()
        stats_data = {'classes': stats[0], 'students': stats[1]}
    else:
        cur.execute("SELECT COUNT(*), COUNT(CASE WHEN status = 'present' THEN 1 END) FROM attendance WHERE student_id = %s",
                    (user_id,))
        stats = cur.fetchone()
        stats_data = {
            'total_classes': stats[0],
            'present': stats[1],
            'rate': round((stats[1] / stats[0] * 100) if stats[0] > 0 else 0)
        }

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

@app.route("/api/health")
def health():
    return {"status": "ok"}, 200
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
