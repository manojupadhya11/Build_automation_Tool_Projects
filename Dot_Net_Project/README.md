# ProjectOps Studio — .NET Edition

A complete ASP.NET Core + EF Core + SQLite CRUD application by **DevOps Shack**. It mirrors the Java, Node.js and Python ProjectOps functionality while using a different violet-and-coral UI.

## Features

- Full project CRUD: create, read, update, delete
- Search and filter by status, category and difficulty
- Dashboard metrics and status distribution
- Persistent SQLite database
- Safe read-only Database Studio
- REST API
- Input validation and useful API errors
- Responsive card/table views
- Health endpoint
- Automated integration/API tests with xUnit
- Docker + Docker Compose
- GitHub Actions CI

## Stack

- .NET 8
- ASP.NET Core MVC
- Entity Framework Core
- SQLite
- Razor Views
- HTML, CSS and JavaScript
- xUnit

## Project structure

```text
devops-shack-dotnet-projectops/
├── DevOpsShack.ProjectOps.sln
├── src/
│   └── DevOpsShack.ProjectOps/
│       ├── Program.cs                 # Entry point
│       ├── Controllers/               # Page + REST API controllers
│       ├── Data/                      # EF Core DbContext + DB seeding
│       ├── Dtos/                      # API request/response models
│       ├── Models/                    # Project entity
│       ├── Services/                  # Validation, CRUD, filters, stats
│       ├── Views/                     # Razor UI pages
│       ├── wwwroot/                   # CSS + browser JavaScript
│       └── data/devopsshack.db        # Persistent SQLite file
├── tests/DevOpsShack.ProjectOps.Tests/
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/dotnet-ci.yml
```

## Run locally

### 1. Verify .NET

```bash
dotnet --version
```

Use .NET 8 SDK or later compatible SDK.

### 2. Restore NuGet dependencies

```bash
dotnet restore DevOpsShack.ProjectOps.sln
```

### 3. Build

```bash
dotnet build DevOpsShack.ProjectOps.sln
```

### 4. Run

```bash
dotnet run --project src/DevOpsShack.ProjectOps/DevOpsShack.ProjectOps.csproj
```

Open:

- App: `http://localhost:5100`
- Database Studio: `http://localhost:5100/studio`
- REST API: `http://localhost:5100/api/projects`
- API docs: `http://localhost:5100/api-docs`
- Health: `http://localhost:5100/health`

## SQLite

The application uses the persistent file:

```text
src/DevOpsShack.ProjectOps/data/devopsshack.db
```

EF Core communicates with SQLite directly. No separate database server is required.

Direct CLI access:

```bash
sqlite3 src/DevOpsShack.ProjectOps/data/devopsshack.db
.tables
.headers on
.mode column
SELECT * FROM projects;
.quit
```

## Tests

```bash
dotnet test DevOpsShack.ProjectOps.sln
```

The test project uses `Microsoft.AspNetCore.Mvc.Testing` + xUnit and creates a temporary SQLite database, so tests do not modify the real application database.

## Build/publish artifact

Unlike Java, .NET normally produces DLLs when you build/publish:

```bash
dotnet publish src/DevOpsShack.ProjectOps/DevOpsShack.ProjectOps.csproj -c Release -o publish
```

Run the published application:

```bash
dotnet publish/DevOpsShack.ProjectOps.dll
```

## Docker

```bash
docker compose up --build
```

Then open `http://localhost:5100`.
