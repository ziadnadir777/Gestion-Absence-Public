pipeline {
  agent any
  tools {
    nodejs 'node-18'
  }
  environment {
    SONAR_TOKEN = credentials('sonarqube-token')        // Your Sonar token ID in Jenkins credentials
    SONAR_SCANNER = tool name: 'SonarScanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
  }

  triggers {
    githubPush()
  }

  options {
    skipDefaultCheckout true
    timestamps()
  }

  stages {

    stage('Checkout Main Branch') {
      when {
        branch 'main'
      }
      steps {
        checkout scm
      }
    }
    stage('Check Node') {
      steps {
        sh 'node -v'
        sh 'npm -v'
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
      when {
        branch 'main'
      }
      steps {
        withSonarQubeEnv('SonarQube-Server') {
          dir("${env.WORKSPACE}") {
            sh '''
              echo "🚀 Running SonarQube Scanner..."
              ${SONAR_SCANNER}/bin/sonar-scanner -Dsonar.login=$SONAR_TOKEN
            '''
          }
        }
      }
    }
  }

  post {
    always {
      echo '✅ Pipeline finished.'
    }
    failure {
      echo '❌ Pipeline failed.'
    }
  }
}
