#!/bin/bash

# AdminGriffe Audit System Initialization Script
# This script sets up the complete audit and synchronization system

set -e

echo "🚀 Initializing AdminGriffe Integral Audit System"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running from project root
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Checking prerequisites..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose not found. Please install Docker Compose."
    exit 1
fi

print_success "Prerequisites check completed"

# Step 1: Install dependencies
print_status "Installing dependencies..."
cd apps/api
pnpm install
cd ../..

print_success "Dependencies installed"

# Step 2: Set up environment files
print_status "Setting up environment configuration..."

if [ ! -f "apps/api/.env" ]; then
    print_status "Creating .env file from template..."
    cp apps/api/.env.example apps/api/.env 2>/dev/null || {
        print_warning ".env.example not found. Creating basic .env file..."
        cat > apps/api/.env << EOF
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/admingriffe"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# API
PORT=3001
NODE_ENV="development"

# Audit System
AUDIT_ENABLED=true
AUDIT_SIGNATURE_KEY="your-audit-signature-key-change-in-production"
AUDIT_RETENTION_DAYS=2555  # 7 years for compliance

# Synchronization
SYNC_ENABLED=true
SYNC_BATCH_SIZE=1000
SYNC_RETRY_ATTEMPTS=3
SYNC_RETRY_DELAY=1000

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090

# Security
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL="info"
LOG_FORMAT="json"
EOF
    }
    print_success "Environment file configured"
else
    print_warning ".env file already exists. Skipping creation."
fi

# Step 3: Start infrastructure services
print_status "Starting infrastructure services with Docker Compose..."

if [ -f "docker-compose.yml" ]; then
    docker-compose up -d postgres redis rabbitmq
    print_success "Infrastructure services started"
else
    print_warning "docker-compose.yml not found. You'll need to start services manually."
fi

# Step 4: Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Step 5: Run database migrations
print_status "Running database migrations..."
cd apps/api
pnpm run db:migrate
print_success "Database migrations completed"

# Step 6: Generate Prisma client
print_status "Generating Prisma client..."
pnpm run db:generate
print_success "Prisma client generated"

# Step 7: Set up audit triggers
print_status "Setting up audit triggers..."
pnpm run audit:setup-triggers
print_success "Audit triggers configured"

# Step 8: Seed database (optional)
read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database..."
    pnpm run db:seed
    print_success "Database seeded"
fi

# Step 9: Run health checks
print_status "Running system health checks..."
pnpm run health:check
if [ $? -eq 0 ]; then
    print_success "All health checks passed"
else
    print_warning "Some health checks failed. Check the output above."
fi

# Step 10: Run tests
read -p "Do you want to run the test suite? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running test suite..."
    pnpm run test
    print_success "Tests completed"
fi

cd ../..

# Final status
echo ""
echo "🎉 AdminGriffe Audit System Initialization Complete!"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo "1. Review and update environment variables in apps/api/.env"
echo "2. Start the API server: cd apps/api && pnpm run dev"
echo "3. Access API documentation: http://localhost:3001/api/docs"
echo "4. Monitor metrics: http://localhost:9090/metrics"
echo ""
echo "📚 Documentation:"
echo "- System Overview: docs/AUDIT_SYSTEM.md"
echo "- Operations Guide: docs/RUNBOOK_AUDIT.md"
echo "- API Documentation: apps/api/README.md"
echo ""
echo "🔧 Useful Commands:"
echo "- Health Check: cd apps/api && pnpm run health:check"
echo "- Audit Verification: cd apps/api && pnpm run audit:verify"
echo "- Sync Status: cd apps/api && pnpm run sync:status"
echo "- View Logs: docker-compose logs -f"
echo ""
echo "⚠️  Security Reminders:"
echo "- Change default JWT secrets in production"
echo "- Update audit signature key"
echo "- Review and configure rate limiting"
echo "- Set up proper SSL/TLS certificates"
echo ""

print_success "System ready for development and testing!"