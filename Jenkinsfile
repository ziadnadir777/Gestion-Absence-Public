pipeline {
  agent any

  environment {
    SONAR_SCANNER_HOME = tool 'SonarScanner'           // Tool name from Global Tool Config
    SONAR_TOKEN = credentials('sonarqube-token')       // Secret text credential ID
  }

  stages {
    stage('Checkout') {
      steps {
        git credentialsId: 'Abdounm1', url: 'https://github.com/Abdoun1m/Gestion-Absence.git'
      }
    }

   stage('SonarQube Scan') {
  environment {
    SONAR_TOKEN = credentials('sonarqube-token')
  }
  steps {
    withSonarQubeEnv('SonarQube-Server') {
      dir('Back_end') {
        sh '''
          echo "--- WORKSPACE CONTENTS ---"
          ls -R
          echo "--- PYTHON FILES FOUND ---"
          find . -name "*.py"

          ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
            -Dsonar.projectKey=FlaskApp \
            -Dsonar.sources=. \
            -Dsonar.inclusions=**/*.py \
            -Dsonar.language=py \
            -Dsonar.python.version=3 \
            -Dsonar.host.url=$SONAR_HOST_URL \
            -Dsonar.login=$SONAR_TOKEN
        '''
      }
    }
  }
}