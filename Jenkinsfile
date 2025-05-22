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
    DOCKER_COMPOSE = "/var/jenkins_home/bin/docker-compose"
    IMAGE_NAME = "gestion-absence-backend"
    IMAGE_TAG = "${BUILD_NUMBER}"
    DB_HOST='db'
    DB_PORT='5432'
    DB_NAME='attendance'
    DB_USER='admin'
    DB_PASS='admin123'
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

    /*
    stage('OWASP Dependency Check') {
      steps {
        script {
          def dcHome = tool name: 'dependency-Check', type: 'org.jenkinsci.plugins.DependencyCheck.tools.DependencyCheckInstallation'
          withEnv(["PATH+DC=${dcHome}/bin"]) {
            sh '''
              echo "🔍 Running OWASP Dependency Check..."
              dependency-check.sh \
                --project GestionAbsenceApp \
                --scan Front_end/package.json \
                --scan Back_end/requirements.txt \
                --format HTML \
                --out owasp-report \
                --nvdApiKey ${NVD_API_KEY} \
                --data /var/jenkins_home/odc-data
            '''
          }
        }
      }
    }

    stage('SonarQube Analysis') {
      steps {
        withSonarQubeEnv('SonarQube-Server') {
          sh '''
            echo "🚀 Running SonarQube Scanner..."
            ${SONAR_SCANNER_HOME}/bin/sonar-scanner -Dsonar.login=${SONAR_TOKEN}
          '''
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
    
    stage('Build and Run with Docker Compose') {
      steps {
        sh '''
          echo "🐳 Starting Docker Compose with environment:"
          echo "DB_HOST=${DB_HOST}"
          echo "DB_PORT=${DB_PORT}"
          echo "DB_NAME=${DB_NAME}"

          ${DOCKER_COMPOSE} up --build -d
        '''
      }
    }

    stage('Tag Backend Image') {
      steps {
        script {
          def imageId = sh(script: "docker images --filter=reference='*backend' --format '{{.ID}}' | head -n 1", returnStdout: true).trim()
          sh """
            echo "🏷️ Tagging backend image..."
            docker tag $imageId $IMAGE_NAME:$IMAGE_TAG
            docker tag $imageId $IMAGE_NAME:latest
          """
        }
      }
    }
    stage('🩺 Health Check') {
      steps {
        sh '''
          echo "⏳ Waiting for backend to start..."
          sleep 5
          curl -f http://localhost/api/health || exit 1
        '''
      }
    }

    stage('Shutdown Docker Containers') {
      steps {
        sh 'docker compose down'
      }
    }*/
    stage('Docker Build') {
      steps {
        sh '''
          echo "🛠️ Building Docker image for backend..."
          docker build -t $IMAGE_NAME:$IMAGE_TAG ./Back_end

          echo "🏷️ Tagging latest..."
          docker tag $IMAGE_NAME:$IMAGE_TAG $IMAGE_NAME:latest

          echo "✅ Docker image built successfully."
          docker images $IMAGE_NAME
        '''
      }
    }
    stage('Push Backend Image to Nexus') {
      environment {
        NEXUS_REGISTRY = '192.168.56.103:8082'
      }
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'nexus-docker-creds',
          usernameVariable: 'NEXUS_USER',
          passwordVariable: 'NEXUS_PASS'
        )]) {
          sh '''
            echo "🔐 Logging in to Nexus Docker registry..."
            echo "$NEXUS_PASS" | docker login $NEXUS_REGISTRY -u "$NEXUS_USER" --password-stdin

            echo "🏷️ Tagging image for Nexus..."
            docker tag $IMAGE_NAME:$IMAGE_TAG $NEXUS_REGISTRY/absence-backend:$IMAGE_TAG
            docker tag $IMAGE_NAME:$IMAGE_TAG $NEXUS_REGISTRY/absence-backend:latest

            echo "📤 Pushing image to Nexus..."
            docker push $NEXUS_REGISTRY/absence-backend:$IMAGE_TAG
            docker push $NEXUS_REGISTRY/absence-backend:latest

            echo "🚪 Logging out from Nexus..."
            docker logout $NEXUS_REGISTRY
          '''
        }
      }
}}
  post {
      success {
        echo '✅ Pipeline finished successfully.'
        /*archiveArtifacts artifacts: 'owasp-report/**', fingerprint: true*/
      }
      failure {
        echo '❌ Pipeline failed. No artifacts to archive.'
      }
    }
}
