from urllib.parse import urlparse

CATEGORIES = ['CI/CD', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Cloud', 'DevSecOps', 'Monitoring', 'GitOps', 'Linux', 'Other']
DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']
STATUSES = ['Planned', 'Active', 'Completed', 'On Hold']


def clean(value):
    return value.strip() if isinstance(value, str) else ''


def normalize_project(data=None):
    data = data or {}
    return {
        'title': clean(data.get('title')),
        'category': clean(data.get('category')),
        'difficulty': clean(data.get('difficulty')),
        'status': clean(data.get('status')),
        'owner': clean(data.get('owner')),
        'description': clean(data.get('description')),
        'repository_url': clean(data.get('repository_url')) or None,
    }


def validate_project(data=None):
    project = normalize_project(data)
    errors = {}
    if not 3 <= len(project['title']) <= 120:
        errors['title'] = 'Title must be between 3 and 120 characters.'
    if project['category'] not in CATEGORIES:
        errors['category'] = 'Choose a valid category.'
    if project['difficulty'] not in DIFFICULTIES:
        errors['difficulty'] = 'Choose a valid difficulty.'
    if project['status'] not in STATUSES:
        errors['status'] = 'Choose a valid status.'
    if not 2 <= len(project['owner']) <= 80:
        errors['owner'] = 'Owner must be between 2 and 80 characters.'
    if not 10 <= len(project['description']) <= 800:
        errors['description'] = 'Description must be between 10 and 800 characters.'
    if project['repository_url']:
        parsed = urlparse(project['repository_url'])
        if parsed.scheme not in ('http', 'https') or not parsed.netloc:
            errors['repository_url'] = 'Repository URL must be a valid http/https URL.'
    return project, errors


def row_to_dict(row):
    return dict(row) if row is not None else None


class ProjectRepository:
    def __init__(self, db):
        self.db = db

    def list(self, filters=None):
        filters = filters or {}
        clauses, values = [], []
        search = clean(filters.get('search'))
        status = clean(filters.get('status'))
        category = clean(filters.get('category'))
        difficulty = clean(filters.get('difficulty'))

        if search:
            clauses.append('(LOWER(title) LIKE LOWER(?) OR LOWER(owner) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))')
            token = f'%{search}%'
            values.extend([token, token, token])
        if status in STATUSES:
            clauses.append('status = ?'); values.append(status)
        if category in CATEGORIES:
            clauses.append('category = ?'); values.append(category)
        if difficulty in DIFFICULTIES:
            clauses.append('difficulty = ?'); values.append(difficulty)

        where = f"WHERE {' AND '.join(clauses)}" if clauses else ''
        rows = self.db.execute(f'SELECT * FROM projects {where} ORDER BY datetime(updated_at) DESC, id DESC', values).fetchall()
        return [row_to_dict(row) for row in rows]

    def find_by_id(self, project_id):
        row = self.db.execute('SELECT * FROM projects WHERE id = ?', (int(project_id),)).fetchone()
        return row_to_dict(row)

    def create(self, data):
        project, errors = validate_project(data)
        if errors:
            return None, errors
        cursor = self.db.execute('''
            INSERT INTO projects (title, category, difficulty, status, owner, description, repository_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', tuple(project.values()))
        self.db.commit()
        return self.find_by_id(cursor.lastrowid), None

    def update(self, project_id, data):
        if not self.find_by_id(project_id):
            return None, None, True
        project, errors = validate_project(data)
        if errors:
            return None, errors, False
        self.db.execute('''
            UPDATE projects
            SET title=?, category=?, difficulty=?, status=?, owner=?, description=?, repository_url=?, updated_at=datetime('now')
            WHERE id=?
        ''', (*project.values(), int(project_id)))
        self.db.commit()
        return self.find_by_id(project_id), None, False

    def remove(self, project_id):
        if not self.find_by_id(project_id):
            return False
        self.db.execute('DELETE FROM projects WHERE id = ?', (int(project_id),))
        self.db.commit()
        return True

    def stats(self):
        scalar = lambda sql: int(self.db.execute(sql).fetchone()[0])
        by_status = [dict(row) for row in self.db.execute('SELECT status, COUNT(*) AS count FROM projects GROUP BY status ORDER BY count DESC')]
        by_category = [dict(row) for row in self.db.execute('SELECT category, COUNT(*) AS count FROM projects GROUP BY category ORDER BY count DESC, category')]
        return {
            'total': scalar('SELECT COUNT(*) FROM projects'),
            'active': scalar("SELECT COUNT(*) FROM projects WHERE status='Active'"),
            'completed': scalar("SELECT COUNT(*) FROM projects WHERE status='Completed'"),
            'advanced': scalar("SELECT COUNT(*) FROM projects WHERE difficulty='Advanced'"),
            'categories': scalar('SELECT COUNT(DISTINCT category) FROM projects'),
            'byStatus': by_status,
            'byCategory': by_category,
        }
