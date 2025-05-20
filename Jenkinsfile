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
      dir("${env.WORKSPACE}") { // <== forces correct working directory
        sh '''
          echo "🗂 Verifying we're in the repo root:"
          pwd
          ls -la

          echo "📄 Showing sonar-project.properties:"
          cat sonar-project.properties || echo "❌ Not found!"

          echo "🚀 Running Sonar Scanner..."
          ${SONAR_SCANNER_HOME}/bin/sonar-scanner -Dsonar.login=$SONAR_TOKEN
        '''
      }
    }
  }
}
  }
}
