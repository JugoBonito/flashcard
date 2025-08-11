# 🔐 Portainer Authentication Setup for Private Registry

## Step 1: Create GitHub Personal Access Token

1. Go to GitHub: **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Fill in:
   - **Note**: `NAS Docker Registry Access`
   - **Expiration**: `No expiration` or `1 year`
   - **Scopes**: Check ✅ `read:packages`
4. Click **Generate token**
5. **COPY THE TOKEN** (you won't see it again!)

## Step 2: Add Registry in Portainer

1. In Portainer, go to **Registries** (left sidebar)
2. Click **Add registry**
3. Select **Custom registry**
4. Fill in:
   - **Name**: `GitHub Container Registry`
   - **Registry URL**: `ghcr.io`
   - **Username**: `JugoBonito`
   - **Password**: `YOUR_GITHUB_TOKEN` (paste the token here)
5. Click **Add registry**

## Step 3: Deploy Stack with Authentication

Now when you deploy the stack, Portainer will automatically use the authenticated registry to pull the private image.

## Alternative: SSH/Command Line Method

If Portainer authentication doesn't work, SSH into your NAS and run:

```bash
# Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u JugoBonito --password-stdin

# Then deploy with docker-compose
curl -o docker-compose.yml https://raw.githubusercontent.com/JugoBonito/flashcard/main/docker-compose.yml
docker-compose up -d
```