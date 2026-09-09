# ProjectOps Studio REST API

Base URL: `http://localhost:3000`

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/projects` | List/filter projects |
| GET | `/api/projects/:id` | Get one project |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/stats` | Dashboard metrics |
| GET | `/api/metadata` | Allowed categories/statuses/difficulties |

### Filters

`GET /api/projects` accepts:

- `search`
- `status`
- `category`
- `difficulty`

Example:

```bash
curl "http://localhost:3000/api/projects?status=Active&difficulty=Advanced"
```
