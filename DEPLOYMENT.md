# ConvoForge Deployment Checklist & Instructions

To move ConvoForge from your local machine to your Hostinger VPS, follow these steps.

## 1. Environment Configuration
Create a `.env` file in the root of the project with the following keys. **Do not commit this file to GitHub.**

```bash
# Backend (FastAPI)
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/convoforge
ANTHROPIC_API_KEY=your_anthropic_key
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
APP_URL=https://convoforge.yourdomain.com

# Cloudflare R2
R2_ACCESS_KEY_ID=your_id
R2_SECRET_ACCESS_KEY=your_secret
R2_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=convoforge-recordings

# Frontend (Next.js)
BACKEND_URL=https://api.convoforge.yourdomain.com
```

## 2. Docker Orchestration
Create a `docker-compose.yml` in the project root to manage the services together.

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    container_name: cf_db
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER:-andrew}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-convoforge}
      POSTGRES_DB: convoforge
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build: 
      context: ./services/api
    container_name: cf_api
    restart: always
    depends_on:
      - db
    env_file: .env
    ports:
      - "8000:8000"

  web:
    build:
      context: ./apps/web
    container_name: cf_web
    restart: always
    env_file: .env
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

## 3. Production Readiness Steps

### Backend
- [ ] **Dockerfile**: Create `services/api/Dockerfile` using a Python 3.13 slim base image.
- [ ] **Alembic**: Run `alembic upgrade head` on the VPS to provision the schema.
- [ ] **CORS**: Ensure `main.py` has `CORSMiddleware` configured to allow your domain.

### Frontend
- [ ] **Dockerfile**: Create `apps/web/Dockerfile` using a Node 20/22 multi-stage build.
- [ ] **Build Optimization**: Run `npm run build` as part of the Docker build to create a production-optimized bundle.

### Infrastructure (VPS Side)
- [ ] **Nginx Proxy Manager**: Set up two hosts:
    - `convoforge.yourdomain.com` -> `http://localhost:3000`
    - `api.convoforge.yourdomain.com` -> `http://localhost:8000`
    - On the API host, enable **Websockets Support** (the Deepgram audio relay at
      `/api/deepgram/stream` is a WebSocket).
- [ ] **SSL**: Enable Let's Encrypt (Force SSL) in Nginx Proxy Manager.
- [ ] **Firewall**: Ensure ports 80 and 443 are open, but 5432, 8000, and 3000 are blocked from outside access.

## 4. Deployment Command
Once Dockerfiles are ready and the `.env` is set on the VPS:
```bash
docker-compose up -d --build
```
