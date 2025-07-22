#!/bin/bash

echo "🐳 Samir's Sprint Planning - Docker Setup Script"
echo "=================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker is installed
if ! command_exists docker; then
    echo "📦 Docker not found. Installing Docker Desktop for macOS..."
    
    # Check if Homebrew is installed
    if ! command_exists brew; then
        echo "🍺 Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Install Docker Desktop via Homebrew
    echo "📦 Installing Docker Desktop..."
    brew install --cask docker
    
    echo "⚠️  Please start Docker Desktop from Applications folder and return to continue."
    echo "   Press Enter after Docker Desktop is running..."
    read -r
else
    echo "✅ Docker is already installed"
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "⚠️  Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if Docker Compose is available
if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    echo "📦 Installing Docker Compose..."
    brew install docker-compose
else
    echo "✅ Docker Compose is available"
fi

echo ""
echo "🚀 Building Samir's Sprint Planning container..."
docker build -t samirs-sprint-planning .

if [ $? -eq 0 ]; then
    echo "✅ Container built successfully!"
    echo ""
    echo "🎯 Starting Samir's Sprint Planning..."
    docker-compose up -d
    
    echo ""
    echo "🎉 Samir's Sprint Planning is now running!"
    echo "🌐 Access your application at: http://localhost:3000"
    echo ""
    echo "📋 Useful commands:"
    echo "   🔍 Check status: docker-compose ps"
    echo "   📋 View logs: docker-compose logs -f"
    echo "   🛑 Stop app: docker-compose down"
    echo "   🔄 Restart: docker-compose restart"
    echo ""
    echo "🎮 Ready for your sprint planning session!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi 