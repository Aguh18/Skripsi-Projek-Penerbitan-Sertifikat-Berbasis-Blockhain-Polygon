# 📚 Tutorial Deployment CertChain

## 🎯 Overview
Tutorial ini akan memandu Anda melakukan deployment Frontend dan Backend secara terpisah dengan cara yang paling mudah.

---

## 🚀 Deployment Frontend (React)

### Step 1: Persiapan Frontend
```bash
# Masuk ke direktori Frontend
cd "FE skrisi"

# Install dependencies
npm install

# Build untuk production
npm run build
```

### Step 2: Deployment Frontend dengan Docker
```bash
# Build image Frontend
docker build -t certchain-frontend .

# Jalankan container Frontend
docker run -d -p 8080:80 --name certchain-frontend certchain-frontend
```

### Step 3: Verifikasi Frontend
- Buka browser: http://localhost:8080
- Frontend sudah berjalan di port 8080

---

## 🔧 Deployment Backend (Node.js)

### Step 1: Persiapan Backend
```bash
# Masuk ke direktori Backend
cd "BE skripsi"

# Install dependencies
npm install

# Setup environment
cp env.example .env
```

### Step 2: Konfigurasi Environment
Edit file `.env` di direktori `BE skripsi/`:
```env
# Database
DATABASE_URL="your_database_url"

# JWT
JWT_SECRET="your_secret_key"

# Server
PORT=3000
NODE_ENV=production

# Blockchain
POLYGON_RPC_URL="https://polygon-rpc.com"
CONTRACT_ADDRESS="your_contract_address"
PRIVATE_KEY="your_private_key"
```

### Step 3: Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

### Step 4: Deployment Backend dengan Docker
```bash
# Build image Backend
docker build -t certchain-backend .

# Jalankan container Backend
docker run -d -p 3000:3000 --env-file .env --name certchain-backend certchain-backend
```

### Step 5: Verifikasi Backend
```bash
# Test API endpoint
curl http://localhost:3000/api/health

# Atau buka browser: http://localhost:3000
```

---

## 🔗 Deployment dengan Docker Compose (All-in-One)

### Step 1: Setup Environment
```bash
# Di root directory proyek
# Copy environment file
cp "BE skripsi/env.example" "BE skripsi/.env"

# Edit environment file sesuai kebutuhan
nano "BE skripsi/.env"
```

### Step 2: Deploy Semua Service
```bash
# Build dan jalankan semua service
docker-compose up --build -d

# Cek status
docker-compose ps

# Lihat logs
docker-compose logs -f
```

### Step 3: Akses Aplikasi
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000

---

## 🌐 Deployment ke Server VPS

### Step 1: Upload Kode ke Server
```bash
# Di server, clone repository
git clone <your-repository-url>
cd Skripsi-Projek-Penerbitan-Sertifikat-Berbasis-Blockhain-Polygon

# Atau upload via SCP
scp -r ./ user@your-server:/path/to/project
```

### Step 2: Setup Server
```bash
# Install Docker di server (Ubuntu/Debian)
sudo apt update
sudo apt install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
# Logout dan login kembali
```

### Step 3: Deploy di Server
```bash
# Setup environment
cp "BE skripsi/env.example" "BE skripsi/.env"
nano "BE skripsi/.env"

# Deploy
docker-compose up --build -d
```

---

## 🔧 Troubleshooting

### Frontend Issues
```bash
# Cek logs Frontend
docker logs certchain-frontend

# Restart Frontend
docker restart certchain-frontend

# Rebuild Frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Backend Issues
```bash
# Cek logs Backend
docker logs certchain-backend

# Restart Backend
docker restart certchain-backend

# Cek database connection
docker exec -it certchain-backend npx prisma db push
```

### Database Issues
```bash
# Reset database
docker exec -it certchain-backend npx prisma migrate reset

# Generate Prisma client
docker exec -it certchain-backend npx prisma generate
```

---

## 📊 Monitoring & Maintenance

### Useful Commands
```bash
# Cek status containers
docker ps

# Lihat logs real-time
docker-compose logs -f

# Stop semua service
docker-compose down

# Update dan restart
docker-compose pull
docker-compose up --build -d

# Backup database
docker exec -it certchain-backend pg_dump > backup.sql
```

### Performance Monitoring
```bash
# Cek resource usage
docker stats

# Cek disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

## 🎯 Quick Deployment Commands

### Deploy Frontend Only
```bash
cd "FE skrisi"
docker build -t certchain-frontend .
docker run -d -p 8080:80 certchain-frontend
```

### Deploy Backend Only
```bash
cd "BE skripsi"
docker build -t certchain-backend .
docker run -d -p 3000:3000 --env-file .env certchain-backend
```

### Deploy All Services
```bash
docker-compose up --build -d
```

---

## ✅ Checklist Deployment

- [ ] Environment variables dikonfigurasi
- [ ] Database terhubung dan migrated
- [ ] Frontend build berhasil
- [ ] Backend API berjalan
- [ ] Blockchain contract terdeploy
- [ ] SSL certificate (untuk production)
- [ ] Domain dikonfigurasi
- [ ] Monitoring setup

---

## 🆘 Support

Jika mengalami masalah:
1. Cek logs: `docker-compose logs -f`
2. Restart services: `docker-compose restart`
3. Rebuild: `docker-compose up --build -d`
4. Cek environment variables
5. Pastikan database connection 