pipeline {
  agent any

  environment {
    SONAR_SCANNER_HOME = tool 'SonarScanner'
    SONAR_TOKEN = credentials('sonarqube-token')
  }

  stages {
    stage('Checkout') {
      steps {
        git credentialsId: 'github-token', url: 'https://github.com/Abdoun1m/Gestion-Absence.git'
      }
    }

    stage('SonarQube Scan') {
      steps {
        withSonarQubeEnv('SonarQube-Server') {
          dir('back_end') {
            sh '''
              ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
              -Dsonar.projectKey=FlaskApp \
              -Dsonar.sources=. \
              -Dsonar.host.url=$SONAR_HOST_URL \
              -Dsonar.login=$SONAR_TOKEN
            '''
          }
        }
      }
    }
  }
}
