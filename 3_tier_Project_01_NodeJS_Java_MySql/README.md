# DevOps Shack — Java Three-Tier ProjectOps

A real three-tier application with independently runnable components:

```text
Browser
  |
  | HTTP :5173
  v
React + Vite Frontend
  |
  | /api (Vite reverse proxy)
  v
Spring Boot REST API :8080
  |
  | JDBC
  v
MySQL :3306
```

The tiers are separate processes. The browser never connects to MySQL directly.

## What is included

- React + Vite animated responsive UI
- Java 21 + Spring Boot REST backend
- MySQL 8 database
- Project CRUD
- Search and filters
- Dashboard metrics
- Progress updates
- Activity/audit timeline
- Validation and REST error handling
- Seed data on a new database
- DB-aware `/api/health` endpoint
- Native local/EC2 run scripts
- Dockerfiles and Docker Compose

---

# Recommended: run WITHOUT Docker

## Prerequisites

- JDK 21
- Maven 3.9+
- Node.js 20+ (Node 22 recommended)
- npm
- MySQL 8+
- curl

Ubuntu example:

```bash
sudo apt update
sudo apt install mysql-server -y
```

Install Java/Node/Maven using your preferred method if they are not already present.

## 1. Set up MySQL once

From the project root:

```bash
./scripts/setup-local-mysql.sh
```

This creates:

```text
Host:     127.0.0.1
Port:     3306
Database: projectops
Username: projectops
Password: projectops123
```

Equivalent manual command:

```bash
sudo mysql < database/setup-local.sql
```

The Spring Boot backend creates/updates the application tables automatically with JPA/Hibernate and seeds five demo projects when the projects table is empty.

## 2. Start backend

Terminal 1:

```bash
./scripts/run-backend.sh
```

Equivalent:

```bash
cd backend
mvn spring-boot:run
```

Backend:

```text
http://127.0.0.1:8080
```

Health + DB verification:

```bash
curl http://127.0.0.1:8080/api/health
curl http://127.0.0.1:8080/api/projects
```

A healthy response includes `"database":"UP"`.

## 3. Start frontend

Terminal 2:

```bash
./scripts/run-frontend.sh
```

Equivalent:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

On an EC2/VM host, open:

```text
http://<SERVER-PUBLIC-IP>:5173
```

`npm run dev` already listens on `0.0.0.0`; no extra `--host` argument is required.

### Important: no frontend `.env` is required

The frontend calls the relative URL:

```text
/api
```

Vite proxies `/api` to:

```text
http://127.0.0.1:8080
```

Therefore the browser does not try to call `localhost:8080` on your laptop when the UI is running on EC2. You also do not need to hard-code the EC2 public IP into the project.

For the normal same-host EC2 setup, only port `5173` needs to be reachable from your browser. Port `3306` should remain private. Port `8080` only needs to be public if you explicitly want to access the backend directly from outside the server.

## 4. Check all three tiers

```bash
./scripts/check-stack.sh
```

Expected result:

```text
MySQL:              UP
Backend + DB:       UP  {"status":"UP",..."database":"UP"...}
Frontend:           UP
```

---

# Why the frontend now works from localhost AND EC2

Previous-style configuration such as:

```text
VITE_API_URL=http://localhost:8080/api
```

is fragile when the UI is opened from another computer because browser-side `localhost` means the user's computer.

This project now uses:

```text
Browser -> http://server:5173/api/...
              |
              v
          Vite proxy
              |
              v
       127.0.0.1:8080/api/...
```

So the frontend contains no machine-specific IP address.

---

# Environment overrides

The defaults work without environment variables.

## Backend

Only set these when the backend/database topology is different:

```text
SERVER_PORT=8080
DB_URL=jdbc:mysql://127.0.0.1:3306/projectops?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=projectops
DB_PASSWORD=projectops123
CORS_ALLOWED_ORIGIN_PATTERNS=*
```

Example remote database:

```bash
export DB_URL='jdbc:mysql://10.0.2.20:3306/projectops?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
export DB_USERNAME=projectops
export DB_PASSWORD='your-password'
mvn spring-boot:run
```

## Frontend

Normally set nothing.

If the backend is intentionally on another origin, create `frontend/.env`:

```env
VITE_API_URL=https://api.example.com/api
```

If you only want Vite to proxy `/api` to a different backend during development:

```bash
VITE_PROXY_TARGET=http://10.0.2.15:8080 npm run dev
```

---

# Main REST endpoints

```text
GET    /api/health
GET    /api/dashboard/summary
GET    /api/activities?limit=10
GET    /api/projects
GET    /api/projects/{id}
POST   /api/projects
PUT    /api/projects/{id}
PATCH  /api/projects/{id}/progress
DELETE /api/projects/{id}
```

Examples:

```bash
curl http://127.0.0.1:8080/api/projects
curl 'http://127.0.0.1:8080/api/projects?status=ACTIVE'
curl 'http://127.0.0.1:8080/api/projects?priority=CRITICAL'
curl 'http://127.0.0.1:8080/api/projects?search=kubernetes'
```

You can also test through the frontend proxy:

```bash
curl http://127.0.0.1:5173/api/projects
```

---

# Build and test

Backend tests:

```bash
cd backend
mvn test
```

Backend JAR:

```bash
mvn clean package
java -jar target/projectops-api.jar
```

Frontend production build:

```bash
cd frontend
npm install
npm run build
```

Output:

```text
frontend/dist/
```

---

# Docker option

Docker is optional.

```bash
docker compose up --build -d
```

Open:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8080/api/health
MySQL:    localhost:3306
```

The Docker frontend also uses same-origin `/api`; Nginx proxies it to the backend container. No public-IP build argument is required.

Stop:

```bash
docker compose down
```

Delete Docker database data too:

```bash
docker compose down -v
```

---

# Three-tier deployment model

The development reverse proxy does not combine the application tiers. It is only the network route used by the frontend web server.

You can deploy independently as:

```text
Frontend VM / Nginx / CDN
        |
        | REST/HTTP
        v
Backend VM / Spring Boot
        |
        | JDBC/TCP
        v
MySQL VM / RDS
```

When deploying the frontend and backend to genuinely different public origins, configure either a web-server reverse proxy or `VITE_API_URL`, and restrict `CORS_ALLOWED_ORIGIN_PATTERNS` appropriately for production.
