# DevOps Shack — Node.js ProjectOps Studio

A full-stack **Node.js + Express + SQLite** CRUD project built as the Node.js counterpart of the Java/Spring Boot ProjectOps Studio application.

The application is intentionally designed with a different visual identity: **emerald/teal + graphite**, while preserving the project-management functionality and DevOps-focused data model.

## Features

- Responsive dashboard UI
- Persistent SQLite database
- Create project
- Read/list project
- Edit project
- Delete project with confirmation
- Search by title, owner or description
- Filter by status, category and difficulty
- Dashboard statistics
- Status distribution visualization
- Repository links
- Server-side validation
- REST API
- Health endpoint
- Database Studio for read-only SQL inspection
- Seed/demo records
- Automated unit tests with Node's built-in test runner
- Dockerfile + Docker Compose
- GitHub Actions CI

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22.5+ |
| Web framework | Express 5 |
| Database | SQLite through Node's `node:sqlite` module |
| UI | HTML + CSS + Vanilla JavaScript |
| Tests | `node:test` |
| Container | Docker |

> `node:sqlite` is available in modern Node.js 22 releases. Some Node 22 builds may still print an ExperimentalWarning; it does not prevent this project from running.

## Project structure

```text
devops-shack-node-projectops/
├── .github/workflows/node-ci.yml
├── docs/API.md
├── public/
│   ├── css/styles.css
│   └── js/app.js
├── src/
│   ├── db/database.js
│   ├── routes/apiRoutes.js
│   ├── routes/pageRoutes.js
│   ├── services/projectService.js
│   ├── utils/render.js
│   ├── app.js
│   ├── config.js
│   └── server.js
├── test/project-service.test.js
├── views/
│   ├── api-docs.html
│   ├── index.html
│   └── studio.html
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── start.bat
├── start.sh
└── README.md
```

## Data model

The `projects` table stores:

- `id`
- `title`
- `category`
- `difficulty`
- `status`
- `owner`
- `description`
- `repository_url`
- `created_at`
- `updated_at`

The SQLite database is created at:

```text
data/devopsshack.db
```

Data survives application restarts.

## Run locally

### 1. Check Node.js

```bash
node --version
npm --version
```

Use Node.js 22.5 or newer.

### 2. Install dependencies

```bash
npm install
```

### 3. Start

```bash
npm start
```

Development mode with automatic restart:

```bash
npm run dev
```

Open:

```text
Dashboard:       http://localhost:3000
Database Studio: http://localhost:3000/studio
API Docs:        http://localhost:3000/api-docs
Health:          http://localhost:3000/health
REST API:        http://localhost:3000/api/projects
```

Linux/macOS shortcut:

```bash
./start.sh
```

Windows:

```bat
start.bat
```

## CRUD API examples

### List

```bash
curl http://localhost:3000/api/projects
```

### Get one

```bash
curl http://localhost:3000/api/projects/1
```

### Create

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title":"GitOps Production Platform",
    "category":"GitOps",
    "difficulty":"Advanced",
    "status":"Planned",
    "owner":"DevOps Shack",
    "description":"Build a production GitOps workflow using Argo CD.",
    "repository_url":"https://github.com/jaiswaladi246"
  }'
```

### Update

```bash
curl -X PUT http://localhost:3000/api/projects/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Production CI/CD Pipeline",
    "category":"CI/CD",
    "difficulty":"Advanced",
    "status":"Completed",
    "owner":"DevOps Shack",
    "description":"Secure CI/CD pipeline with tests, scanning, deployment and rollback.",
    "repository_url":"https://github.com/jaiswaladi246"
  }'
```

### Delete

```bash
curl -X DELETE http://localhost:3000/api/projects/1
```

### Filter

```bash
curl "http://localhost:3000/api/projects?status=Active"
curl "http://localhost:3000/api/projects?category=Kubernetes&difficulty=Advanced"
curl "http://localhost:3000/api/projects?search=pipeline"
```

## Database Studio

Open:

```text
http://localhost:3000/studio
```

The studio intentionally allows only read-only statements:

```sql
SELECT * FROM projects;
SELECT * FROM projects WHERE status = 'Active';
SELECT category, COUNT(*) FROM projects GROUP BY category;
PRAGMA table_info(projects);
```

This gives you the same learning/inspection capability that the H2 Console provided in the Java project, but for SQLite.

## Test and verify

```bash
npm test
npm run check
npm run verify
```

## Docker

```bash
docker build -t devopsshack/node-projectops:1.0 .
docker run --rm -p 3000:3000 -v projectops-data:/app/data devopsshack/node-projectops:1.0
```

Or:

```bash
docker compose up --build
```

## Suggested GitHub repository name

```text
devops-shack-nodejs-express-projectops
```

Alternative:

```text
nodejs-express-sqlite-crud-project
```

## DevOps Shack

**Learn • Build • Automate • Master**
