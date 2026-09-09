#!/usr/bin/env sh
set -eu
if ! command -v python3 >/dev/null 2>&1; then echo "Python 3 is required." >&2; exit 1; fi
python3 -m pip install -r requirements.txt
python3 app.py
