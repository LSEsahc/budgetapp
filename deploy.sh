#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    exit 1
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p data

# Install dependencies
echo "Installing dependencies..."
npm install

# Build Docker images
echo "Building Docker images..."
docker-compose build

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Start the services
echo "Starting services..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check if services are running
echo "Checking service health..."
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost/health > /dev/null; then
        echo "Application is running successfully!"
        echo "You can access it at http://localhost"
        exit 0
    fi
    echo "Waiting for services to be ready... (Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

echo "Error: Application failed to start"
echo "Check the logs with: docker-compose logs"
exit 1 