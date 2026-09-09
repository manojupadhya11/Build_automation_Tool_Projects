from pathlib import Path
import re
from flask import Blueprint, current_app, render_template, request


def create_pages_blueprint(db, repository):
    bp = Blueprint('pages', __name__)

    @bp.get('/')
    def home():
        return render_template('index.html')

    def display_db_path():
        path = Path(current_app.config['DB_PATH'])
        root = Path(current_app.root_path).parent
        try:
            return path.relative_to(root)
        except ValueError:
            return path

    def schema_rows():
        return [dict(row) for row in db.execute("PRAGMA table_info('projects')").fetchall()]

    @bp.route('/studio', methods=['GET'])
    def studio():
        return render_template('studio.html', db_path=display_db_path(), row_count=repository.stats()['total'], schema_rows=schema_rows(), query='SELECT * FROM projects ORDER BY id DESC LIMIT 20;', result=None, error=None)

    @bp.post('/studio/query')
    def studio_query():
        raw_query = (request.form.get('query') or '').strip()
        result, error = None, None
        try:
            if not re.match(r'^(select\b|pragma\s+table_info\s*\()', raw_query, re.I):
                raise ValueError('Database Studio is read-only. Use SELECT or PRAGMA table_info(...).')
            trimmed = re.sub(r';\s*$', '', raw_query)
            if ';' in trimmed:
                raise ValueError('Only one SQL statement can be executed at a time.')
            rows = db.execute(trimmed).fetchall()
            result = [dict(row) for row in rows]
        except Exception as exc:
            error = str(exc)
        return render_template('studio.html', db_path=display_db_path(), row_count=repository.stats()['total'], schema_rows=schema_rows(), query=raw_query, result=result, error=error)

    @bp.get('/api-docs')
    def api_docs():
        return render_template('api-docs.html')

    return bp
