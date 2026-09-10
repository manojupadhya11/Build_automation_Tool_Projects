# ProjectOps REST API

Backend base URL: `http://localhost:8080`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Backend health |
| GET | `/api/projects` | List/filter projects |
| GET | `/api/projects/{id}` | Get one project |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/metadata` | Allowed UI values |

## Filters

```text
/api/projects?search=kubernetes&status=Active&category=Kubernetes&difficulty=Advanced
```

## Create/update payload

```json
{
  "title": "GitOps Platform",
  "category": "Kubernetes",
  "difficulty": "Advanced",
  "status": "Active",
  "owner": "Platform Team",
  "description": "Deploy applications through GitOps workflows.",
  "repositoryUrl": "https://github.com/example/project",
  "progress": 65
}
```
