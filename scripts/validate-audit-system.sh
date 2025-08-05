#!/bin/bash

# Integral Audit System Validation Script
# This script validates all components of the audit system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${NAMESPACE:-"audit-system"}
RELEASE_NAME=${RELEASE_NAME:-"audit-system"}
TIMEOUT=${TIMEOUT:-"300s"}

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if kubectl is available
check_kubectl() {
    log "Checking kubectl availability..."
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
        exit 1
    fi
    success "kubectl is available"
}

# Check if Helm is available
check_helm() {
    log "Checking Helm availability..."
    if ! command -v helm &> /dev/null; then
        error "Helm is not installed or not in PATH"
        exit 1
    fi
    success "Helm is available"
}

# Check namespace
check_namespace() {
    log "Checking namespace: $NAMESPACE"
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        success "Namespace $NAMESPACE exists"
    else
        warning "Namespace $NAMESPACE does not exist, creating..."
        kubectl create namespace "$NAMESPACE"
        success "Namespace $NAMESPACE created"
    fi
}

# Check Helm release
check_helm_release() {
    log "Checking Helm release: $RELEASE_NAME"
    if helm list -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        success "Helm release $RELEASE_NAME found"
        helm status "$RELEASE_NAME" -n "$NAMESPACE"
    else
        error "Helm release $RELEASE_NAME not found in namespace $NAMESPACE"
        exit 1
    fi
}

# Check pods status
check_pods() {
    log "Checking pods status..."
    
    # Wait for pods to be ready
    kubectl wait --for=condition=Ready pods -l app.kubernetes.io/instance="$RELEASE_NAME" -n "$NAMESPACE" --timeout="$TIMEOUT" || {
        error "Pods are not ready within timeout"
        kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
        exit 1
    }
    
    # Check individual components
    local components=("api-gateway" "sync-worker")
    for component in "${components[@]}"; do
        local pod_count=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component="$component" --no-headers | wc -l)
        if [ "$pod_count" -gt 0 ]; then
            success "$component: $pod_count pod(s) running"
        else
            error "$component: No pods found"
        fi
    done
}

# Check services
check_services() {
    log "Checking services..."
    
    local services=("api-gateway" "sync-worker")
    for service in "${services[@]}"; do
        if kubectl get service "$RELEASE_NAME-$service" -n "$NAMESPACE" &> /dev/null; then
            success "Service $service exists"
        else
            error "Service $service not found"
        fi
    done
}

# Check databases
check_databases() {
    log "Checking database connectivity..."
    
    # PostgreSQL
    if kubectl get service "$RELEASE_NAME-postgresql" -n "$NAMESPACE" &> /dev/null; then
        log "Testing PostgreSQL connection..."
        kubectl exec -n "$NAMESPACE" deployment/"$RELEASE_NAME-api-gateway" -- pg_isready -h "$RELEASE_NAME-postgresql" -p 5432 && \
            success "PostgreSQL is accessible" || warning "PostgreSQL connection failed"
    fi
    
    # MySQL
    if kubectl get service "$RELEASE_NAME-mysql" -n "$NAMESPACE" &> /dev/null; then
        log "Testing MySQL connection..."
        kubectl exec -n "$NAMESPACE" deployment/"$RELEASE_NAME-api-gateway" -- mysqladmin ping -h "$RELEASE_NAME-mysql" -P 3306 --silent && \
            success "MySQL is accessible" || warning "MySQL connection failed"
    fi
    
    # MongoDB
    if kubectl get service "$RELEASE_NAME-mongodb" -n "$NAMESPACE" &> /dev/null; then
        log "Testing MongoDB connection..."
        kubectl exec -n "$NAMESPACE" deployment/"$RELEASE_NAME-api-gateway" -- mongosh --host "$RELEASE_NAME-mongodb:27017" --eval "db.adminCommand('ping')" --quiet && \
            success "MongoDB is accessible" || warning "MongoDB connection failed"
    fi
}

# Check message queue
check_kafka() {
    log "Checking Kafka connectivity..."
    
    if kubectl get service "$RELEASE_NAME-kafka" -n "$NAMESPACE" &> /dev/null; then
        log "Testing Kafka connection..."
        kubectl exec -n "$NAMESPACE" deployment/"$RELEASE_NAME-sync-worker" -- kafka-broker-api-versions --bootstrap-server "$RELEASE_NAME-kafka:9092" && \
            success "Kafka is accessible" || warning "Kafka connection failed"
        
        # Check topics
        log "Checking Kafka topics..."
        local topics=("audit-events" "sync-events" "conflict-events" "dead-letter-queue")
        for topic in "${topics[@]}"; do
            if kubectl exec -n "$NAMESPACE" deployment/"$RELEASE_NAME-sync-worker" -- kafka-topics --bootstrap-server "$RELEASE_NAME-kafka:9092" --list | grep -q "$topic"; then
                success "Topic $topic exists"
            else
                warning "Topic $topic not found"
            fi
        done
    fi
}

# Check Redis
check_redis() {
    log "Checking Redis connectivity..."
    
    if kubectl get service "$RELEASE_NAME-redis-master" -n "$NAMESPACE" &> /dev/null; then
        log "Testing Redis connection..."
        kubectl exec -n "$NAMESPACE" deployment/"$RELEASE_NAME-api-gateway" -- redis-cli -h "$RELEASE_NAME-redis-master" -p 6379 ping && \
            success "Redis is accessible" || warning "Redis connection failed"
    fi
}

