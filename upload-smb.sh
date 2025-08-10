#!/bin/bash

# FlashCard Pro - SMB Upload Script
# Upload files to NAS via SMB share

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Configuration
SMB_SHARE="//DXP2800-69D1._smb._tcp.local/docker"
LOCAL_MOUNT_POINT="/tmp/flashcard-nas-mount"
PROJECT_NAME="flashcard-pro"

print_header "🏠 FlashCard Pro - SMB Upload to NAS"
print_header "====================================="
echo ""

print_status "SMB Share: $SMB_SHARE"
print_status "Mount Point: $LOCAL_MOUNT_POINT"
print_status "Project: $PROJECT_NAME"
echo ""

# Check if we're on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    MOUNT_CMD="mount -t smbfs"
    print_status "Detected macOS - using smbfs"
else
    # Linux
    MOUNT_CMD="mount -t cifs"
    print_status "Detected Linux - using cifs"
    
    # Check if cifs-utils is installed
    if ! command -v mount.cifs &> /dev/null; then
        print_error "cifs-utils not installed. Please install it first:"
        echo "  Ubuntu/Debian: sudo apt-get install cifs-utils"
        echo "  CentOS/RHEL: sudo yum install cifs-utils"
        exit 1
    fi
fi

# Get credentials
print_status "Please enter your NAS credentials:"
read -p "Username: " NAS_USERNAME
read -s -p "Password: " NAS_PASSWORD
echo ""
echo ""

# Clean up any existing mount point
print_status "Cleaning up any existing mount point..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    umount "$LOCAL_MOUNT_POINT" 2>/dev/null || true
else
    sudo umount "$LOCAL_MOUNT_POINT" 2>/dev/null || true
fi
rm -rf "$LOCAL_MOUNT_POINT"

# Create fresh mount point
print_status "Creating mount point..."
mkdir -p "$LOCAL_MOUNT_POINT"

# Mount SMB share
print_status "Mounting SMB share..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS mount
    if ! mount -t smbfs "//$NAS_USERNAME:$NAS_PASSWORD@DXP2800-69D1._smb._tcp.local/docker" "$LOCAL_MOUNT_POINT"; then
        print_error "Failed to mount SMB share"
        print_error "Try connecting manually first: Go to Finder → Connect to Server → smb://DXP2800-69D1._smb._tcp.local/docker"
        rm -rf "$LOCAL_MOUNT_POINT" 2>/dev/null || true
        exit 1
    fi
else
    # Linux mount
    if ! sudo mount -t cifs "$SMB_SHARE" "$LOCAL_MOUNT_POINT" -o username="$NAS_USERNAME",password="$NAS_PASSWORD",uid=$(id -u),gid=$(id -g),iocharset=utf8; then
        print_error "Failed to mount SMB share"
        rm -rf "$LOCAL_MOUNT_POINT" 2>/dev/null || true
        exit 1
    fi
fi

print_status "✅ SMB share mounted successfully"

# Create project directory
PROJECT_DIR="$LOCAL_MOUNT_POINT/$PROJECT_NAME"
print_status "Creating project directory: $PROJECT_DIR"
mkdir -p "$PROJECT_DIR"

# List of essential files to upload
print_status "Preparing files for upload..."

ESSENTIAL_FILES=(
    "Dockerfile"
    "docker-compose.yml"
    "docker-compose.portainer.yml"
    "portainer-stack.yml"
    "package.json"
    "package-lock.json"
    "next.config.ts"
    "tailwind.config.ts"
    "tsconfig.json"
    ".dockerignore"
    "PORTAINER-DEPLOYMENT.md"
    "NAS-QUICK-DEPLOY.md"
    "SELF-HOSTING.md"
    "README.md"
)

# List of directories to upload
DIRECTORIES=(
    "app"
    "components"  
    "lib"
    "types"
    "public"
)

# Upload essential files
print_status "Uploading essential files..."
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "  → $file"
        cp "$file" "$PROJECT_DIR/" || print_warning "Failed to copy $file"
    else
        print_warning "  ✗ $file not found, skipping"
    fi
done

# Upload directories
print_status "Uploading source directories..."
for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        print_status "  → $dir/"
        cp -r "$dir" "$PROJECT_DIR/" || print_warning "Failed to copy $dir"
    else
        print_warning "  ✗ $dir/ not found, skipping"
    fi
done

# Create a custom Portainer stack file for this specific NAS
print_status "Creating NAS-specific Portainer stack..."
cat > "$PROJECT_DIR/portainer-stack-dxp2800.yml" << 'EOF'
version: '3.8'

services:
  flashcard-pro:
    build:
      context: /volume1/docker/flashcard-pro
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
        reservations:
          memory: 256M
          cpus: '0.25'
    labels:
      - "com.docker.compose.project=flashcard-pro"
      - "org.label-schema.name=FlashCard Pro"
      - "org.label-schema.description=Self-hosted flashcard application"

networks:
  flashcard-network:
    driver: bridge
    name: flashcard-network
EOF

# Create deployment instructions
print_status "Creating deployment instructions..."
cat > "$PROJECT_DIR/DEPLOYMENT-INSTRUCTIONS.txt" << 'EOF'
FlashCard Pro - Deployment Instructions for DXP2800 NAS
======================================================

Files uploaded to: /docker/flashcard-pro/

Next Steps:

1. Access Portainer
   Open: http://DXP2800-69D1.local:9000
   (or use your NAS IP address)

2. Create Stack
   - Go to "Stacks" → "Add Stack"
   - Name: flashcard-pro
   - Build method: Web editor
   - Copy content from: portainer-stack-dxp2800.yml

3. Update Build Context
   Make sure the build context path in the stack matches:
   context: /volume1/docker/flashcard-pro
   
   (Adjust if your docker folder is elsewhere)

4. Deploy
   Click "Deploy the stack"
   Wait for build to complete (5-10 minutes first time)

5. Access Application
   Local: http://DXP2800-69D1.local:3000
   Network: http://YOUR_NAS_IP:3000

Troubleshooting:
- Check container logs in Portainer if build fails
- Verify all files are present in the docker share
- Ensure port 3000 is not in use by another service

For detailed instructions, see PORTAINER-DEPLOYMENT.md
EOF

# Verify upload
print_status "Verifying upload..."
UPLOADED_FILES=$(find "$PROJECT_DIR" -type f | wc -l)
print_status "✅ Uploaded $UPLOADED_FILES files to NAS"

# List uploaded contents
print_status "Upload contents:"
ls -la "$PROJECT_DIR"

# Cleanup - unmount the share
print_status "Cleaning up..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    umount "$LOCAL_MOUNT_POINT"
else
    sudo umount "$LOCAL_MOUNT_POINT"
fi
rmdir "$LOCAL_MOUNT_POINT"

print_header "🎉 Upload Complete!"
echo ""
print_status "✅ FlashCard Pro uploaded to: $SMB_SHARE/$PROJECT_NAME"
echo ""
print_header "📋 Next Steps:"
echo "1. Open Portainer: http://DXP2800-69D1.local:9000"
echo "2. Go to Stacks → Add Stack"
echo "3. Name: flashcard-pro"
echo "4. Copy content from: portainer-stack-dxp2800.yml"
echo "5. Update build context path if needed"
echo "6. Deploy the stack"
echo ""
print_header "🌐 Access URLs (after deployment):"
echo "• Local: http://DXP2800-69D1.local:3000"
echo "• Network: http://YOUR_NAS_IP:3000"
echo ""
print_status "Check DEPLOYMENT-INSTRUCTIONS.txt on your NAS for detailed steps!"
print_status "Happy studying! 📚"