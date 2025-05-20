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
      sh '''
        ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
        -Dsonar.projectKey=FullStackApp \
        -Dsonar.sources=. \
        -Dsonar.inclusions=Back_end/**/*.py,Front_end/**/*.ts,Front_end/**/*.tsx \
        -Dsonar.host.url=$SONAR_HOST_URL \
        -Dsonar.login=$SONAR_TOKEN
      '''
    }
  }
}
  }
}
