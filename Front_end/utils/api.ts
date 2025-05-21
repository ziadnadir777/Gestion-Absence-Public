const API_BASE_URL = 'http://192.168.1.92:5000';

export const api = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.status === 'error') throw new Error(data.message);
    return data;
  },

  generateQR: async (data: {
    session_date: string,
    course_name: string,
    course_type: string,
    professor_id: number | string,
  }) => {
    const professor_id = Number(data.professor_id);
    if (isNaN(professor_id)) {
      throw new Error('Invalid professor ID');
    }
    const response = await fetch(`${API_BASE_URL}/generate_qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        professor_id,
      }),
    });
    return response.json();
  },

  markAttendance: async (data: {
    qr_code_data: string,
    student_id: number,
  }) => {
    const response = await fetch(`${API_BASE_URL}/mark_attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getStudentAttendance: async (studentId: number | string) => {
    const id = Number(studentId);
    if (isNaN(id)) {
      throw new Error('Invalid student ID');
    }
    const response = await fetch(`${API_BASE_URL}/student_attendance/${id}`);
    return response.json();
  },

  getProfessorAttendance: async (professorId: number | string) => {
    const id = Number(professorId);
    if (isNaN(id)) {
      throw new Error('Invalid professor ID');
    }
    const response = await fetch(`${API_BASE_URL}/professor_attendance/${id}`);
    return response.json();
  },

  getProfile: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`);
    return response.json();
  },
};