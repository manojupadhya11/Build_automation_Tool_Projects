import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'devopsshack-local-development')
    DB_PATH = str((ROOT_DIR / os.getenv('DB_PATH', 'data/devopsshack.db')).resolve())
    JSON_SORT_KEYS = False
