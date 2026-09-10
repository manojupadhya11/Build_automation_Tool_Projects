# DevOps Shack ProjectOps — Python + .NET + PostgreSQL

A complete three-tier CRUD application built for a clear DevOps learning/demo workflow.

```text
Browser
  |
  | HTTP
  v
Python / Flask frontend        :5000
  |
  | HTTP + JSON
  v
ASP.NET Core Web API (.NET 8)  :8080
  |
  | EF Core / Npgsql / SQL
  v
PostgreSQL                     :5432
```

## What works

- Create, read, update and delete projects
- Search projects
- Filter by status, category and difficulty
- Dashboard statistics
- Progress tracking
- PostgreSQL persistence
- Four demo projects seeded on the first run
- Python frontend health endpoint
- .NET backend health endpoint
- Docker Compose for the complete stack

## Project structure

```text
devops-shack-python-dotnet-postgres-projectops/
├── frontend-python/
│   ├── app.py
│   ├── requirements.txt
│   ├── templates/index.html
│   └── static/
│       ├── css/styles.css
│       └── js/app.js
├── backend-dotnet/
│   ├── ProjectOps.Api.csproj
│   ├── Program.cs
│   ├── Controllers/
│   ├── Data/
│   ├── Dtos/
│   └── Models/
├── docs/API.md
├── docker-compose.yml
└── .env.example
```

# Option 1 — Run the whole stack with Docker Compose

This is the easiest route because PostgreSQL, .NET and Python start together.

## Prerequisites

- Docker
- Docker Compose v2

## Run

From the project root:

```bash
docker compose up --build
```

Open:

```text
Frontend UI:  http://localhost:5000
.NET API:     http://localhost:8080/api/projects
Backend health: http://localhost:8080/health
Frontend health: http://localhost:5000/health
PostgreSQL:   localhost:5432
```

Stop:

```bash
docker compose down
```

Stop and also delete the PostgreSQL data volume:

```bash
docker compose down -v
```

# Option 2 — Run every tier manually on your local machine

This path is better when you want to teach exactly how the three tiers connect.

## 1. Prerequisites

Install:

- Python 3.11+
- .NET 8 SDK
- PostgreSQL 15/16+

Verify:

```bash
python3 --version
dotnet --version
psql --version
```

On Windows, `python` may be used instead of `python3`.

## 2. Prepare PostgreSQL

Open PostgreSQL as the postgres administrator:

```bash
sudo -u postgres psql
```

On Windows you can open `psql` from the PostgreSQL installation/SQL Shell and connect as user `postgres`.

Run:

```sql
CREATE DATABASE projectops;
CREATE USER projectops WITH PASSWORD 'projectops123';
GRANT ALL PRIVILEGES ON DATABASE projectops TO projectops;
\c projectops
GRANT ALL ON SCHEMA public TO projectops;
ALTER SCHEMA public OWNER TO projectops;
\q
```

Test the login:

```bash
psql -h 127.0.0.1 -U projectops -d projectops
```

Then:

```sql
\dt
\q
```

The table may not exist yet; the .NET backend creates it on first startup.

## 3. Start the .NET backend

Open terminal 1:

```bash
cd backend-dotnet
dotnet restore
dotnet build
dotnet run
```

The backend uses the connection string in `backend-dotnet/appsettings.json`:

```text
Host=localhost;Port=5432;Database=projectops;Username=projectops;Password=projectops123
```

Test it:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/projects
```

If `dotnet run` starts on a different port because of your local settings, force port 8080:

Linux/macOS:

```bash
ASPNETCORE_URLS=http://localhost:8080 dotnet run
```

PowerShell:

```powershell
$env:ASPNETCORE_URLS="http://localhost:8080"
dotnet run
```

## 4. Start the Python frontend

Open terminal 2:

Linux/macOS:

```bash
cd frontend-python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
BACKEND_URL=http://localhost:8080 python app.py
```

Windows PowerShell:

```powershell
cd frontend-python
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:BACKEND_URL="http://localhost:8080"
python app.py
```

Open:

```text
http://localhost:5000
```

## 5. Verify PostgreSQL data

After creating/editing projects in the browser:

```bash
psql -h 127.0.0.1 -U projectops -d projectops
```

Run:

```sql
\dt
SELECT id, title, category, status, progress FROM projects ORDER BY id;
\q
```

# What happens when you run it?

## Python frontend

```bash
python app.py
```

- Starts Flask on port 5000.
- Serves HTML/CSS/JavaScript to the browser.
- Receives `/api/...` requests from the browser.
- Forwards those requests to the .NET backend.

## .NET backend

```bash
dotnet run
```

- Restores/builds the ASP.NET Core application when necessary.
- Starts the API server on port 8080.
- Connects to PostgreSQL through EF Core + Npgsql.
- Creates the `projects` table when it does not exist.
- Seeds four sample records only when the table is empty.
- Executes CRUD operations requested by the frontend.

## PostgreSQL

- Runs independently as the database server.
- Stores the actual project rows.
- Data survives Python/.NET restarts.
- With Docker Compose, data is kept in the named `postgres_data` volume.

# Useful commands

## .NET

```bash
cd backend-dotnet
dotnet restore
dotnet build
dotnet run
dotnet publish -c Release -o publish
```

## Python

```bash
cd frontend-python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

## PostgreSQL

```bash
psql -h 127.0.0.1 -U projectops -d projectops
```

```sql
SELECT * FROM projects;
SELECT status, COUNT(*) FROM projects GROUP BY status;
SELECT category, COUNT(*) FROM projects GROUP BY category;
```

## Docker

```bash
docker compose up --build
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose down
```

# API examples

Read all projects:

```bash
curl http://localhost:8080/api/projects
```

Create:

```bash
curl -X POST http://localhost:8080/api/projects \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"GitOps Production Platform",
    "category":"Kubernetes",
    "difficulty":"Advanced",
    "status":"Active",
    "owner":"Platform Team",
    "description":"Build a GitOps deployment platform with automated promotion.",
    "repositoryUrl":"https://github.com/jaiswaladi246",
    "progress":45
  }'
```

Update project 1:

```bash
curl -X PUT http://localhost:8080/api/projects/1 \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Production CI/CD Pipeline",
    "category":"CI/CD",
    "difficulty":"Advanced",
    "status":"Completed",
    "owner":"DevOps Shack",
    "description":"Secure CI/CD pipeline with testing, publishing, deployment and rollback.",
    "repositoryUrl":"https://github.com/jaiswaladi246",
    "progress":100
  }'
```

Delete project 1:

```bash
curl -X DELETE http://localhost:8080/api/projects/1
```

# Important architecture point

The Python application is **not** the database backend. Its role is the presentation tier. It serves the UI and proxies API requests.

The .NET application is the application/business tier. It owns validation, CRUD logic and PostgreSQL access.

PostgreSQL is the data tier. It never needs to be called directly from the browser.