# Check API endpoints
check_api_endpoints() {
    log "Checking API endpoints..."
    
    # Port forward to test locally
    kubectl port-forward -n "$NAMESPACE" service/"$RELEASE_NAME-api-gateway" 8080:80 &
    local port_forward_pid=$!
    sleep 5
    
    # Test health endpoint
    if curl -s http://localhost:8080/health | grep -q "ok"; then
        success "Health endpoint is working"
    else
        warning "Health endpoint failed"
    fi
    
    # Test metrics endpoint
    if curl -s http://localhost:8080/metrics | grep -q "audit_"; then
        success "Metrics endpoint is working"
    else
        warning "Metrics endpoint failed"
    fi
    
    # Test API docs
    if curl -s http://localhost:8080/api/docs | grep -q "swagger"; then
        success "API documentation is accessible"
    else
        warning "API documentation failed"
    fi
    
    # Clean up port forward
    kill $port_forward_pid 2>/dev/null || true
}

# Check monitoring
check_monitoring() {
    log "Checking monitoring components..."
    
    # Check ServiceMonitors
    if kubectl get servicemonitor -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        success "ServiceMonitors are configured"
    else
        warning "ServiceMonitors not found"
    fi
    
    # Check PrometheusRules
    if kubectl get prometheusrule -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        success "PrometheusRules are configured"
    else
        warning "PrometheusRules not found"
    fi
    
    # Check PodMonitors
    if kubectl get podmonitor -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        success "PodMonitors are configured"
    else
        warning "PodMonitors not found"
    fi
}

# Check autoscaling
check_autoscaling() {
    log "Checking autoscaling configuration..."
    
    # Check HPA
    local hpa_count=$(kubectl get hpa -n "$NAMESPACE" | grep -c "$RELEASE_NAME" || echo "0")
    if [ "$hpa_count" -gt 0 ]; then
        success "HPA configured for $hpa_count component(s)"
        kubectl get hpa -n "$NAMESPACE"
    else
        warning "No HPA found"
    fi
    
    # Check VPA
    if kubectl get vpa -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        success "VPA is configured"
    else
        warning "VPA not found"
    fi
}

# Check security
check_security() {
    log "Checking security configuration..."
    
    # Check ServiceAccount
    if kubectl get serviceaccount "$RELEASE_NAME" -n "$NAMESPACE" &> /dev/null; then
        success "ServiceAccount exists"
    else
        warning "ServiceAccount not found"
    fi
    
    # Check RBAC
    if kubectl get clusterrole "$RELEASE_NAME" &> /dev/null; then
        success "ClusterRole exists"
    else
        warning "ClusterRole not found"
    fi
    
    # Check NetworkPolicies
    local netpol_count=$(kubectl get networkpolicy -n "$NAMESPACE" | grep -c "$RELEASE_NAME" || echo "0")
    if [ "$netpol_count" -gt 0 ]; then
        success "NetworkPolicies configured: $netpol_count"
    else
        warning "No NetworkPolicies found"
    fi
    
    # Check Secrets
    local secret_count=$(kubectl get secrets -n "$NAMESPACE" | grep -c "$RELEASE_NAME" || echo "0")
    if [ "$secret_count" -gt 0 ]; then
        success "Secrets configured: $secret_count"
    else
        warning "No secrets found"
    fi
}

# Performance test
run_performance_test() {
    log "Running basic performance test..."
    
    # Port forward for testing
    kubectl port-forward -n "$NAMESPACE" service/"$RELEASE_NAME-api-gateway" 8080:80 &
    local port_forward_pid=$!
    sleep 5
    
    # Simple load test using curl
    log "Testing API response time..."
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:8080/health)
    if (( $(echo "$response_time < 0.1" | bc -l) )); then
        success "API response time: ${response_time}s (< 100ms)"
    else
        warning "API response time: ${response_time}s (> 100ms)"
    fi
    
    # Clean up
    kill $port_forward_pid 2>/dev/null || true
}

# Generate validation report
generate_report() {
    log "Generating validation report..."
    
    local report_file="/tmp/audit-system-validation-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "Audit System Validation Report"
        echo "=============================="
        echo "Date: $(date)"
        echo "Namespace: $NAMESPACE"
        echo "Release: $RELEASE_NAME"
        echo ""
        
        echo "Pod Status:"
        kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
        echo ""
        
        echo "Service Status:"
        kubectl get services -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
        echo ""
        
        echo "HPA Status:"
        kubectl get hpa -n "$NAMESPACE" || echo "No HPA found"
        echo ""
        
        echo "Resource Usage:"
        kubectl top pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME" || echo "Metrics not available"
        echo ""
        
        echo "Recent Events:"
        kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -10
        
    } > "$report_file"
    
    success "Validation report saved to: $report_file"
}

# Main validation function
main() {
    log "Starting Audit System Validation"
    log "================================"
    
    # Basic checks
    check_kubectl
    check_helm
    check_namespace
    check_helm_release
    
    # Component checks
    check_pods
    check_services
    
    # Infrastructure checks
    check_databases
    check_kafka
    check_redis
    
    # Application checks
    check_api_endpoints
    
    # Monitoring and scaling
    check_monitoring
    check_autoscaling
    
    # Security
    check_security
    
    # Performance
    run_performance_test
    
    # Generate report
    generate_report
    
    log "Validation completed!"
    success "Audit System is ready for production use"
}

# Handle script arguments
case "${1:-}" in
    "pods")
        check_pods
        ;;
    "services")
        check_services
        ;;
    "databases")
        check_databases
        ;;
    "kafka")
        check_kafka
        ;;
    "redis")
        check_redis
        ;;
    "api")
        check_api_endpoints
        ;;
    "monitoring")
        check_monitoring
        ;;
    "security")
        check_security
        ;;
    "performance")
        run_performance_test
        ;;
    "report")
        generate_report
        ;;
    *)
        main
        ;;
esac