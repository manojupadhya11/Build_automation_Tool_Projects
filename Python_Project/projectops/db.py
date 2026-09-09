import sqlite3
from pathlib import Path

SCHEMA = '''
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  status TEXT NOT NULL CHECK (status IN ('Planned', 'Active', 'Completed', 'On Hold')),
  owner TEXT NOT NULL,
  description TEXT NOT NULL,
  repository_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_difficulty ON projects(difficulty);
'''

SEED_PROJECTS = [
    ('Production CI/CD Pipeline', 'CI/CD', 'Advanced', 'Active', 'DevOps Shack',
     'Build a secure CI/CD pipeline with automated testing, image build, security scanning, deployment and rollback.',
     'https://github.com/jaiswaladi246'),
    ('Kubernetes Three-Tier App', 'Kubernetes', 'Advanced', 'Planned', 'Platform Team',
     'Deploy frontend, backend and database workloads with Services, ConfigMaps, Secrets and Ingress routing.',
     'https://github.com/jaiswaladi246'),
    ('Terraform Multi-AZ Infrastructure', 'Terraform', 'Intermediate', 'Completed', 'Cloud Team',
     'Provision reusable multi-AZ networking and compute infrastructure with Terraform modules and remote state.',
     'https://github.com/jaiswaladi246'),
    ('Container Security Pipeline', 'DevSecOps', 'Intermediate', 'Active', 'Security Team',
     'Scan dependencies, container images and IaC before promoting workloads through the delivery pipeline.',
     'https://github.com/jaiswaladi246'),
]


def connect_database(db_path):
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    return connection


def init_database(db_path):
    db = connect_database(db_path)
    db.executescript(SCHEMA)
    count = db.execute('SELECT COUNT(*) AS count FROM projects').fetchone()['count']
    if count == 0:
        db.executemany('''
            INSERT INTO projects
              (title, category, difficulty, status, owner, description, repository_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', SEED_PROJECTS)
        db.commit()
    return db
