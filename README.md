<<<<<<< HEAD
# Gestion des Absences DevSecOps | Absence Management DevSecOps

## Description | Description
🇫🇷 Un système complet de gestion des absences des étudiants avec des pratiques DevSecOps intégrées.

🇬🇧 A comprehensive student absence management system with integrated DevSecOps practices.

## Fonctionnalités | Features
🇫🇷
- Suivi des absences des étudiants
- Gestion des présences via QR Code
- Système de reporting en temps réel
- Authentification sécurisée
- Contrôle d'accès basé sur les rôles (Professeur/Étudiant)
- Pipeline de déploiement automatisé
- Interface mobile responsive

🇬🇧
- Student absence tracking
- QR Code-based attendance management
- Real-time reporting system
- Secure authentication
- Role-based access control (Professor/Student)
- Automated deployment pipeline
- Responsive mobile interface

## Technologies | Technologies

### Frontend
- React Native with Expo
- TypeScript
- React Navigation
- Expo Camera for QR scanning
- React Native QR Code SVG
- Lucide React Native icons
- Expo Font with Inter & Poppins fonts
- Secure storage with Async Storage
- Animated API for smooth transitions

### Backend
- Python with Flask
- SQLite Database
- RESTful API architecture
- QR Code generation and validation
- Session management
- Security middleware

### DevOps & Security
- Git version control
- Automated testing
- Continuous Integration/Deployment
- Security scanning
- Code quality checks
- Access control implementation

## Getting Started | Démarrage

### Prerequisites | Prérequis
```bash
# Required software
node >= 18.x
npm >= 9.x
python >= 3.8
expo-cli
android studio (for android development)
xcode (for iOS development, Mac only)
```

### Installation
1. Clone the repository
```bash
git clone [repository-url]
cd Gestion-Absence
```

2. Frontend Setup
```bash
cd Front_end
npm install
```

3. Backend Setup
```bash
cd Back_end
pip install -r requirements.txt
```

4. Environment Configuration
```bash
# Create and configure .env files for both frontend and backend
```

### Running the Application | Lancer l'Application

1. Start Backend Server
```bash
cd Back_end
python app.py
```

2. Start Frontend Development Server
```bash
cd Front_end
npm run dev
```

### Mobile Development
```bash
# For Android
npm run android

# For iOS
npm run ios
```

## Project Structure | Structure du Projet

```
Gestion-Absence/
├── Front_end/
│   ├── app/
│   │   ├── (auth)/
│   │   └── (tabs)/
│   ├── assets/
│   ├── context/
│   ├── utils/
│   └── hooks/
└── Back_end/
    ├── app.py
    └── attendance.db
```

## API Endpoints | Points d'API

- POST `/api/login` - Authentication
- POST `/api/generate_qr` - Generate attendance QR code
- POST `/api/mark_attendance` - Mark student attendance
- GET `/api/student_attendance/:id` - Get student attendance history
- GET `/api/professor_attendance/:id` - Get professor's class attendance data

## Security Features | Fonctionnalités de Sécurité
- Secure authentication system
- QR code encryption
- Rate limiting
- Input validation
- Session management
- Role-based access control
- Data encryption

## Contributing | Contribution
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License | Licence
[License information]

## Authors | Auteurs
[Your team information]

## Acknowledgments | Remerciements
- React Native community
- Expo team
- Flask community
- All contributors
=======
# Gestion-Absence-Public
>>>>>>> 54f7c3e90d9ec84ec4b635b1e42081a337e888e6
