# ProjectOps Studio — Python Edition

A complete Python + Flask + SQLite CRUD application by **DevOps Shack**. It mirrors the Java/Node.js ProjectOps functionality while using a different blue-and-amber Python UI.

## Features

- Full project CRUD: create, read, update, delete
- Search and filter by status, category and difficulty
- Dashboard metrics and status distribution
- Persistent SQLite database
- Read-only Database Studio
- REST API
- Input validation and useful API errors
- Responsive cards/table views
- Health endpoint
- Automated tests
- Docker + Docker Compose
- GitHub Actions CI

## Stack

- Python 3.12+
- Flask
- Python built-in `sqlite3`
- HTML, CSS and JavaScript
- SQLite

## Project structure

```text
projectops-python/
├── app.py                    # Entry point
├── requirements.txt          # Python dependencies
├── projectops/
│   ├── __init__.py           # Flask application factory
│   ├── config.py             # Configuration
│   ├── db.py                 # SQLite schema/connection/seed
│   ├── routes/
│   │   ├── api.py            # REST API routes
│   │   └── pages.py          # Dashboard/Studio/API-doc pages
│   └── services/
│       └── project_service.py# Validation, CRUD, filters, statistics
├── templates/                # Flask HTML templates
├── static/                   # CSS and browser JavaScript
├── data/                     # SQLite database location
├── tests/                    # Automated API/CRUD tests
├── docs/API.md
├── Dockerfile
└── docker-compose.yml
```

## Run locally

### 1. Verify Python and pip

```bash
python3 --version
python3 -m pip --version
```

### 2. Create a virtual environment (recommended)

Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Start the application

```bash
python app.py
```

Open:

- App: `http://localhost:5000`
- Database Studio: `http://localhost:5000/studio`
- REST API: `http://localhost:5000/api/projects`
- API docs: `http://localhost:5000/api-docs`
- Health: `http://localhost:5000/health`

## SQLite

The application uses the persistent file:

```text
data/devopsshack.db
```

SQLite does not require a separate database server. Python talks to the `.db` file through its built-in `sqlite3` library.

Direct CLI access (if `sqlite3` is installed):

```bash
sqlite3 data/devopsshack.db
.tables
SELECT * FROM projects;
.quit
```

## Tests

```bash
python -m unittest discover -s tests -v
```

## Docker

```bash
docker compose up --build
```

Then open `http://localhost:5000`.
