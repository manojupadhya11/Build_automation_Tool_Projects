# ProjectOps Studio — REST API

Base URL: `http://localhost:5000`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/projects` | List/search/filter projects |
| GET | `/api/projects/:id` | Get a project |
| POST | `/api/projects` | Create a project |
| PUT | `/api/projects/:id` | Update a project |
| DELETE | `/api/projects/:id` | Delete a project |
| GET | `/api/stats` | Dashboard metrics |
| GET | `/api/metadata` | Categories, difficulties, statuses |

Filters on `GET /api/projects`: `search`, `status`, `category`, `difficulty`.
