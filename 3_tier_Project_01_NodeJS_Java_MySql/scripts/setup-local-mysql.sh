#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v mysql >/dev/null 2>&1; then
  echo "MySQL client/server is not installed."
  echo "Ubuntu: sudo apt update && sudo apt install mysql-server -y"
  exit 1
fi

if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl start mysql 2>/dev/null || sudo service mysql start
else
  sudo service mysql start
fi

echo "Creating projectops database and application user..."
sudo mysql < "$ROOT_DIR/database/setup-local.sql"

echo "Verifying application credentials..."
MYSQL_PWD=projectops123 mysql -h 127.0.0.1 -P 3306 -u projectops projectops \
  -e "SELECT DATABASE() AS database_name;"

echo "MySQL is ready: projectops@127.0.0.1:3306/projectops"
