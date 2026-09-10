#!/usr/bin/env bash
set -euo pipefail

cat <<'MSG'
This helper starts only the application services.
Make sure PostgreSQL is already running with:
  DB: projectops
  user: projectops
  password: projectops123
  port: 5432

It will start:
  .NET backend -> http://localhost:8080
  Python frontend -> http://localhost:5000
MSG

cleanup() {
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(
  cd backend-dotnet
  ASPNETCORE_URLS=http://localhost:8080 dotnet run
) &
BACKEND_PID=$!

sleep 3

(
  cd frontend-python
  if [ ! -d .venv ]; then python3 -m venv .venv; fi
  . .venv/bin/activate
  pip install -r requirements.txt
  BACKEND_URL=http://localhost:8080 python app.py
) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
