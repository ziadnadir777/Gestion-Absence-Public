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
    DB_HOST=db
    DB_PORT=5432
    DB_NAME=attendance
    DB_USER=admin
    DB_PASS=admin123
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
    */

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

    /*
    stage('Sonar Quality Gate') {
      steps {
        timeout(time: 2, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }
    */
    stage('Build and Run with Docker Compose') {
      steps {
        sh '''
          echo "🐳 Running docker-compose up --build with .env..."

          $${DOCKER_COMPOSE} up --build -d
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

    stage('Shutdown Docker Containers') {
      steps {
        sh '${DOCKER_COMPOSE} down'
      }
    }
  }

  post {
    always {
      echo '✅ Pipeline finished.'
      archiveArtifacts artifacts: 'owasp-report/**', fingerprint: true
    }
    success {
      echo "🎉 App built and backend image tagged successfully using docker-compose."
    }
  }
}
