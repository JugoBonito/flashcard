#!/bin/bash

# FlashCard Pro - NAS Upload Script
# Uploads the necessary files to your NAS for Portainer deployment

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

show_usage() {
    echo "FlashCard Pro - NAS Upload Script"
    echo "Usage: $0 [NAS_USER@NAS_IP] [DESTINATION_PATH]"
    echo ""
    echo "Examples:"
    echo "  $0 admin@192.168.1.100 /volume1/docker/flashcard-pro"
    echo "  $0 user@synology.local /volume1/docker/flashcard-pro"
    echo "  $0 admin@qnap.local /share/CACHEDEV1_DATA/Container/flashcard-pro"
    echo ""
    echo "Common NAS paths:"
    echo "  Synology: /volume1/docker/flashcard-pro"
    echo "  QNAP: /share/CACHEDEV1_DATA/Container/flashcard-pro"
    echo "  TrueNAS: /mnt/pool/ix-applications/flashcard-pro"
}

# Check if parameters provided
if [ "$#" -lt 2 ]; then
    print_error "Missing required parameters"
    echo ""
    show_usage
    exit 1
fi

NAS_TARGET="$1"
DEST_PATH="$2"

print_header "🚀 FlashCard Pro - NAS Upload"
echo "Target: $NAS_TARGET"
echo "Destination: $DEST_PATH"
echo ""

# Test SSH connection
print_status "Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$NAS_TARGET" "echo 'Connection successful'" 2>/dev/null; then
    print_warning "SSH key authentication failed, you'll need to enter password"
fi

# Create destination directory
print_status "Creating destination directory..."
ssh "$NAS_TARGET" "mkdir -p '$DEST_PATH'" || {
    print_error "Failed to create destination directory"
    exit 1
}

# List of essential files to upload
ESSENTIAL_FILES=(
    "Dockerfile"
    "portainer-stack.yml"
    "docker-compose.yml"
    "package.json"
    "package-lock.json"
    "next.config.ts"
    "tailwind.config.ts" 
    "tsconfig.json"
    ".dockerignore"
    "PORTAINER-DEPLOYMENT.md"
)

# List of directories to upload
DIRECTORIES=(
    "app"
    "components"
    "lib"
    "types"
    "public"
)

print_status "Uploading essential files..."
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "  → $file"
        scp "$file" "$NAS_TARGET:$DEST_PATH/" || print_warning "Failed to upload $file"
    else
        print_warning "  ✗ $file not found, skipping"
    fi
done

print_status "Uploading source directories..."
for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        print_status "  → $dir/"
        scp -r "$dir" "$NAS_TARGET:$DEST_PATH/" || print_warning "Failed to upload $dir"
    else
        print_warning "  ✗ $dir/ not found, skipping"
    fi
done

# Verify upload
print_status "Verifying upload..."
ssh "$NAS_TARGET" "ls -la '$DEST_PATH'" || {
    print_error "Failed to verify upload"
    exit 1
}

print_header "✅ Upload Complete!"
echo ""
echo "Files uploaded to: $NAS_TARGET:$DEST_PATH"
echo ""
echo "Next steps:"
echo "1. Open Portainer: http://$(echo $NAS_TARGET | cut -d'@' -f2):9000"
echo "2. Go to Stacks → Add Stack"
echo "3. Use the uploaded portainer-stack.yml configuration"
echo "4. Update the build context path to: $DEST_PATH"
echo "5. Deploy the stack"
echo ""
echo "For detailed instructions, see PORTAINER-DEPLOYMENT.md"