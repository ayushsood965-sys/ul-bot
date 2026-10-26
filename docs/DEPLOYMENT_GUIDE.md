# Production Deployment Guide — The Verdict Room Studio

This guide describes how to deploy **The Verdict Room Studio** in production environments.

---

## 1. Architecture Overview

A production deployment consists of 4 components:
1. **Web Service**: Next.js 16 App Router application running on Node 22 (`npm start` on port 3000).
2. **Persistent Database**: PostgreSQL 16 (or SQLite for isolated single-server setups).
3. **Queue / Cache Store**: Redis 7 for BullMQ background tasks.
4. **Background Worker Daemon**: Continuously running worker process (`npm run worker` or Docker container) that claims due publishing jobs, executes Meta Graph API calls, and syncs insights.

---

## 2. Docker Compose Deployment (Recommended)

The provided `docker-compose.yml` configures all 4 services out-of-the-box.

### Step 1: Clone Repository & Configure Environment
```bash
git clone <your-repo-url>
cd genz-bot
cp .env.example .env
nano .env
```
Ensure you set:
- `JWT_SECRET` (A random 32+ character string)
- `POSTGRES_PASSWORD`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `INSTAGRAM_ACCESS_TOKEN` & `INSTAGRAM_ACCOUNT_ID`

### Step 2: Switch Prisma Schema to PostgreSQL (if using Postgres in Docker)
Run:
```bash
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

### Step 3: Launch Containers
```bash
docker compose up -d --build
```

### Step 4: Run Database Migrations and Seed
```bash
docker compose exec web npx prisma db push
docker compose exec web npx prisma db seed
```

### Step 5: Check Running Services
```bash
docker compose ps
docker compose logs -f worker
```

---

## 3. Standalone VPS / Server Deployment (e.g. Contabo / Ubuntu)

If deploying directly on an Ubuntu/Debian VPS without Docker:

### 1. Install Node.js 22 & System Packages
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential
```

### 2. Install Project Dependencies & Build
```bash
npm install --no-audit
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run build
```

### 3. Run Web App via PM2
```bash
sudo npm install -g pm2
pm2 start npm --name "tvr-studio" -- start
```

### 4. Run Background Publishing Worker via PM2
```bash
pm2 start npm --name "tvr-worker" -- run worker
pm2 save
pm2 startup
```

---

## 4. Reverse Proxy & SSL (Nginx + Certbot)

Sample Nginx server block:
```nginx
server {
    server_name studio.theverdictroom.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable SSL:
```bash
sudo certbot --nginx -d studio.theverdictroom.com
```

---

## 5. Security & Backup Guidelines

1. **Daily Database Backups**:
   ```bash
   # PostgreSQL:
   pg_dump -U verdict_user the_verdict_room > /backups/tvr_$(date +%F).sql
   # SQLite:
   sqlite3 dev.db ".backup '/backups/dev_$(date +%F).db'"
   ```
2. **Secret Management**:
   Never check in `.env` with live Meta tokens or Gemini keys. Keep secrets strictly in environment stores.
3. **Emergency Stop**:
   In the event of Meta API policy warnings or rate issues, trigger the master Emergency Stop button in the dashboard to immediately pause all publishing across all workers.
