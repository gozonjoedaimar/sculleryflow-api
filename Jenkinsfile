pipeline {
    agent any
    stages {
        stage('build') {
            steps {
                sh 'corepack enable'
                sh 'yarn'
                sh 'yarn build'
                sh 'touch .build_$(date +%Y%m%d%H%M%S)'
            }
        }
    }
}
