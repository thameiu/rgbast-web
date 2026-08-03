name: Deploy frontend

on:
  push:
    branches:
      - main

  workflow_dispatch:

concurrency:
  group: rgbast-frontend-production
  cancel-in-progress: true

jobs:
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest

    environment:
      name: production
      url: https://rgbast.com

    steps:
      - name: Deploy frontend through SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          fingerprint: ${{ secrets.VPS_FINGERPRINT }}
          command_timeout: 10m
          script: |
            /home/deploy/scripts/deploy-front.sh
