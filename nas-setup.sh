#!/bin/bash

# FlashCard Pro - NAS Setup Helper
# Interactive script to help deploy to your NAS via Portainer

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

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

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

echo ""
print_header "🏠 FlashCard Pro - NAS Setup Helper"
print_header "====================================="
echo ""

# Get NAS information
print_step "1. NAS Information"
echo "Please provide your NAS details:"
echo ""

read -p "NAS IP address or hostname (e.g., 192.168.1.100): " NAS_IP
read -p "SSH username (e.g., admin): " SSH_USER
read -p "SSH port (default 22): " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

echo ""
print_step "2. NAS Type Selection"
echo "Select your NAS type:"
echo "1) Synology DSM"
echo "2) QNAP"  
echo "3) TrueNAS Scale"
echo "4) Other/Custom"
echo ""

read -p "Enter choice (1-4): " NAS_TYPE

case $NAS_TYPE in
    1)
        NAS_NAME="Synology DSM"
        DEFAULT_PATH="/volume1/docker/flashcard-pro"
        PORTAINER_PORT="9000"
        ;;
    2)
        NAS_NAME="QNAP"
        DEFAULT_PATH="/share/CACHEDEV1_DATA/Container/flashcard-pro"
        PORTAINER_PORT="8080"
        ;;
    3)
        NAS_NAME="TrueNAS Scale"
        DEFAULT_PATH="/mnt/pool/ix-applications/flashcard-pro"
        PORTAINER_PORT="9443"
        ;;
    4)
        NAS_NAME="Custom"
        DEFAULT_PATH="/docker/flashcard-pro"
        PORTAINER_PORT="9000"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
read -p "Docker path on NAS (default: $DEFAULT_PATH): " DOCKER_PATH
DOCKER_PATH=${DOCKER_PATH:-$DEFAULT_PATH}

echo ""
print_step "3. Configuration Summary"
echo "NAS Type: $NAS_NAME"
echo "NAS Address: $NAS_IP:$SSH_PORT"
echo "SSH User: $SSH_USER"
echo "Docker Path: $DOCKER_PATH"
echo "Portainer URL: http://$NAS_IP:$PORTAINER_PORT"
echo ""

read -p "Is this correct? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    print_warning "Setup cancelled"
    exit 0
fi

echo ""
print_step "4. Testing Connection"
print_status "Testing SSH connection to $SSH_USER@$NAS_IP:$SSH_PORT..."

if ssh -p "$SSH_PORT" -o ConnectTimeout=10 -o BatchMode=yes "$SSH_USER@$NAS_IP" "echo 'SSH connection successful'" 2>/dev/null; then
    print_status "✅ SSH connection successful"
else
    print_warning "SSH key authentication not available, you'll need to enter password during upload"
fi

echo ""
print_step "5. Creating Portainer Stack Configuration"

# Generate custom stack file
cat > "portainer-stack-nas.yml" << EOF
version: '3.8'

services:
  flashcard-pro:
    build:
      context: $DOCKER_PATH
      dockerfile: Dockerfile
    container_name: flashcard-pro
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - PORT=3000
      - HOSTNAME=0.0.0.0
    restart: unless-stopped
    networks:
      - flashcard-network
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

networks:
  flashcard-network:
    driver: bridge
EOF

print_status "✅ Created portainer-stack-nas.yml"

echo ""
print_step "6. Upload Files to NAS"
read -p "Upload files now? (Y/n): " UPLOAD_NOW
if [[ ! $UPLOAD_NOW =~ ^[Nn]$ ]]; then
    print_status "Starting file upload..."
    
    if ./upload-to-nas.sh "$SSH_USER@$NAS_IP" "$DOCKER_PATH"; then
        print_status "✅ Files uploaded successfully"
    else
        print_error "❌ Upload failed"
        exit 1
    fi
fi

echo ""
print_header "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Open Portainer: http://$NAS_IP:$PORTAINER_PORT"
echo "2. Login to Portainer"
echo "3. Go to 'Stacks' → 'Add Stack'"
echo "4. Name: flashcard-pro"
echo "5. Copy the content from 'portainer-stack-nas.yml'"
echo "6. Click 'Deploy the stack'"
echo ""

echo "🌐 Access URLs (after deployment):"
echo "• Local: http://$NAS_IP:3000"
echo "• Network: http://$NAS_IP:3000 (from any device)"
echo ""

echo "📖 For detailed instructions, see:"
echo "• PORTAINER-DEPLOYMENT.md"
echo ""

print_status "Happy studying! 📚"