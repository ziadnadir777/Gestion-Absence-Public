pipeline {
  agent any

  tools {
    nodejs 'node-18' // Defined in Jenkins global config
    sonarRunner 'SonarScanner'
  }

  environment {
    SONAR_SCANNER_HOME = tool 'SonarScanner' // Defined in Jenkins global config
    SONAR_TOKEN = credentials('SONAR_TOKEN') // Your SonarQube token ID in Jenkins credentials
  }

  options {
    timestamps()
  }

  stages {
    stage('Checkout Main Branch') {
      steps {
        checkout([$class: 'GitSCM',
          branches: [[name: '*/main']],
          userRemoteConfigs: [[
            url: 'https://github.com/Abdoun1m/Gestion-Absence.git',
            credentialsId: 'Abdounm1'
          ]]
        ])
      }
    }

    stage('Verify Workspace') {
      steps {
        sh '''
          echo "📂 Current path: $(pwd)"
          echo "📄 Listing files:"
          ls -la
        '''
      }
    }

    stage('Show Sonar Properties') {
      steps {
        sh '''
          echo "🔍 sonar-project.properties content:"
          if [ -f sonar-project.properties ]; then
            cat sonar-project.properties
          else
            echo "❌ sonar-project.properties not found!"
            exit 1
          fi
        '''
      }
    }

    stage('Sonar Analysis') {
      steps {
        withSonarQubeEnv('SonarQube-Server') {
          dir('.') {
            sh '''
              echo "🚀 Running SonarQube Scanner..."
              ${SONAR_SCANNER_HOME}/bin/sonar-scanner -Dsonar.login=$SONAR_TOKEN
            '''
          }
        }
      }
    }
    stage('Sonar Quality Gate') {
      steps {
        timeout(time: 2, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
  }

  post {
    always {
      echo '✅ Pipeline finished.'
    }
  }
}
}
