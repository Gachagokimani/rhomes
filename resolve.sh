#!/bin/bash
# complete-reset.sh - Complete reset and fresh build

set -e

echo "🔄 COMPLETE SYSTEM RESET..."

echo "🧹 Cleaning up everything..."
sudo docker compose down 2>/dev/null || true
sudo docker rm -f rhomes_redis 2>/dev/null || true
sudo docker volume rm rhomes_redis_data 2>/dev/null || true
sudo docker rm -f rhomes_backend rhomes_web rhomes_mongo rhomes-redis-1 2>/dev/null || true
sudo docker rmi rhomes-backend rhomes-web rhomes-mongo 2>/dev/null || true
sudo docker volume rm rhomes_mongo_data 2>/dev/null || true
sudo docker system prune -f 2>/dev/null || true
echo "🗑️ Old containers and images removed."
echo "✅ Backend files created successfully!"
sudo docker compose build backend
sudo docker compose build redis
sudo docker compose build mongo
sudo docker compose build web
echo "⏳ Waiting for services to start..."
sleep 10
echo "🐳 Building services..."
if sudo docker ps -a --filter "name=rhomes_redis" --format "{{.Names}}" | grep -q rhomes_redis; then
    echo "📦 Found existing rhomes_redis container"
    
    # Check if it's running
    if sudo docker ps --filter "name=rhomes_redis" --format "{{.Names}}" | grep -q rhomes_redis; then
        echo "🛑 Container is running. Stopping..."

echo "🚀 Starting services..."
sudo ./redis.start.sh
sudo systemctl stop redis-server
sudo stop mongod
sudo docker compose up -d
sudo docker ps -a | grep redis
sudo docker restart rhomes_redis
sudo docker exec rhomes_redis redis-cli ping
echo "📊 Service status:"
sudo docker compose ps

echo "🌐 Testing backend..."
sudo docker ps | grep redis
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend is WORKING! 🎉"
    curl http://localhost:3000/health
else
    echo "❌ Backend still not working, checking logs..."
    sudo docker compose logs backend
fi
if
 curl -s http://localhost:3000/health | grep -q "healthy"; then
    echo "✅ Backend is WORKING! 🎉"
else
    echo "❌ Backend is NOT WORKING! Please check the logs."
    # Start services
 sudo docker compose up -d backend
 sudo docker exec rhomes_backend pnpm install
 sudo docker compose restart backend
fi
echo "🎉 RESET COMPLETE!"