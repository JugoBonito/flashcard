#!/bin/bash

# Health check script for FlashCard Pro
# This script verifies that the application is running and accessible

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

echo "🔍 FlashCard Pro - Health Check"
echo "==============================="

# Check if Docker container is running
print_header "Checking Docker container status..."
if docker-compose ps | grep -q "flashcard-pro.*Up"; then
    print_status "Docker container is running"
else
    print_error "Docker container is not running"
    echo "Run 'docker-compose up -d' to start the application"
    exit 1
fi

# Check if application responds
print_header "Checking application health..."
if curl -f -s -o /dev/null "http://localhost:3000"; then
    print_status "Application is responding on port 3000"
else
    print_error "Application is not responding on port 3000"
    echo "Check logs with: docker-compose logs flashcard-app"
    exit 1
fi

# Get container resource usage
print_header "Container resource usage..."
STATS=$(docker stats flashcard-pro --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" | tail -n 1)
print_status "Resources: $STATS"

# Get local IP for network access
print_header "Network access information..."
if command -v ip &> /dev/null; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null || echo "localhost")
elif command -v ifconfig &> /dev/null; then
    LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
else
    LOCAL_IP="localhost"
fi

print_status "Local access: http://localhost:3000"
if [ "$LOCAL_IP" != "localhost" ]; then
    print_status "Network access: http://$LOCAL_IP:3000"
fi

echo ""
print_header "✅ Health Check Complete - All systems operational!"