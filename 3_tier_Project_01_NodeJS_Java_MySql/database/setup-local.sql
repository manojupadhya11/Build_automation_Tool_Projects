-- Native MySQL setup for the DevOps Shack ProjectOps application.
-- Run as an administrative MySQL user, e.g.:
--   sudo mysql < database/setup-local.sql

CREATE DATABASE IF NOT EXISTS projectops
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'projectops'@'localhost' IDENTIFIED BY 'projectops123';
CREATE USER IF NOT EXISTS 'projectops'@'127.0.0.1' IDENTIFIED BY 'projectops123';

ALTER USER 'projectops'@'localhost' IDENTIFIED BY 'projectops123';
ALTER USER 'projectops'@'127.0.0.1' IDENTIFIED BY 'projectops123';

GRANT ALL PRIVILEGES ON projectops.* TO 'projectops'@'localhost';
GRANT ALL PRIVILEGES ON projectops.* TO 'projectops'@'127.0.0.1';

FLUSH PRIVILEGES;
