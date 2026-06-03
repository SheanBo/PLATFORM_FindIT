# FindIT Deployment Guide - Phase 2.7

## Overview

Complete deployment guide for FindIT application covering Docker, Docker Compose, and production deployment strategies.

---

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git
- 4GB RAM minimum
- 10GB disk space

---

## Local Development Deployment

### 1. Build and Run with Docker Compose

```bash
# Clone repository
git clone https://github.com/SheanBo/FIND_IT.git
cd FIND_IT

# Create .env file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend node src/database/init.js
docker-compose exec backend node src/database/seed.js
```

### 2. Access Services

```
Frontend:     http://localhost:3000
Backend API:  http://localhost:5000
Mail UI:      http://localhost:8025 (development)
Redis CLI:    redis-cli -p 6379
```

### 3. Stop Services

```bash
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

---

## Production Deployment

### 1. Environment Configuration

```env
# .env.production
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-key-here
DB_PATH=/data/findit.db
FRONTEND_URL=https://findit.yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
UPLOAD_DIR=/data/uploads
REDIS_URL=redis://redis:6379
```

### 2. Docker Build for Production

```bash
# Build optimized image
docker build -t findit:latest .
docker build -t findit:1.0.0 .

# Tag for registry
docker tag findit:latest registry.example.com/findit:latest
docker tag findit:latest registry.example.com/findit:1.0.0

# Push to registry
docker push registry.example.com/findit:latest
docker push registry.example.com/findit:1.0.0
```

### 3. Production Docker Compose

```bash
# Use production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f backend

# Scale backend (if using load balancer)
docker-compose up -d --scale backend=3
```

### 4. Database Initialization

```bash
# Initialize database in container
docker-compose exec backend node src/database/init.js

# Run optimizations
docker-compose exec backend sqlite3 database/findit.db < src/database/optimize.sql

# Create backups
docker-compose exec backend sqlite3 database/findit.db ".backup /backups/findit.db"
```

---

## Kubernetes Deployment (Advanced)

### 1. Create Namespace

```bash
kubectl create namespace findit
kubectl config set-context --current --namespace=findit
```

### 2. Create Secrets

```bash
kubectl create secret generic findit-secrets \
  --from-literal=JWT_SECRET=your-secret \
  --from-literal=SMTP_PASS=your-password \
  -n findit
```

### 3. Deploy Services

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n findit
kubectl get svc -n findit
```

---

## Monitoring & Health Checks

### 1. Health Endpoint

```bash
curl http://localhost:5000/api/health

# Response:
{
  "status": "ok",
  "timestamp": "2026-06-23T10:00:00Z"
}
```

### 2. Docker Health Check

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' findit-backend

# View health logs
docker inspect --format='{{json .State.Health.Log}}' findit-backend | jq
```

### 3. Performance Metrics

```bash
# Check backend metrics
curl http://localhost:5000/api/admin/performance

# View container stats
docker stats findit-backend
```

---

## Backup & Recovery

### 1. Backup Strategy

```bash
# Backup database
docker-compose exec backend sqlite3 database/findit.db ".backup /backups/findit.db"

# Backup uploads
docker-compose exec backend tar -czf /backups/uploads.tar.gz uploads/

# Backup everything
docker-compose exec backend tar -czf /backups/findit-full-$(date +%Y%m%d).tar.gz database/ uploads/
```

### 2. Automated Daily Backup

```bash
# Add to crontab
0 2 * * * docker-compose -f /app/FIND_IT/docker-compose.yml exec backend /app/backup.sh
```

### 3. Recovery

```bash
# Restore database
docker-compose exec backend sqlite3 database/findit.db ".restore /backups/findit.db"

# Restore uploads
docker-compose exec backend tar -xzf /backups/uploads.tar.gz
```

---

## Scaling Strategies

### 1. Horizontal Scaling

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Nginx load balances automatically
```

### 2. Caching with Redis

```bash
# Redis already in docker-compose.yml
# Configure in code:
const redis = require('redis');
const client = redis.createClient({ url: 'redis://redis:6379' });
```

### 3. Database Optimization

```bash
# Run periodic optimization
docker-compose exec backend sqlite3 database/findit.db "ANALYZE; VACUUM;"
```

---

## Troubleshooting

### 1. Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check port conflicts
lsof -i :5000

# Rebuild image
docker-compose build --no-cache backend
```

### 2. Database Issues

```bash
# Check database integrity
docker-compose exec backend sqlite3 database/findit.db "PRAGMA integrity_check;"

# Recover corrupted database
docker-compose exec backend sqlite3 database/findit.db ".recover" | sqlite3 database/findit.db.recovered
```

### 3. Email Not Sending

```bash
# Check Mailhog UI
http://localhost:8025

# Test SMTP connection
docker-compose exec backend nc -zv smtp 1025
```

### 4. Performance Issues

```bash
# Check resource usage
docker stats findit-backend

# Monitor response times
curl -w "Time: %{time_total}s\n" http://localhost:5000/api/health

# Check database performance
docker-compose exec backend node src/utils/performance.js
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker image
        run: docker build -t findit:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push findit:${{ github.sha }}
      
      - name: Deploy to production
        run: |
          ssh deploy@server 'cd /app/findit && docker pull findit:${{ github.sha }} && docker-compose up -d'
```

---

## Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Configure SMTP credentials securely
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up firewall rules
- [ ] Regular security updates (`docker pull` latest images)
- [ ] Database backups verified restorable
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] Environment variables not in version control
- [ ] Regular security audits scheduled

---

## Performance Tuning

### 1. Database

```bash
# Run indexes analysis
docker-compose exec backend sqlite3 database/findit.db "ANALYZE;"

# Optimize database
docker-compose exec backend sqlite3 database/findit.db "VACUUM;"
```

### 2. Caching

```bash
# Redis configuration
maxmemory 256mb
maxmemory-policy allkeys-lru

# Configure cache TTLs in code
const cacheKey = 'dashboard-stats';
const cacheTTL = 60000; // 1 minute
```

### 3. Image Optimization

```bash
# Pre-optimize images during build
npm run build:optimized

# Configure sharp library
imagemin({
  quality: 80,
  progressive: true
})
```

---

## Monitoring Services

### 1. Sentry (Error Tracking)

```bash
# Add to .env
SENTRY_DSN=https://your-sentry-dsn
```

### 2. Prometheus Metrics

```yaml
# prometheus.yml configuration
scrape_configs:
  - job_name: 'findit'
    static_configs:
      - targets: ['localhost:5000']
```

### 3. ELK Stack (Logging)

```bash
# Ships logs to Elasticsearch
docker-compose exec backend npm install winston-elasticsearch
```

---

## Rollback Procedures

### 1. Revert to Previous Version

```bash
# Rollback to previous commit
git revert HEAD

# Rebuild and deploy
docker build -t findit:latest .
docker-compose up -d
```

### 2. Database Rollback

```bash
# Restore from backup
docker-compose exec backend sqlite3 database/findit.db ".restore /backups/findit.db"
```

---

## Support & Maintenance

- **Status Page:** https://status.findit.local
- **Documentation:** See PHASE_2_PLAN.md, PERFORMANCE_GUIDE.md, MATCHING_GUIDE.md, FEATURES_GUIDE.md
- **Issues:** https://github.com/SheanBo/FIND_IT/issues
- **Security:** security@findit.local

---

**Last Updated:** June 2026
**Version:** 2.0.0 Production Ready
**Status:** Fully Operational
