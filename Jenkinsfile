pipeline {
  agent any

  environment {
    IMAGE_NAME = 'flask-backend'
  }

  stages {
    stage('Checkout') {
      steps {
        git credentialsId: 'github_token', url: 'https://github.com/Abdoun1m/Gestion-Absence.git'
      }
    }

    stage('Build Docker Image') {
      steps {
        dir('back_end') {
          sh 'docker build -t $IMAGE_NAME .'
        }
      }
    }

    stage('Run & Test') {
      steps {
        sh '''
          docker rm -f flask_container || true
          docker run -d --name flask_container -p 5000:5000 $IMAGE_NAME
          sleep 5
          curl -X POST http://localhost:5000/api/login || true
        '''
      }
    }
  }

  post {
    always {
      sh 'docker rm -f flask_container || true'
    }
  }
}
