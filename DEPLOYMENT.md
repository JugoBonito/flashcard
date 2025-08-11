# 🚀 FlashCard Pro - Production Deployment

## Quick Deploy

Use the `portainer-stack.yml` configuration in Portainer.

**This deployment:**
- ✅ Installs all dependencies including Tailwind CSS
- ✅ Builds the application properly 
- ✅ Serves CSS and static files correctly
- ✅ Runs on Node 20 (fixes crypto.randomUUID errors)

## Access

After deployment: **http://192.168.1.18:3000**

## Build Time

First deployment: ~5-10 minutes (building from source)

## Updates

To update to latest code:
1. **Stacks** → `flashcard-pro` → **Update stack** → **Deploy**
2. Container will rebuild with latest GitHub changes