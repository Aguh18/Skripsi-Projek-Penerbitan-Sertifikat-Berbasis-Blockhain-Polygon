# Docker Deployment Guide

## Prerequisites
- Docker installed on your system
- Docker Compose installed

## Quick Start

### 1. Build and Run with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### 2. Access the Application
- Frontend: http://localhost
- Backend API: http://localhost:3000

## Individual Service Commands

### Backend Only
```bash
# Build backend image
docker build -t certificate-backend ./BE\ skripsi

# Run backend container
docker run -p 3000:3000 --env-file ./BE\ skripsi/.env certificate-backend
```

### Frontend Only
```bash
# Build frontend image
docker build -t certificate-frontend ./FE\ skrisi

# Run frontend container
docker run -p 80:80 certificate-frontend
```

## Environment Variables

### Backend (.env file in BE skripsi/)
Make sure to create a `.env` file in the `BE skripsi/` directory with your configuration:
```
DATABASE_URL="your_database_url"
JWT_SECRET="your_jwt_secret"
PORT=3000
# Add other required environment variables
```

## Production Deployment

### 1. Using Docker Compose
```bash
# Set environment to production
export NODE_ENV=production

# Build and run
docker-compose -f docker-compose.yml up -d --build
```

### 2. Using Docker Swarm (for scaling)
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml certificate-app
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove all containers and images
docker-compose down --rmi all --volumes --remove-orphans

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change ports in docker-compose.yml
   - Kill existing processes using the ports

2. **Environment variables not loading**
   - Ensure .env file exists in BE skripsi/ directory
   - Check file permissions

3. **Database connection issues**
   - Verify DATABASE_URL in .env file
   - Ensure database is accessible from container

### Logs
```bash
# View backend logs
docker-compose logs backend

# View frontend logs
docker-compose logs frontend
```

## Development vs Production

### Development
- Use `docker-compose.dev.yml` (if created)
- Mount source code as volumes for hot reload
- Enable debug mode

### Production
- Use multi-stage builds (already configured)
- Minimize image size
- Use production environment variables
- Enable proper logging and monitoring 