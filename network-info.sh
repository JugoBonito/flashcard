#!/bin/bash

# Network Information Script for FlashCard Pro
# Helps you find the right URLs to access your app from other devices

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo "🌐 FlashCard Pro - Network Access Information"
echo "============================================="

# Get all network interfaces and IPs
print_header "📱 Your FlashCard Pro Access URLs:"
echo ""

# Local access
print_status "🏠 On this computer:"
echo "   http://localhost:3000"
echo ""

# Network access
print_header "🌍 From other devices on your network:"

# Try different methods to get network IPs
FOUND_IP=false

# Method 1: ip route (Linux)
if command -v ip &> /dev/null; then
    IPS=$(ip route get 1 2>/dev/null | awk '{print $7}' | head -1)
    if [ ! -z "$IPS" ] && [ "$IPS" != "127.0.0.1" ]; then
        echo "   http://$IPS:3000"
        FOUND_IP=true
    fi
fi

# Method 2: ifconfig (macOS/Linux)
if command -v ifconfig &> /dev/null; then
    IPS=$(ifconfig 2>/dev/null | grep -E "inet " | grep -v "127.0.0.1" | awk '{print $2}' | sed 's/addr://')
    for IP in $IPS; do
        if [[ $IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo "   http://$IP:3000"
            FOUND_IP=true
        fi
    done
fi

# Method 3: hostname -I (Linux)
if command -v hostname &> /dev/null && hostname -I &>/dev/null; then
    IPS=$(hostname -I 2>/dev/null)
    for IP in $IPS; do
        if [[ $IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] && [ "$IP" != "127.0.0.1" ]; then
            echo "   http://$IP:3000"
            FOUND_IP=true
        fi
    done
fi

if [ "$FOUND_IP" = false ]; then
    print_warning "Could not automatically detect network IP"
    echo "   Try running 'ifconfig' or 'ip addr' to find your IP address"
    echo "   Then use: http://YOUR_IP_ADDRESS:3000"
fi

echo ""
print_header "📲 How to use:"
echo "1. Make sure other devices are connected to the same WiFi/network"
echo "2. Open a web browser on the other device"  
echo "3. Type one of the network URLs above"
echo "4. Start studying! 📚"

echo ""
print_header "🔧 Troubleshooting:"
echo "• If URLs don't work, check your firewall settings"
echo "• Ensure port 3000 is not blocked"
echo "• Verify all devices are on the same network"
echo "• Try different IP addresses if multiple are shown"

echo ""
print_status "💡 Tip: Bookmark the URL on your mobile devices for quick access!"