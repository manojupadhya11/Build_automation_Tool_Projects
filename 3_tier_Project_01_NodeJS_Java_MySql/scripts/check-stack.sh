#!/usr/bin/env bash
set -euo pipefail

printf '%-20s' 'MySQL:'
if MYSQL_PWD=projectops123 mysql -h 127.0.0.1 -P 3306 -u projectops projectops -Nse 'SELECT 1' >/dev/null 2>&1; then
  echo 'UP'
else
  echo 'DOWN'
fi

printf '%-20s' 'Backend + DB:'
if command -v curl >/dev/null 2>&1 && curl -fsS http://127.0.0.1:8080/api/health >/tmp/projectops-health.json 2>/dev/null; then
  echo "UP  $(cat /tmp/projectops-health.json)"
else
  echo 'DOWN'
fi

printf '%-20s' 'Frontend:'
if command -v curl >/dev/null 2>&1 && curl -fsS http://127.0.0.1:5173/ >/dev/null 2>&1; then
  echo 'UP'
else
  echo 'DOWN'
fi
