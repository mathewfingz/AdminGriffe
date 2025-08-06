#!/bin/bash

# AdminGriffe Vercel Deployment Script
# This script deploys all web applications to Vercel

set -e

echo "🚀 Starting AdminGriffe Vercel Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to deploy an application
deploy_app() {
    local app_name=$1
    local app_path=$2
    
    echo -e "${BLUE}📦 Deploying $app_name...${NC}"
    
    cd "$app_path"
    
    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        echo -e "${RED}❌ vercel.json not found in $app_path${NC}"
        return 1
    fi
    
    # Deploy to production
    if vercel --prod --yes; then
        echo -e "${GREEN}✅ $app_name deployed successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to deploy $app_name${NC}"
        return 1
    fi
    
    cd - > /dev/null
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed. Installing...${NC}"
    pnpm add -g vercel
fi

# Check if user is logged in to Vercel
echo -e "${YELLOW}🔐 Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}🔑 Please log in to Vercel...${NC}"
    vercel login
fi

# Get the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}📁 Root directory: $ROOT_DIR${NC}"

# Deploy applications
echo -e "${YELLOW}🚀 Starting deployments...${NC}"

# Deploy Next.js Admin Application
deploy_app "Web Admin (Next.js)" "$ROOT_DIR/apps/web-admin"

# Deploy Vite Applications
deploy_app "Nova Haven" "$ROOT_DIR/nova-haven"
deploy_app "Nova Works" "$ROOT_DIR/nova-works"
deploy_app "Curry Landing" "$ROOT_DIR/curry-landing"
deploy_app "Pixel Verse" "$ROOT_DIR/pixel-verse"

echo -e "${GREEN}🎉 All deployments completed!${NC}"

# Show deployment URLs
echo -e "${BLUE}📋 Deployment URLs:${NC}"
echo "You can find your deployment URLs in the Vercel dashboard:"
echo "https://vercel.com/dashboard"

echo -e "${YELLOW}💡 Tip: You can also run 'vercel ls' to see all your deployments${NC}"