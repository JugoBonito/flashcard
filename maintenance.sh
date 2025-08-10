#!/bin/bash

# FlashCard Pro - Maintenance Script
# Provides common maintenance tasks for self-hosted deployment

set -e

# Colors for output
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
    echo "FlashCard Pro - Maintenance Script"
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status      Show application status"
    echo "  logs        Show application logs"
    echo "  restart     Restart the application"
    echo "  stop        Stop the application"
    echo "  start       Start the application"
    echo "  update      Update to latest version"
    echo "  cleanup     Clean up Docker images and containers"
    echo "  backup      Create backup of configuration"
    echo "  health      Run health check"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 logs"
    echo "  $0 restart"
}

check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    else
        print_error "Docker Compose not found!"
        exit 1
    fi
}

show_status() {
    print_header "📊 Application Status"
    $DOCKER_COMPOSE ps
    echo ""
    
    if $DOCKER_COMPOSE ps | grep -q "flashcard-pro.*Up"; then
        print_status "✅ FlashCard Pro is running"
        
        # Show resource usage
        if docker stats flashcard-pro --no-stream &>/dev/null; then
            echo ""
            print_header "💻 Resource Usage"
            docker stats flashcard-pro --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
        fi
        
        # Show access URLs
        if command -v ip &> /dev/null; then
            LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null || echo "localhost")
        elif command -v ifconfig &> /dev/null; then
            LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
        else
            LOCAL_IP="localhost"
        fi
        
        echo ""
        print_header "🌐 Access URLs"
        echo "  Local: http://localhost:3000"
        if [ "$LOCAL_IP" != "localhost" ]; then
            echo "  Network: http://$LOCAL_IP:3000"
        fi
    else
        print_warning "❌ FlashCard Pro is not running"
    fi
}

show_logs() {
    print_header "📋 Application Logs"
    $DOCKER_COMPOSE logs -f flashcard-app
}

restart_app() {
    print_header "🔄 Restarting FlashCard Pro"
    $DOCKER_COMPOSE restart
    sleep 3
    print_status "✅ Application restarted"
}

stop_app() {
    print_header "⏹️ Stopping FlashCard Pro"
    $DOCKER_COMPOSE down
    print_status "✅ Application stopped"
}

start_app() {
    print_header "▶️ Starting FlashCard Pro"
    $DOCKER_COMPOSE up -d
    sleep 5
    print_status "✅ Application started"
}

update_app() {
    print_header "📦 Updating FlashCard Pro"
    
    # Pull latest code (if git repository)
    if [ -d .git ]; then
        print_status "Pulling latest code..."
        git pull
    fi
    
    # Rebuild and restart
    print_status "Rebuilding application..."
    $DOCKER_COMPOSE build --no-cache
    
    print_status "Restarting with new version..."
    $DOCKER_COMPOSE down
    $DOCKER_COMPOSE up -d
    
    sleep 5
    print_status "✅ Update complete"
}

cleanup_docker() {
    print_header "🧹 Cleaning up Docker resources"
    
    print_status "Removing unused images..."
    docker image prune -f
    
    print_status "Removing unused containers..."
    docker container prune -f
    
    print_status "Removing unused volumes..."
    docker volume prune -f
    
    print_status "Removing unused networks..."
    docker network prune -f
    
    print_status "✅ Cleanup complete"
}

create_backup() {
    print_header "💾 Creating Configuration Backup"
    
    BACKUP_DIR="backups"
    BACKUP_FILE="flashcard-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    mkdir -p "$BACKUP_DIR"
    
    print_status "Creating backup: $BACKUP_FILE"
    
    tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
        docker-compose.yml \
        Dockerfile \
        .dockerignore \
        deploy.sh \
        maintenance.sh \
        health-check.sh \
        .env.example \
        SELF-HOSTING.md \
        2>/dev/null || true
    
    print_status "✅ Backup created: $BACKUP_DIR/$BACKUP_FILE"
}

run_health_check() {
    if [ -x "./health-check.sh" ]; then
        ./health-check.sh
    else
        print_warning "Health check script not found or not executable"
        show_status
    fi
}

# Main script logic
check_docker_compose

case "${1:-}" in
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "restart")
        restart_app
        ;;
    "stop")
        stop_app
        ;;
    "start")
        start_app
        ;;
    "update")
        update_app
        ;;
    "cleanup")
        cleanup_docker
        ;;
    "backup")
        create_backup
        ;;
    "health")
        run_health_check
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        echo "❌ Unknown command: ${1:-}"
        echo ""
        show_usage
        exit 1
        ;;
esac