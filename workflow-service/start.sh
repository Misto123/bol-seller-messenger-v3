#!/bin/bash

# BOL Seller Workflow Service Startup Script

cd "$(dirname "$0")"

echo "🚀 Starting BOL Seller Workflow Service..."

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
fi

# Start the service
npm start
