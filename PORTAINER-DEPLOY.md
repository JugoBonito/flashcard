# 🚀 FlashCard Pro - Portainer Deployment Guide

Complete guide to deploy FlashCard Pro on your NAS using Portainer.

## 📋 Prerequisites

- ✅ Portainer installed on your NAS
- ✅ `npm_network` Docker network exists
- ✅ GitHub Personal Access Token (for private registry)

## 🔐 Step 1: Setup GitHub Container Registry Access

### Create GitHub Token
1. Go to **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Give it a name: `NAS Docker Registry`
4. Select scopes: `packages:read`
5. Click **Generate token**
6. **Copy the token** (you won't see it again!)

### Configure Portainer Registry
1. In Portainer, go to **Registries**
2. Click **Add registry**
3. Select **Custom registry**
4. Fill in:
   - **Name**: `GitHub Container Registry`
   - **Registry URL**: `ghcr.io`
   - **Username**: `JugoBonito` (your GitHub username)
   - **Password**: `YOUR_GITHUB_TOKEN` (paste the token)
5. Click **Add registry**

## 📦 Step 2: Deploy the Stack

### Option A: Using the Web UI

1. In Portainer, go to **Stacks**
2. Click **Add stack**
3. **Name**: `flashcard-pro`
4. **Build method**: Web editor
5. Paste this configuration:

```yaml
version: '3.8'

services:
  flashcard-pro:
    image: ghcr.io/jugobonito/flashcard:latest
    container_name: flashcard-pro
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - TZ=Europe/Vienna
    networks:
      - npm_network
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
      - "org.label-schema.name=FlashCard Pro"
      - "org.label-schema.description=Modern flashcard app with spaced repetition"

networks:
  npm_network:
    external: true
```

6. Click **Deploy the stack**

### Option B: Using Git Repository

1. In Portainer, go to **Stacks**
2. Click **Add stack**
3. **Name**: `flashcard-pro`
4. **Build method**: Repository
5. Fill in:
   - **Repository URL**: `https://github.com/JugoBonito/flashcard`
   - **Repository reference**: `refs/heads/main`
   - **Compose path**: `portainer-stack.yml`
   - **Authentication**: Yes
   - **Username**: `JugoBonito`
   - **Personal Access Token**: `YOUR_GITHUB_TOKEN`
6. Click **Deploy the stack**

## 🔍 Step 3: Verify Deployment

### Check Container Status
1. Go to **Containers** in Portainer
2. Look for `flashcard-pro` container
3. Status should be **running** with a green indicator
4. Check logs if there are any issues

### Access the Application
- **Local**: `http://localhost:3000`
- **Network**: `http://DXP2800-69D1.local:3000`
- **IP**: `http://192.168.1.18:3000`

### Health Check
The container includes a built-in health check. In Portainer:
1. Click on the `flashcard-pro` container
2. Look for the **Health status** indicator
3. Should show **healthy** after ~60 seconds

## 🔄 Step 4: Updates

### Manual Update
1. Go to **Stacks** → `flashcard-pro`
2. Click **Update the stack**
3. Enable **Re-pull image**
4. Click **Update the stack**

### Automatic Updates (Optional)
If you have Watchtower running:
```yaml
# Add this to your Watchtower stack or run separately
watchtower:
  image: containrrr/watchtower
  command: --label-enable --cleanup --interval 3600
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
```

## 🛠️ Troubleshooting

### Container Won't Start
1. **Check logs**: Go to container → Logs
2. **Common issues**:
   - Registry authentication failed → Check GitHub token
   - Port 3000 in use → Change port mapping
   - Network not found → Ensure `npm_network` exists

### Image Pull Failed
1. **Registry authentication**: Verify GitHub token permissions
2. **Network connectivity**: Ensure NAS can reach ghcr.io
3. **Repository access**: Check if token has `packages:read` scope

### Health Check Failing
1. **Wait 60 seconds** for initial startup
2. **Check port mapping** in stack configuration
3. **Verify container logs** for startup errors

## 📊 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `NEXT_TELEMETRY_DISABLED` | `1` | Disable Next.js telemetry |
| `PORT` | `3000` | Application port |
| `HOSTNAME` | `0.0.0.0` | Bind address |
| `TZ` | `Europe/Vienna` | Container timezone |

## 🔧 Advanced Configuration

### Custom Port
To use a different port, change the port mapping:
```yaml
ports:
  - "8080:3000"  # Access on port 8080
```

### Resource Limits
Add resource constraints:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

### Volume Mounting (Optional)
For persistent data storage:
```yaml
volumes:
  - flashcard_data:/app/data
```

## 🎯 Success!

Your FlashCard Pro should now be running at:
- **http://DXP2800-69D1.local:3000**

Features available:
- ✅ Modern flashcard interface
- ✅ Anki .apkg import/export
- ✅ FSRS spaced repetition algorithm
- ✅ Background nature sounds
- ✅ Progress tracking
- ✅ Beautiful UI with dark mode

Enjoy your self-hosted flashcard application! 🧠✨