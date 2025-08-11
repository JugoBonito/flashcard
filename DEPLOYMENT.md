# 🚀 FlashCard Pro - Production Deployment

## Quick Deploy

Use the `portainer-stack.yml` configuration in Portainer.

**This deployment:**
- ✅ Installs all dependencies including Tailwind CSS
- ✅ Builds the application with proper CSS generation
- ✅ Copies static files to public directory for serving
- ✅ Serves CSS and static files correctly via standalone server
- ✅ Runs on Node 20 (fixes crypto.randomUUID errors)

## Access

After deployment: **http://192.168.1.18:3000**

## Build Time

First deployment: ~5-10 minutes (building from source)

## CSS Fix Details

This deployment:
1. Runs `npm install` with all dependencies
2. Executes `npm run build` to generate CSS and static assets
3. Copies `.next/static/*` files to `/app/public/static/` for proper serving
4. Uses `npm start` with standalone server for optimized performance

## Updates

To update to latest code:
1. **Stacks** → `flashcard-pro` → **Update stack** → **Deploy**
2. Container will rebuild with latest GitHub changes