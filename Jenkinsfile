pipeline {
  agent any

  tools {
    nodejs 'node-18'
    dockerTool 'docker'
  }

  environment {
    SONAR_SCANNER_HOME = tool 'SonarScanner'
    SONAR_TOKEN = credentials('sonarqube-token')
    NVD_API_KEY = credentials('nvd-api-key')

    IMAGE_NAME = "gestion-absence-backend"
    IMAGE_TAG = "${BUILD_NUMBER}"
    DOCKER_COMPOSE = "${env.HOME}/bin/docker-compose"
    PATH = "${env.HOME}/bin:${env.PATH}"
  }

  options {
    timestamps()
    skipDefaultCheckout()
    disableConcurrentBuilds()
  }

  stages {
    stage('📥 Checkout Source Code') {
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

    stage('🔎 SonarQube Analysis') {
      steps {
        withSonarQubeEnv('SonarQube-Server') {
          sh '''
            echo "🚀 Running SonarQube Scanner..."
            ${SONAR_SCANNER_HOME}/bin/sonar-scanner -Dsonar.login=${SONAR_TOKEN}
          '''
        }
      }
    }

    stage('⚙️ Install Docker Compose') {
      steps {
        sh '''
          echo "⚙ Installing Docker Compose (if missing)..."
          COMPOSE_VERSION=2.24.6
          mkdir -p $HOME/bin

          if [ ! -f "$HOME/bin/docker-compose" ]; then
            curl -sSL "https://github.com/docker/compose/releases/download/v$COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o $HOME/bin/docker-compose
            chmod +x $HOME/bin/docker-compose
          fi

          ${DOCKER_COMPOSE} version
        '''
      }
    }

    stage('🐳 Build and Run Services') {
      steps {
        sh '''
          echo "🐳 Running docker-compose up --build with .env..."

          if [ ! -f ".env" ]; then
            echo "⚠️ .env file not found. Creating default .env..."
            echo "ENV=dev" > .env
          fi

          ${DOCKER_COMPOSE} --env-file .env up --build -d
        '''
      }
    }

    stage('🏷️ Tag Docker Image') {
      steps {
        script {
          def imageId = sh(
            script: "docker images --filter=reference='*backend' --format '{{.ID}}' | head -n 1",
            returnStdout: true
          ).trim()

          sh """
            echo "🏷️ Tagging backend image..."
            docker tag $imageId $IMAGE_NAME:$IMAGE_TAG
            docker tag $imageId $IMAGE_NAME:latest
          """
        }
      }
    }

    stage('🧹 Teardown Containers') {
      steps {
        sh '''
          echo "🧹 Shutting down Docker containers..."
          ${DOCKER_COMPOSE} down
        '''
      }
    }
  }

  post {
    always {
      echo '✅ Pipeline completed (success or failure).'
      archiveArtifacts artifacts: 'owasp-report/**', fingerprint: true
    }
    success {
      echo "🎉 App built and image tagged successfully."
    }
    failure {
      echo "❌ Build failed. Please check the logs for details."
    }
  }
}
