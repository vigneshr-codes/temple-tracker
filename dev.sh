#!/bin/bash

# Temple Tracker - Local Development Startup Script
# Usage: ./dev.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# PID tracking
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down services...${NC}"
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null && echo -e "${GREEN}Backend stopped${NC}"
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && echo -e "${GREEN}Frontend stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${BLUE}Temple Tracker - Local Development${NC}"
echo "===================================="

# --- MongoDB ---
echo -e "${YELLOW}Checking MongoDB...${NC}"
if command -v mongod &>/dev/null && brew services list 2>/dev/null | grep -q "mongodb-community"; then
  if ! brew services list | grep "mongodb-community" | grep -q "started"; then
    echo -e "${YELLOW}Starting MongoDB via Homebrew...${NC}"
    brew services start mongodb-community
    sleep 2
  else
    echo -e "${GREEN}MongoDB already running (Homebrew)${NC}"
  fi
elif command -v mongod &>/dev/null; then
  if ! pgrep -x mongod &>/dev/null; then
    echo -e "${YELLOW}Starting mongod...${NC}"
    mkdir -p /tmp/mongodb-data
    mongod --dbpath /tmp/mongodb-data --logpath /tmp/mongod.log --fork
    sleep 2
  else
    echo -e "${GREEN}MongoDB already running${NC}"
  fi
elif command -v docker &>/dev/null; then
  if ! docker ps --format '{{.Names}}' | grep -q "temple-tracker-mongodb"; then
    echo -e "${YELLOW}Starting MongoDB via Docker...${NC}"
    docker run -d \
      --name temple-tracker-mongodb \
      --rm \
      -p 27017:27017 \
      mongo:6.0
    sleep 3
  else
    echo -e "${GREEN}MongoDB container already running${NC}"
  fi
else
  echo -e "${RED}MongoDB not found. Install MongoDB locally or Docker.${NC}"
  exit 1
fi

# Verify MongoDB is reachable
if command -v mongosh &>/dev/null; then
  if ! mongosh --eval "db.adminCommand('ping')" --quiet &>/dev/null; then
    echo -e "${RED}MongoDB is not reachable on localhost:27017${NC}"
    exit 1
  fi
fi
echo -e "${GREEN}MongoDB ready${NC}"

# --- Backend ---
echo -e "${YELLOW}Starting backend (port 3001)...${NC}"
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo -e "${YELLOW}Installing backend dependencies...${NC}"
  npm install --prefix "$BACKEND_DIR"
fi

npm run dev --prefix "$BACKEND_DIR" &
BACKEND_PID=$!
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"

# Wait a moment for backend to start before launching frontend
sleep 2

# --- Frontend ---
echo -e "${YELLOW}Starting frontend (Vite)...${NC}"
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo -e "${YELLOW}Installing frontend dependencies...${NC}"
  npm install --prefix "$FRONTEND_DIR"
fi

npm run dev --prefix "$FRONTEND_DIR" &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}All services running!${NC}"
echo -e "  Backend:  ${BLUE}http://localhost:3001${NC}"
echo -e "  Frontend: ${BLUE}http://localhost:5173${NC}  (check terminal for actual port)"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services.${NC}"
echo ""

# Wait for child processes
wait
