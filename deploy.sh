#!/bin/bash

# FlashCard Pro - Self-Hosting Deployment Script
# This script helps you deploy FlashCard Pro on your home network

set -e

echo "🎯 FlashCard Pro - Self-Hosting Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
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

# Check if Docker is installed
check_docker() {
    print_header "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        echo "Please install Docker first:"
        echo "- macOS: https://docs.docker.com/docker-for-mac/install/"
        echo "- Linux: https://docs.docker.com/engine/install/"
        echo "- Windows: https://docs.docker.com/docker-for-windows/install/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available!"
        echo "Please install Docker Compose or update Docker to a version that includes 'docker compose'"
        exit 1
    fi
    
    print_status "Docker is installed and ready!"
}

# Get local IP address
get_local_ip() {
    print_header "Detecting network configuration..."
    
    # Try different methods to get local IP
    if command -v ip &> /dev/null; then
        LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null || echo "")
    elif command -v ifconfig &> /dev/null; then
        LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
    else
        LOCAL_IP="localhost"
    fi
    
    if [ -z "$LOCAL_IP" ] || [ "$LOCAL_IP" == "localhost" ]; then
        print_warning "Could not detect local IP address"
        LOCAL_IP="localhost"
    fi
    
    print_status "Local IP detected: $LOCAL_IP"
}

# Build and deploy
deploy_app() {
    print_header "Building and deploying FlashCard Pro..."
    
    # Stop any existing containers
    print_status "Stopping existing containers..."
    docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
    
    # Build the application
    print_status "Building Docker image..."
    if command -v docker-compose &> /dev/null; then
        docker-compose build
    else
        docker compose build
    fi
    
    # Start the application
    print_status "Starting FlashCard Pro..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        docker compose up -d
    fi
    
    # Wait for the application to start
    print_status "Waiting for application to start..."
    sleep 5
    
    # Check if the application is running
    if curl -f -s "http://localhost:3000" > /dev/null; then
        print_status "✅ FlashCard Pro is now running!"
    else
        print_warning "Application might still be starting..."
    fi
}

# Display access information
show_access_info() {
    print_header "🎉 Deployment Complete!"
    echo ""
    echo "FlashCard Pro is now running on your home network!"
    echo ""
    echo "📱 Access your flashcard app at:"
    echo "   • Local: http://localhost:3000"
    echo "   • Network: http://$LOCAL_IP:3000"
    echo ""
    echo "🌐 Share with other devices on your network:"
    echo "   Any device connected to your home network can access:"
    echo "   http://$LOCAL_IP:3000"
    echo ""
    echo "🔧 Management commands:"
    echo "   • View logs: docker-compose logs -f flashcard-app"
    echo "   • Stop app: docker-compose down"
    echo "   • Restart: docker-compose restart"
    echo "   • Update: ./deploy.sh"
    echo ""
    echo "💾 Data Storage:"
    echo "   All flashcard data is stored in your browser's local storage."
    echo "   Each device will have its own separate flashcard collection."
    echo ""
    print_status "Happy studying! 📚"
}

# Main deployment process
main() {
    echo ""
    check_docker
    echo ""
    get_local_ip
    echo ""
    deploy_app
    echo ""
    show_access_info
}

# Run the deployment
main