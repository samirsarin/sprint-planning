# 🐳 Samir's Sprint Planning - Docker Guide

## Quick Start (Automated)

### One-Command Setup
```bash
./docker-setup.sh
```

This script will:
1. Install Docker Desktop (if not installed)
2. Install Docker Compose (if needed)
3. Build the container
4. Start Samir's Sprint Planning
5. Make it available at http://localhost:3000

## Manual Setup

### 1. Install Docker Desktop

#### Option A: Using Homebrew (Recommended)
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker
```

#### Option B: Download from Docker
1. Visit https://www.docker.com/products/docker-desktop
2. Download Docker Desktop for Mac
3. Install and start Docker Desktop

### 2. Build and Run

#### Using Docker Compose (Recommended)
```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

#### Using Docker Commands
```bash
# Build the image
docker build -t samirs-sprint-planning .

# Run the container
docker run -d \
  --name samirs-sprint-planning \
  -p 3000:5000 \
  samirs-sprint-planning

# View logs
docker logs -f samirs-sprint-planning

# Stop the container
docker stop samirs-sprint-planning
docker rm samirs-sprint-planning
```

## 🎯 Access Your Application

Once the container is running:
- **Application URL**: http://localhost:3000
- **Container Port**: 5000 (internal)
- **Host Port**: 3000 (external)

## 🛠️ Container Management

### Check Container Status
```bash
docker-compose ps
# or
docker ps
```

### View Application Logs
```bash
docker-compose logs -f samirs-sprint-planning
# or
docker logs -f samirs-sprint-planning
```

### Restart the Application
```bash
docker-compose restart
# or
docker restart samirs-sprint-planning
```

### Stop the Application
```bash
docker-compose down
# or
docker stop samirs-sprint-planning
```

### Update the Application
```bash
# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables
The container uses these environment variables:

- `NODE_ENV=production` - Production mode
- `PORT=5000` - Internal container port

### Port Mapping
- Host: `3000` → Container: `5000`
- Change in `docker-compose.yml` if needed

### Health Check
The container includes health checks:
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3
- **Start Period**: 10 seconds

## 🚀 Production Deployment

### Deploy to Cloud Services

#### DigitalOcean App Platform
```bash
# Push to your git repository
git add .
git commit -m "Add Docker support"
git push

# Create app on DigitalOcean using the Dockerfile
```

#### AWS ECS/Fargate
```bash
# Build and push to ECR
aws ecr create-repository --repository-name samirs-sprint-planning
docker tag samirs-sprint-planning:latest [ECR_URI]
docker push [ECR_URI]
```

#### Heroku Container Registry
```bash
# Login to Heroku Container Registry
heroku container:login

# Build and push
heroku container:push web --app your-app-name
heroku container:release web --app your-app-name
```

### Environment Variables for Production
```bash
# Set production environment
NODE_ENV=production
PORT=5000
```

## 🧪 Development with Docker

### Development Mode
Create a `docker-compose.dev.yml`:
```yaml
version: '3.8'
services:
  samirs-sprint-planning-dev:
    build: .
    ports:
      - "3000:5000"
    volumes:
      - ./server:/app/server
    environment:
      - NODE_ENV=development
    command: npm run server:dev
```

Run with:
```bash
docker-compose -f docker-compose.dev.yml up
```

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check build logs
docker build -t samirs-sprint-planning . --no-cache

# Check runtime logs
docker-compose logs samirs-sprint-planning
```

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 [PID]

# Or change port in docker-compose.yml
ports:
  - "3001:5000"  # Use port 3001 instead
```

### Permission Issues
```bash
# Reset Docker
docker system prune -a

# Restart Docker Desktop
```

### Memory Issues
```bash
# Increase Docker memory in Docker Desktop preferences
# Recommended: 4GB+ for smooth operation
```

## 📊 Monitoring

### Container Stats
```bash
docker stats samirs-sprint-planning
```

### Health Check Status
```bash
docker inspect samirs-sprint-planning | grep Health -A 10
```

### Resource Usage
```bash
docker system df
docker system events
```

## 🔒 Security Notes

- Container runs as non-root user `samirapp`
- Only port 5000 is exposed
- No sensitive data in environment variables
- Health checks ensure container stability
- Multi-stage build reduces attack surface

## 📦 Container Details

- **Base Image**: `node:18-alpine`
- **Working Directory**: `/app`
- **User**: `samirapp` (non-root)
- **Exposed Port**: `5000`
- **Health Check**: Every 30 seconds

---

🎉 **Enjoy your containerized Samir's Sprint Planning experience!** 