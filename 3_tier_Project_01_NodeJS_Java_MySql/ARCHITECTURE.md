# Architecture

## Native local / same-VM run

```text
┌──────────────────────────────────────┐
│ Browser                              │
│ http://server:5173                   │
└───────────────────┬──────────────────┘
                    │ HTTP
                    ▼
┌──────────────────────────────────────┐
│ Tier 1 — React + Vite                │
│ 0.0.0.0:5173                         │
│                                      │
│ UI requests use /api                 │
│ Vite proxies /api -> 127.0.0.1:8080  │
└───────────────────┬──────────────────┘
                    │ REST / JSON
                    ▼
┌──────────────────────────────────────┐
│ Tier 2 — Spring Boot                 │
│ 127.0.0.1/host:8080                  │
└───────────────────┬──────────────────┘
                    │ JDBC / SQL
                    ▼
┌──────────────────────────────────────┐
│ Tier 3 — MySQL                       │
│ 127.0.0.1:3306                       │
│ database: projectops                 │
└──────────────────────────────────────┘
```

Each tier is an independent process. The reverse proxy only routes HTTP traffic and does not merge the frontend and backend into one tier.

## Why same-origin `/api` is used

Hard-coding `http://localhost:8080/api` inside browser JavaScript fails when a user opens an EC2-hosted frontend from a laptop, because browser `localhost` points to the laptop.

Using `/api` makes the browser call the same host that served the frontend. The frontend web server then forwards the API traffic to Spring Boot.

## Production separation

```text
React/Nginx host  --->  Spring Boot host  --->  MySQL/RDS host
      HTTP/HTTPS              JDBC/TCP
```

For separate hosts, configure the reverse proxy or `VITE_API_URL`, database environment variables, network/security rules, TLS, authentication, and restrictive CORS values.
